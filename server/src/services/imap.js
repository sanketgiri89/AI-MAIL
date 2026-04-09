// ===== Eclatrecon AI Mail - IMAP Sync Service =====
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');

class ImapService {
    constructor(io) {
        this.io = io;
        this.connections = new Map(); // userId -> { client, account }
        this.syncing = new Set();
        this.autoSyncInterval = null;
        this.autoSyncStarted = false;
    }

    // ===== Start auto-sync for ALL accounts every 5 minutes =====
    startAutoSync() {
        if (this.autoSyncStarted) return;
        this.autoSyncStarted = true;

        console.log('⏰ Auto-sync enabled: syncing all IMAP accounts every 5 minutes');

        // Initial sync after 10 seconds (let server fully start)
        setTimeout(() => this.syncAllAccounts(), 10000);

        // Then every 5 minutes
        this.autoSyncInterval = setInterval(() => {
            this.syncAllAccounts();
        }, 5 * 60 * 1000); // 5 minutes
    }

    // ===== Sync ALL accounts in the database =====
    async syncAllAccounts() {
        try {
            const { data: accounts } = await supabase.from('mail_accounts')
                .select('*, users(id)')
                .eq('sync_enabled', true);

            if (!accounts || accounts.length === 0) {
                console.log('📭 No sync-enabled accounts found');
                return;
            }

            console.log(`\n🔄 Auto-sync starting for ${accounts.length} account(s)...`);

            for (const account of accounts) {
                if (!account.imap_host) continue;
                const userId = account.user_id;
                const email = account.email || 'unknown';

                try {
                    let client = this.connections.get(account.id)?.client;

                    // Create new connection if needed
                    if (!client || !client.usable) {
                        client = new ImapFlow({
                            host: account.imap_host,
                            port: account.imap_port || 993,
                            secure: (account.imap_port || 993) === 993,
                            auth: { user: account.username, pass: account.password_encrypted },
                            logger: false, emitLogs: false,
                            tls: { rejectUnauthorized: false }
                        });

                        await client.connect();
                        this.connections.set(account.id, { client, account });
                        console.log(`📬 IMAP connected: ${email}`);
                    }

                    await this.syncInbox(userId, client, account);
                } catch (err) {
                    console.error(`❌ Sync failed for ${email}: ${err.message}`);
                    // Remove broken connection
                    this.connections.delete(account.id);
                }
            }

            console.log('✅ Auto-sync cycle complete\n');
        } catch (err) {
            console.error('❌ Auto-sync error:', err.message);
        }
    }

    // ===== Connect a single user's account =====
    async connect(userId, account) {
        const connKey = account.id;
        const email = account.email || 'unknown';

        if (this.connections.has(connKey)) {
            const existing = this.connections.get(connKey);
            if (existing.client?.usable) {
                await this.syncInbox(userId, existing.client, account);
                return;
            }
            this.connections.delete(connKey);
        }

        const client = new ImapFlow({
            host: account.imap_host,
            port: account.imap_port || 993,
            secure: (account.imap_port || 993) === 993,
            auth: { user: account.username, pass: account.password_encrypted },
            logger: false, emitLogs: false,
            tls: { rejectUnauthorized: false }
        });

        try {
            await client.connect();
            console.log(`📬 IMAP connected for ${email}`);
            this.connections.set(connKey, { client, account });
            await this.syncInbox(userId, client, account);

            // Listen for new emails (IDLE)
            client.on('exists', async () => {
                console.log(`📩 New email detected for ${email}`);
                try {
                    if (client.usable) await this.syncInbox(userId, client, account);
                } catch (e) { console.error(`IDLE sync error: ${e.message}`); }
            });

            client.on('close', () => {
                this.connections.delete(connKey);
                console.log(`📪 IMAP disconnected: ${email}`);
            });

            client.on('error', (err) => {
                console.error(`IMAP error for ${email}: ${err.message}`);
            });
        } catch (err) {
            console.error(`❌ IMAP connection failed for ${email}: ${err.message}`);
        }
    }

    // ===== Sync inbox for one account =====
    async syncInbox(userId, client, account) {
        const syncKey = account.id;
        const email = account.email || 'unknown';

        // Prevent concurrent syncs on the same account
        if (this.syncing.has(syncKey)) return { synced: 0, total: 0 };
        this.syncing.add(syncKey);

        let newCount = 0;
        let totalOnServer = 0;

        try {
            if (!client || !client.usable) {
                this.connections.delete(syncKey);
                this.syncing.delete(syncKey);
                return { synced: 0, total: 0 };
            }

            const lock = await client.getMailboxLock('INBOX');
            try {
                const status = await client.status('INBOX', { messages: true, unseen: true });
                totalOnServer = status.messages || 0;

                if (totalOnServer === 0) {
                    await supabase.from('mail_accounts').update({
                        last_sync: new Date().toISOString()
                    }).eq('id', account.id);
                    return { synced: 0, total: 0 };
                }

                console.log(`📊 INBOX for ${email}: ${totalOnServer} messages on server`);

                // Fetch all messages with UID
                const messages = client.fetch('1:*', {
                    source: true, envelope: true, uid: true
                });

                for await (const msg of messages) {
                    try {
                        const messageId = msg.envelope?.messageId;
                        if (!messageId) continue;

                        // Check if already imported (by message_id + user_id)
                        const { data: existing } = await supabase.from('emails')
                            .select('id')
                            .eq('message_id', messageId)
                            .eq('user_id', userId)
                            .single();
                        if (existing) continue;

                        const parsed = await simpleParser(msg.source);

                        // Address filtering — only import emails related to this account
                        const accountEmail = (account.email || '').toLowerCase().trim();
                        const allAddresses = [
                            ...(parsed.from?.value || []).map(a => (a.address || '').toLowerCase()),
                            ...(parsed.to?.value || []).map(a => (a.address || '').toLowerCase()),
                            ...(parsed.cc?.value || []).map(a => (a.address || '').toLowerCase()),
                            ...(parsed.bcc?.value || []).map(a => (a.address || '').toLowerCase())
                        ];
                        if (accountEmail && !allAddresses.includes(accountEmail)) continue;

                        // Determine folder type
                        const fromAddr = (parsed.from?.value?.[0]?.address || '').toLowerCase();
                        const folderType = (fromAddr === accountEmail) ? 'sent' : 'inbox';

                        const emailId = uuidv4();
                        const threadId = await this.getThreadId(userId, parsed);

                        await supabase.from('emails').insert({
                            id: emailId,
                            user_id: userId,
                            account_id: account.id,
                            message_id: parsed.messageId || `<${emailId}@imported>`,
                            thread_id: threadId,
                            in_reply_to: parsed.inReplyTo || null,
                            from_address: parsed.from?.value?.[0]?.address || '',
                            from_name: parsed.from?.value?.[0]?.name || '',
                            to_addresses: (parsed.to?.value || []).map(t => t.address).join(', '),
                            cc_addresses: (parsed.cc?.value || []).map(t => t.address).join(', '),
                            subject: parsed.subject || '(No subject)',
                            body_text: parsed.text || '',
                            body_html: parsed.html || '',
                            snippet: (parsed.text || '').substring(0, 200),
                            folder_type: folderType,
                            is_read: folderType === 'sent',
                            has_attachments: (parsed.attachments || []).length > 0,
                            raw_size: msg.source?.length || 0,
                            received_at: (parsed.date || new Date()).toISOString()
                        });

                        // Save attachments
                        if (parsed.attachments && parsed.attachments.length > 0) {
                            const fs = require('fs');
                            const pathMod = require('path');
                            const uploadsDir = pathMod.join(__dirname, '..', '..', 'uploads');
                            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
                            for (const att of parsed.attachments) {
                                const attId = uuidv4();
                                const attPath = pathMod.join(uploadsDir, `${attId}-${att.filename || 'attachment'}`);
                                fs.writeFileSync(attPath, att.content);
                                await supabase.from('attachments').insert({
                                    id: attId, email_id: emailId,
                                    filename: att.filename || 'attachment',
                                    mime_type: att.contentType,
                                    size: att.size, path: attPath
                                });
                            }
                        }

                        newCount++;

                        // Real-time notification
                        if (this.io && folderType === 'inbox') {
                            this.io.to(userId).emit('new-email', {
                                id: emailId,
                                from: parsed.from?.value?.[0]?.name || parsed.from?.value?.[0]?.address,
                                subject: parsed.subject,
                                snippet: (parsed.text || '').substring(0, 100),
                                receivedAt: (parsed.date || new Date()).toISOString()
                            });
                        }
                    } catch (msgErr) {
                        console.error(`⚠️ Error parsing message: ${msgErr.message}`);
                    }
                }

                // Update last sync time
                await supabase.from('mail_accounts').update({
                    last_sync: new Date().toISOString()
                }).eq('id', account.id);

                if (newCount > 0) {
                    console.log(`✅ Synced ${newCount} new emails for ${email}`);
                }
            } finally {
                lock.release();
            }
        } catch (err) {
            console.error(`❌ Sync error for ${email}: ${err.message}`);
        } finally {
            this.syncing.delete(syncKey);
        }

        return { synced: newCount, total: totalOnServer };
    }

    // ===== Manual sync (triggered by API) =====
    async manualSync(userId) {
        const { data: accounts } = await supabase.from('mail_accounts')
            .select('*').eq('user_id', userId).eq('sync_enabled', true);

        let totalSynced = 0;
        let totalOnServer = 0;

        for (const account of (accounts || [])) {
            if (!account.imap_host) continue;
            const connKey = account.id;
            let client = this.connections.get(connKey)?.client;

            if (!client || !client.usable) {
                const newClient = new ImapFlow({
                    host: account.imap_host,
                    port: account.imap_port || 993,
                    secure: (account.imap_port || 993) === 993,
                    auth: { user: account.username, pass: account.password_encrypted },
                    logger: false,
                    tls: { rejectUnauthorized: false }
                });

                try {
                    await newClient.connect();
                    this.connections.set(connKey, { client: newClient, account });
                    client = newClient;
                } catch (err) {
                    console.error(`❌ Manual sync connect failed for ${account.email}: ${err.message}`);
                    continue;
                }
            }

            const result = await this.syncInbox(userId, client, account);
            totalSynced += result.synced;
            totalOnServer += result.total;
        }

        return { synced: totalSynced, total: totalOnServer, accounts: (accounts || []).length };
    }

    // ===== Thread detection =====
    async getThreadId(userId, parsed) {
        if (parsed.inReplyTo) {
            const { data: parent } = await supabase.from('emails')
                .select('thread_id').eq('message_id', parsed.inReplyTo).eq('user_id', userId).single();
            if (parent) return parent.thread_id;
        }
        if (parsed.references && parsed.references.length > 0) {
            const { data: parent } = await supabase.from('emails')
                .select('thread_id').eq('message_id', parsed.references[0]).eq('user_id', userId).single();
            if (parent) return parent.thread_id;
        }
        return uuidv4();
    }

    // ===== Disconnect =====
    disconnect(userId) {
        // Disconnect all accounts for this user
        for (const [key, val] of this.connections) {
            if (val.account?.user_id === userId) {
                val.client?.logout().catch(() => {});
                this.connections.delete(key);
            }
        }
    }

    disconnectAll() {
        if (this.autoSyncInterval) clearInterval(this.autoSyncInterval);
        for (const [, val] of this.connections) {
            val.client?.logout().catch(() => {});
        }
        this.connections.clear();
    }
}

module.exports = ImapService;
