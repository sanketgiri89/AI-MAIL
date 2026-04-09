// ===== Eclatrecon AI Mail - POP3 Sync Service (Supabase) =====
const { simpleParser } = require('mailparser');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const net = require('net');
const tls = require('tls');

class Pop3Service {
    constructor(io) {
        this.io = io;
        this.syncing = new Set();
    }

    _createConnection(host, port, secure) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('POP3 connection timeout')), 15000);
            const onConnect = (socket) => {
                clearTimeout(timeout);
                socket.setEncoding('utf8');
                let buffer = '';
                const readLine = () => new Promise((res) => {
                    const check = () => { const idx = buffer.indexOf('\r\n'); if (idx !== -1) { const line = buffer.substring(0, idx); buffer = buffer.substring(idx + 2); res(line); return; } socket.once('data', (data) => { buffer += data; check(); }); }; check();
                });
                const readMultiLine = () => new Promise((res) => {
                    let lines = [];
                    const readNext = async () => { const line = await readLine(); if (line === '.') { res(lines); return; } lines.push(line.startsWith('..') ? line.substring(1) : line); readNext(); };
                    readNext();
                });
                const sendCommand = async (cmd) => { socket.write(cmd + '\r\n'); const response = await readLine(); if (!response.startsWith('+OK')) throw new Error(`POP3 error: ${response}`); return response; };
                resolve({ socket, readLine, readMultiLine, sendCommand });
            };
            if (secure || port === 995) {
                const socket = tls.connect({ host, port, rejectUnauthorized: false }, () => onConnect(socket));
                socket.on('error', (e) => { clearTimeout(timeout); reject(e); });
            } else {
                const socket = net.createConnection({ host, port }, () => onConnect(socket));
                socket.on('error', (e) => { clearTimeout(timeout); reject(e); });
            }
        });
    }

    async connect(userId, account) {
        const syncKey = `${userId}_${account.id}`;
        if (this.syncing.has(syncKey)) return;
        this.syncing.add(syncKey);
        try { await this.syncPop3(userId, account); }
        catch (err) { console.error(`❌ POP3 sync failed for ${account.email}:`, err.message); }
        finally { this.syncing.delete(syncKey); }
    }

    async syncPop3(userId, account) {
        const host = account.pop3_host || account.imap_host;
        const port = account.pop3_port || 995;
        if (!host) return { synced: 0, total: 0 };

        console.log(`📬 POP3 connecting to ${host}:${port} for ${account.email}...`);
        const conn = await this._createConnection(host, port, port === 995);

        try {
            await conn.readLine();
            await conn.sendCommand(`USER ${account.username}`);
            await conn.sendCommand(`PASS ${account.password_encrypted}`);

            const statResp = await conn.sendCommand('STAT');
            const totalMessages = parseInt(statResp.split(' ')[1]) || 0;
            console.log(`📊 POP3 INBOX for ${account.email}: ${totalMessages} messages`);

            if (totalMessages === 0) {
                await conn.sendCommand('QUIT'); conn.socket.destroy();
                await supabase.from('mail_accounts').update({ last_sync: new Date().toISOString() }).eq('id', account.id);
                return { synced: 0, total: 0 };
            }

            await conn.sendCommand('UIDL');
            const uidlLines = await conn.readMultiLine();
            const uidlMap = {};
            uidlLines.forEach(line => { const [num, uid] = line.split(' '); if (num && uid) uidlMap[parseInt(num)] = uid; });

            let newCount = 0;
            for (let msgNum = 1; msgNum <= totalMessages; msgNum++) {
                try {
                    const uid = uidlMap[msgNum];
                    const popMsgId = uid || `pop3-${account.id}-${msgNum}`;

                    const { data: existing } = await supabase.from('emails').select('id').eq('message_id', popMsgId).eq('account_id', account.id).single();
                    if (existing) continue;

                    await conn.sendCommand(`RETR ${msgNum}`);
                    const msgLines = await conn.readMultiLine();
                    const rawEmail = msgLines.join('\r\n');
                    const parsed = await simpleParser(rawEmail);

                    // Address filtering
                    const accountEmail = (account.email || '').toLowerCase().trim();
                    const allAddresses = [
                        ...(parsed.from?.value || []).map(a => (a.address || '').toLowerCase()),
                        ...(parsed.to?.value || []).map(a => (a.address || '').toLowerCase()),
                        ...(parsed.cc?.value || []).map(a => (a.address || '').toLowerCase()),
                        ...(parsed.bcc?.value || []).map(a => (a.address || '').toLowerCase())
                    ];
                    if (accountEmail && !allAddresses.includes(accountEmail)) continue;

                    const emailId = uuidv4();
                    const messageId = parsed.messageId || popMsgId;

                    const { data: existing2 } = await supabase.from('emails').select('id').eq('message_id', messageId).eq('account_id', account.id).single();
                    if (existing2) continue;

                    const threadId = await this._getThreadId(userId, parsed);

                    await supabase.from('emails').insert({
                        id: emailId, user_id: userId, account_id: account.id,
                        message_id: messageId, thread_id: threadId, in_reply_to: parsed.inReplyTo || null,
                        from_address: parsed.from?.value?.[0]?.address || '',
                        from_name: parsed.from?.value?.[0]?.name || '',
                        to_addresses: (parsed.to?.value || []).map(t => t.address).join(', '),
                        cc_addresses: (parsed.cc?.value || []).map(t => t.address).join(', '),
                        subject: parsed.subject || '(No subject)',
                        body_text: parsed.text || '', body_html: parsed.html || '',
                        snippet: (parsed.text || '').substring(0, 200),
                        folder_type: 'inbox', is_read: false,
                        has_attachments: (parsed.attachments || []).length > 0,
                        size: rawEmail.length || 0,
                        received_at: (parsed.date || new Date()).toISOString()
                    });

                    // Save attachments
                    if (parsed.attachments && parsed.attachments.length > 0) {
                        const fs = require('fs'); const path = require('path');
                        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
                        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
                        for (const att of parsed.attachments) {
                            const attId = uuidv4();
                            const attPath = path.join(uploadsDir, `${attId}-${att.filename || 'attachment'}`);
                            fs.writeFileSync(attPath, att.content);
                            await supabase.from('attachments').insert({ id: attId, email_id: emailId, filename: att.filename || 'attachment', mime_type: att.contentType, size: att.size, path: attPath });
                        }
                    }

                    newCount++;
                    if (this.io) {
                        this.io.to(userId).emit('new-email', {
                            id: emailId, from: parsed.from?.value?.[0]?.name || parsed.from?.value?.[0]?.address,
                            subject: parsed.subject, snippet: (parsed.text || '').substring(0, 100),
                            receivedAt: (parsed.date || new Date()).toISOString()
                        });
                    }
                } catch (msgErr) { console.error(`⚠️ POP3 Error parsing message ${msgNum}:`, msgErr.message); }
            }

            await supabase.from('mail_accounts').update({ last_sync: new Date().toISOString() }).eq('id', account.id);
            console.log(`✅ POP3 Synced ${newCount} new emails for ${account.email}`);
            try { await conn.sendCommand('QUIT'); } catch (e) {}
            conn.socket.destroy();
            return { synced: newCount, total: totalMessages };
        } catch (err) { try { conn.socket.destroy(); } catch (e) {} throw err; }
    }

    async _getThreadId(userId, parsed) {
        if (parsed.inReplyTo) {
            const { data: parent } = await supabase.from('emails').select('thread_id').eq('message_id', parsed.inReplyTo).eq('user_id', userId).single();
            if (parent) return parent.thread_id;
        }
        if (parsed.subject) {
            const cleanSubject = parsed.subject.replace(/^(Re|Fw|Fwd):\s*/gi, '').trim();
            const { data: match } = await supabase.from('emails').select('thread_id').eq('user_id', userId).ilike('subject', `%${cleanSubject}%`).order('received_at', { ascending: false }).limit(1).single();
            if (match) return match.thread_id;
        }
        return uuidv4();
    }

    async manualSync(userId) {
        const { data: accounts } = await supabase.from('mail_accounts').select('*').eq('user_id', userId).eq('sync_enabled', true).eq('incoming_protocol', 'pop3');
        let totalSynced = 0, totalOnServer = 0;
        for (const account of (accounts || [])) {
            try { const result = await this.syncPop3(userId, account); totalSynced += result.synced; totalOnServer += result.total; }
            catch (e) { console.error(`❌ POP3 manual sync failed for ${account.email}:`, e.message); }
        }
        return { synced: totalSynced, total: totalOnServer, accounts: (accounts || []).length };
    }
}

module.exports = Pop3Service;
