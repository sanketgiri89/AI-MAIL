// ===== Eclatrecon AI Mail - Folders, Labels, Contacts, Settings, Mail Accounts Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');
const { verifySmtp } = require('../services/smtp');

// ========= FOLDERS =========
router.get('/folders', authMiddleware, async (req, res) => {
    const { data: folders } = await supabase.from('folders').select('*').eq('user_id', req.userId).order('sort_order');
    res.json({ folders: folders || [] });
});

router.post('/folders', authMiddleware, async (req, res) => {
    const { name, icon } = req.body;
    const id = uuidv4();
    const { data: maxData } = await supabase.from('folders').select('sort_order').eq('user_id', req.userId).order('sort_order', { ascending: false }).limit(1).single();
    await supabase.from('folders').insert({ id, user_id: req.userId, name, type: 'custom', icon: icon || 'folder', sort_order: (maxData?.sort_order || 0) + 1 });
    res.status(201).json({ id, name });
});

router.delete('/folders/:id', authMiddleware, async (req, res) => {
    const { data: folder } = await supabase.from('folders').select('type').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!folder) return res.status(404).json({ error: 'Not found' });
    if (folder.type !== 'custom') return res.status(400).json({ error: 'Cannot delete system folders' });
    await supabase.from('folders').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Folder deleted' });
});

// ========= LABELS =========
router.get('/labels', authMiddleware, async (req, res) => {
    const { data: labels } = await supabase.from('labels').select('*').eq('user_id', req.userId);
    res.json({ labels: labels || [] });
});

router.post('/labels', authMiddleware, async (req, res) => {
    const { name, color } = req.body;
    const id = uuidv4();
    await supabase.from('labels').insert({ id, user_id: req.userId, name, color: color || '#ec5b13' });
    res.status(201).json({ id, name, color });
});

router.put('/labels/:id', authMiddleware, async (req, res) => {
    const { name, color } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (color) updates.color = color;
    await supabase.from('labels').update(updates).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Label updated' });
});

router.delete('/labels/:id', authMiddleware, async (req, res) => {
    await supabase.from('labels').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Label deleted' });
});

router.post('/emails/:emailId/labels/:labelId', authMiddleware, async (req, res) => {
    await supabase.from('email_labels').upsert({ email_id: req.params.emailId, label_id: req.params.labelId }, { onConflict: 'email_id,label_id' });
    res.json({ message: 'Label applied' });
});

router.delete('/emails/:emailId/labels/:labelId', authMiddleware, async (req, res) => {
    await supabase.from('email_labels').delete().eq('email_id', req.params.emailId).eq('label_id', req.params.labelId);
    res.json({ message: 'Label removed' });
});

// ========= CONTACTS =========
router.get('/contacts', authMiddleware, async (req, res) => {
    const { search } = req.query;
    let query = supabase.from('contacts').select('*').eq('user_id', req.userId);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data: contacts } = await query.order('name');
    res.json({ contacts: contacts || [] });
});

router.post('/contacts', authMiddleware, async (req, res) => {
    const { name, email, phone, company, notes } = req.body;
    const id = uuidv4();
    await supabase.from('contacts').insert({ id, user_id: req.userId, name, email, phone: phone || null, company: company || null, notes: notes || null });
    res.status(201).json({ id, name, email });
});

router.put('/contacts/:id', authMiddleware, async (req, res) => {
    const { name, email, phone, company, notes } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (company !== undefined) updates.company = company;
    if (notes !== undefined) updates.notes = notes;
    await supabase.from('contacts').update(updates).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Contact updated' });
});

router.delete('/contacts/:id', authMiddleware, async (req, res) => {
    await supabase.from('contacts').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Contact deleted' });
});

// ========= MAIL ACCOUNTS =========
router.get('/accounts', authMiddleware, async (req, res) => {
    const { data: accounts } = await supabase.from('mail_accounts')
        .select('id, label, display_name, email, smtp_host, smtp_port, imap_host, imap_port, pop3_host, pop3_port, incoming_protocol, username, encryption, is_primary, sync_enabled, last_sync, status')
        .eq('user_id', req.userId);
    res.json({ accounts: accounts || [] });
});

router.post('/accounts', authMiddleware, async (req, res) => {
    const { label, displayName, email, smtpHost, smtpPort, imapHost, imapPort, pop3Host, pop3Port, incomingProtocol, username, password, encryption, isPrimary } = req.body;
    const protocol = incomingProtocol || 'imap';

    if (smtpHost) {
        const verify = await verifySmtp({ host: smtpHost, port: smtpPort, user: username, pass: password, encryption });
        if (!verify.success) return res.status(400).json({ error: `SMTP verification failed: ${verify.error}` });
    }

    const { data: existing } = await supabase.from('mail_accounts').select('id').eq('user_id', req.userId).eq('email', email).single();
    if (existing) {
        await supabase.from('mail_accounts').update({
            smtp_host: smtpHost, smtp_port: smtpPort || 587, imap_host: imapHost, imap_port: imapPort || 993,
            pop3_host: pop3Host || null, pop3_port: pop3Port || 995, incoming_protocol: protocol,
            username, password_encrypted: password, encryption: encryption || 'TLS',
            label: label || 'Account', display_name: displayName || null
        }).eq('id', existing.id);
        if (isPrimary) {
            await supabase.from('mail_accounts').update({ is_primary: false }).eq('user_id', req.userId);
            await supabase.from('mail_accounts').update({ is_primary: true }).eq('id', existing.id);
        }
        if (protocol === 'pop3' && (pop3Host || imapHost)) {
            req.app.pop3Service?.connect(req.userId, { id: existing.id, pop3_host: pop3Host, pop3_port: pop3Port || 995, incoming_protocol: 'pop3', username, password_encrypted: password });
        } else if (imapHost) {
            req.app.imapService?.connect(req.userId, { id: existing.id, imap_host: imapHost, imap_port: imapPort || 993, username, password_encrypted: password });
        }
        return res.json({ id: existing.id, email, label: label || 'Account', updated: true });
    }

    if (isPrimary) await supabase.from('mail_accounts').update({ is_primary: false }).eq('user_id', req.userId);

    const id = uuidv4();
    await supabase.from('mail_accounts').insert({
        id, user_id: req.userId, label: label || 'Account', display_name: displayName || null, email,
        smtp_host: smtpHost, smtp_port: smtpPort || 587, imap_host: imapHost, imap_port: imapPort || 993,
        pop3_host: pop3Host || null, pop3_port: pop3Port || 995, incoming_protocol: protocol,
        username, password_encrypted: password, encryption: encryption || 'TLS', is_primary: !!isPrimary
    });

    if (protocol === 'pop3' && (pop3Host || imapHost)) {
        req.app.pop3Service?.connect(req.userId, { id, pop3_host: pop3Host, pop3_port: pop3Port || 995, incoming_protocol: 'pop3', username, password_encrypted: password, email });
    } else if (imapHost) {
        req.app.imapService?.connect(req.userId, { id, imap_host: imapHost, imap_port: imapPort || 993, username, password_encrypted: password });
    }
    res.status(201).json({ id, email, label });
});

router.put('/accounts/:id', authMiddleware, async (req, res) => {
    const { label, display_name, sync_enabled, email, smtp_host, smtp_port, imap_host, imap_port, pop3_host, pop3_port, incoming_protocol, username, password, encryption } = req.body;
    const { data: acc } = await supabase.from('mail_accounts').select('id').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!acc) return res.status(404).json({ error: 'Account not found' });
    const updates = {};
    if (label !== undefined) updates.label = label;
    if (display_name !== undefined) updates.display_name = display_name;
    if (sync_enabled !== undefined) updates.sync_enabled = !!sync_enabled;
    if (email !== undefined) updates.email = email;
    if (smtp_host !== undefined) updates.smtp_host = smtp_host;
    if (smtp_port !== undefined) updates.smtp_port = smtp_port;
    if (imap_host !== undefined) updates.imap_host = imap_host;
    if (imap_port !== undefined) updates.imap_port = imap_port;
    if (pop3_host !== undefined) updates.pop3_host = pop3_host;
    if (pop3_port !== undefined) updates.pop3_port = pop3_port;
    if (incoming_protocol !== undefined) updates.incoming_protocol = incoming_protocol;
    if (username !== undefined) updates.username = username;
    if (password !== undefined) updates.password_encrypted = password;
    if (encryption !== undefined) updates.encryption = encryption;
    if (Object.keys(updates).length) await supabase.from('mail_accounts').update(updates).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Account updated' });
});

// Connection test — no DB calls, kept as-is
router.post('/accounts/test-connection', authMiddleware, async (req, res) => {
    const { smtpHost, smtpPort, imapHost, imapPort, pop3Host, pop3Port, username, password, encryption } = req.body;
    const results = { smtp: { ok: false }, imap: { ok: false }, pop3: { ok: false } };
    if (smtpHost) {
        try {
            const nodemailer = require('nodemailer');
            const transport = nodemailer.createTransport({ host: smtpHost, port: smtpPort || 587, secure: (smtpPort || 587) === 465, auth: { user: username, pass: password }, connectionTimeout: 10000, greetingTimeout: 10000, tls: { rejectUnauthorized: false } });
            await transport.verify();
            results.smtp = { ok: true, message: `SMTP connected to ${smtpHost}:${smtpPort || 587}` };
            transport.close();
        } catch (e) { results.smtp = { ok: false, error: e.message }; }
    }
    if (imapHost) {
        try {
            const { ImapFlow } = require('imapflow');
            const client = new ImapFlow({ host: imapHost, port: imapPort || 993, secure: (imapPort || 993) === 993, auth: { user: username, pass: password }, logger: false, emitLogs: false, tls: { rejectUnauthorized: false } });
            await client.connect();
            results.imap = { ok: true, message: `IMAP connected to ${imapHost}:${imapPort || 993}` };
            await client.logout();
        } catch (e) { results.imap = { ok: false, error: e.message }; }
    }
    if (pop3Host) {
        try {
            const net = require('net'); const tls = require('tls'); const port = pop3Port || 995;
            const result = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('POP3 timeout')), 10000);
                const onSocket = (socket) => { clearTimeout(timeout); socket.setEncoding('utf8'); let buf = '';
                    const readLine = () => new Promise((res) => { const check = () => { const idx = buf.indexOf('\r\n'); if (idx !== -1) { const l = buf.substring(0, idx); buf = buf.substring(idx + 2); res(l); return; } socket.once('data', (d) => { buf += d; check(); }); }; check(); });
                    const send = async (cmd) => { socket.write(cmd + '\r\n'); const r = await readLine(); if (!r.startsWith('+OK')) throw new Error(r); return r; };
                    (async () => { await readLine(); await send(`USER ${username}`); await send(`PASS ${password}`); const stat = await send('STAT'); try { await send('QUIT'); } catch(e){} socket.destroy(); resolve(stat); })().catch((e) => { socket.destroy(); reject(e); });
                };
                if (port === 995) { const s = tls.connect({ host: pop3Host, port, rejectUnauthorized: false }, () => onSocket(s)); s.on('error', (e) => { clearTimeout(timeout); reject(e); }); }
                else { const s = net.createConnection({ host: pop3Host, port }, () => onSocket(s)); s.on('error', (e) => { clearTimeout(timeout); reject(e); }); }
            });
            results.pop3 = { ok: true, message: `POP3 connected — ${result}` };
        } catch (e) { results.pop3 = { ok: false, error: e.message }; }
    }
    res.json(results);
});

// Cleanup mismatched emails
router.post('/accounts/cleanup', authMiddleware, async (req, res) => {
    const { data: accounts } = await supabase.from('mail_accounts').select('id, email').eq('user_id', req.userId);
    let totalRemoved = 0;
    for (const acc of (accounts || [])) {
        const accEmail = acc.email.toLowerCase();
        const { data: emails } = await supabase.from('emails').select('id, from_address, to_addresses, cc_addresses').eq('account_id', acc.id).eq('user_id', req.userId);
        for (const em of (emails || [])) {
            const allAddr = `${em.from_address || ''} ${em.to_addresses || ''} ${em.cc_addresses || ''}`.toLowerCase();
            if (!allAddr.includes(accEmail)) {
                await supabase.from('emails').delete().eq('id', em.id);
                totalRemoved++;
            }
        }
    }
    res.json({ message: `Cleaned up ${totalRemoved} mismatched emails`, removed: totalRemoved });
});

router.delete('/accounts/:id', authMiddleware, async (req, res) => {
    const accountId = req.params.id;
    // Delete only emails from this specific account
    const { data: emails } = await supabase.from('emails').select('id').eq('account_id', accountId).eq('user_id', req.userId);
    if (emails && emails.length > 0) {
        const emailIds = emails.map(e => e.id);
        // Delete attachments for these emails
        await supabase.from('attachments').delete().in('email_id', emailIds);
        // Delete email labels
        await supabase.from('email_labels').delete().in('email_id', emailIds);
        // Delete the emails
        await supabase.from('emails').delete().eq('account_id', accountId).eq('user_id', req.userId);
    }
    // Delete the account
    await supabase.from('mail_accounts').delete().eq('id', accountId).eq('user_id', req.userId);
    if (req.app.imapService) req.app.imapService.disconnect(req.userId);
    res.json({ message: 'Account and related emails removed', emailsDeleted: (emails || []).length });
});

router.put('/accounts/:id/toggle-sync', authMiddleware, async (req, res) => {
    const { data: acc } = await supabase.from('mail_accounts').select('id, sync_enabled').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!acc) return res.status(404).json({ error: 'Account not found' });
    const newStatus = !acc.sync_enabled;
    await supabase.from('mail_accounts').update({ sync_enabled: newStatus }).eq('id', req.params.id);
    res.json({ success: true, sync_enabled: newStatus });
});

router.put('/accounts/:id/primary', authMiddleware, async (req, res) => {
    const { data: acc } = await supabase.from('mail_accounts').select('id').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!acc) return res.status(404).json({ error: 'Account not found' });
    await supabase.from('mail_accounts').update({ is_primary: false }).eq('user_id', req.userId);
    await supabase.from('mail_accounts').update({ is_primary: true }).eq('id', req.params.id);
    res.json({ success: true });
});

// ========= EMAIL RULES =========
router.get('/rules', authMiddleware, async (req, res) => {
    const { data: rules } = await supabase.from('email_rules').select('*').eq('user_id', req.userId);
    res.json({ rules: rules || [] });
});

router.post('/rules', authMiddleware, async (req, res) => {
    const { name, conditionField, conditionOperator, conditionValue, actionType, actionValue } = req.body;
    const id = uuidv4();
    await supabase.from('email_rules').insert({ id, user_id: req.userId, name, condition_field: conditionField, condition_operator: conditionOperator, condition_value: conditionValue, action_type: actionType, action_value: actionValue || null });
    res.status(201).json({ id, name });
});

router.delete('/rules/:id', authMiddleware, async (req, res) => {
    await supabase.from('email_rules').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Rule deleted' });
});

// ========= AUTO REPLY =========
router.get('/auto-reply', authMiddleware, async (req, res) => {
    const { data: reply } = await supabase.from('auto_replies').select('*').eq('user_id', req.userId).single();
    res.json({ autoReply: reply || null });
});

router.post('/auto-reply', authMiddleware, async (req, res) => {
    const { subject, body, startDate, endDate, isActive } = req.body;
    const { data: existing } = await supabase.from('auto_replies').select('id').eq('user_id', req.userId).single();
    if (existing) {
        await supabase.from('auto_replies').update({ subject, body, start_date: startDate, end_date: endDate, is_active: !!isActive }).eq('user_id', req.userId);
    } else {
        await supabase.from('auto_replies').insert({ id: uuidv4(), user_id: req.userId, subject, body, start_date: startDate, end_date: endDate, is_active: !!isActive });
    }
    res.json({ message: 'Auto-reply saved' });
});

// ========= AUDIT LOGS =========
router.get('/logs', authMiddleware, async (req, res) => {
    const { data: logs } = await supabase.from('audit_logs').select('*').eq('user_id', req.userId).order('created_at', { ascending: false }).limit(100);
    res.json({ logs: logs || [] });
});

module.exports = router;
