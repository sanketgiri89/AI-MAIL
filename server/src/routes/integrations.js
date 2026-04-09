// ===== Eclatrecon AI Mail - Integrations Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');

// =================== n8n CONNECTOR ===================
router.get('/n8n/trigger', authMiddleware, async (req, res) => {
    const { since, folder = 'inbox', limit = 20 } = req.query;
    let query = supabase.from('emails').select('id, subject, from_address, from_name, to_addresses, received_at, is_read, folder_type').eq('user_id', req.userId).eq('folder_type', folder);
    if (since) query = query.gt('received_at', since);
    const { data: emails } = await query.order('received_at', { ascending: false }).limit(Number(limit));
    res.json(emails || []);
});

router.post('/n8n/send', authMiddleware, async (req, res) => {
    const { to, subject, html, text, cc, bcc } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to and subject required' });
    const { data: account } = await supabase.from('mail_accounts').select('*').eq('user_id', req.userId).eq('is_primary', true).single();
    if (!account) return res.status(400).json({ error: 'No mail account configured' });
    try {
        const nodemailer = require('nodemailer');
        const t = nodemailer.createTransport({ host: account.smtp_host, port: account.smtp_port, secure: account.smtp_port === 465, auth: { user: account.username, pass: account.password_encrypted } });
        await t.sendMail({ from: `"${account.display_name || account.label}" <${account.email}>`, to, cc, bcc, subject, html, text });
        res.json({ success: true, message: `Email sent to ${to}` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/n8n/contacts', authMiddleware, async (req, res) => {
    const { name, email, phone, company } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const id = uuidv4();
    await supabase.from('contacts').upsert({ id, user_id: req.userId, name: name || '', email, phone: phone || '', company: company || '' }, { onConflict: 'user_id,email' });
    res.status(201).json({ id, email });
});

router.post('/n8n/tasks', authMiddleware, async (req, res) => {
    const { title, description, priority, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const id = uuidv4();
    await supabase.from('tasks').insert({ id, user_id: req.userId, title, description: description || '', priority: priority || 'P3', due_date: dueDate || null });
    res.status(201).json({ id, title });
});

// =================== SLACK / DISCORD ===================
router.post('/notify/slack', authMiddleware, async (req, res) => {
    const { webhookUrl, message, channel } = req.body;
    if (!webhookUrl || !message) return res.status(400).json({ error: 'webhookUrl and message required' });
    try {
        const r = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: message, channel: channel || undefined }) });
        res.json({ success: r.ok, status: r.status });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/notify/discord', authMiddleware, async (req, res) => {
    const { webhookUrl, content, embeds } = req.body;
    if (!webhookUrl || !content) return res.status(400).json({ error: 'webhookUrl and content required' });
    try {
        const r = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, embeds: embeds || undefined }) });
        res.json({ success: r.ok, status: r.status });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// =================== WEBHOOKS ===================
router.post('/hooks', authMiddleware, async (req, res) => {
    const { url, events } = req.body;
    if (!url) return res.status(400).json({ error: 'url required' });
    const id = uuidv4();
    const secret = require('crypto').randomBytes(32).toString('hex');
    await supabase.from('webhooks').insert({ id, user_id: req.userId, url, events: JSON.stringify(events || ['email.received']), secret, is_active: true });
    res.status(201).json({ id, secret, message: 'Webhook registered.' });
});

// =================== CLOUD STORAGE ===================
router.post('/storage/link', authMiddleware, (req, res) => {
    const { provider } = req.body;
    res.json({ message: `${provider} storage linked (stub).`, provider });
});

// =================== STATUS ===================
router.get('/status', (req, res) => {
    res.json({
        integrations: {
            n8n: { status: 'available', endpoints: ['/n8n/trigger', '/n8n/send', '/n8n/contacts', '/n8n/tasks'] },
            slack: { status: 'available', endpoint: '/notify/slack' },
            discord: { status: 'available', endpoint: '/notify/discord' },
            zapier: { status: 'available', endpoint: '/hooks' },
            cloudStorage: { status: 'stub', providers: ['google_drive', 'dropbox', 'onedrive'] }
        }
    });
});

module.exports = router;
