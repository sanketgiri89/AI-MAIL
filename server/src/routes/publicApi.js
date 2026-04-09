// ===== Eclatrecon AI Mail - Public API Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');
const WebhookService = require('../services/webhooks');

// ===== API Key Middleware =====
async function apiKeyAuth(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (!apiKey) return res.status(401).json({ error: 'API key required.' });
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const { data: key } = await supabase.from('api_keys').select('*').eq('key_hash', keyHash).eq('is_active', true).single();
    if (!key) return res.status(401).json({ error: 'Invalid or inactive API key' });
    if (key.expires_at && new Date(key.expires_at) < new Date()) return res.status(401).json({ error: 'API key expired' });
    await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', key.id);
    req.userId = key.user_id;
    req.apiKeyId = key.id;
    req.apiPermissions = key.permissions;
    next();
}

function requirePermission(perm) {
    return (req, res, next) => {
        const perms = (req.apiPermissions || '').split(',').map(p => p.trim());
        if (!perms.includes(perm) && !perms.includes('full')) return res.status(403).json({ error: `Permission '${perm}' required` });
        next();
    };
}

// ===== API KEY MANAGEMENT =====
router.post('/keys', authMiddleware, async (req, res) => {
    const { name, permissions = 'read', expiresInDays } = req.body;
    if (!name) return res.status(400).json({ error: 'Key name required' });
    const rawKey = 'nm_' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 10);
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null;
    const id = uuidv4();
    await supabase.from('api_keys').insert({ id, user_id: req.userId, name, key_hash: keyHash, key_prefix: keyPrefix, permissions, expires_at: expiresAt });
    res.status(201).json({ id, name, key: rawKey, prefix: keyPrefix, permissions, expiresAt, message: 'Save this key now!' });
});

router.get('/keys', authMiddleware, async (req, res) => {
    const { data: keys } = await supabase.from('api_keys').select('id, name, key_prefix, permissions, rate_limit, last_used_at, expires_at, is_active, created_at').eq('user_id', req.userId).order('created_at', { ascending: false });
    res.json({ keys: keys || [] });
});

router.delete('/keys/:id', authMiddleware, async (req, res) => {
    await supabase.from('api_keys').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'API key revoked' });
});

// ===== WEBHOOK MANAGEMENT =====
router.post('/webhooks', authMiddleware, async (req, res) => {
    const { url, events } = req.body;
    if (!url || !events) return res.status(400).json({ error: 'URL and events required' });
    const secret = WebhookService.generateSecret();
    const id = uuidv4();
    const eventsStr = Array.isArray(events) ? events.join(',') : events;
    await supabase.from('webhooks').insert({ id, user_id: req.userId, url, events: eventsStr, secret });
    res.status(201).json({ id, url, events: eventsStr, secret, message: 'Save the secret' });
});

router.get('/webhooks', authMiddleware, async (req, res) => {
    const { data: hooks } = await supabase.from('webhooks').select('id, url, events, is_active, last_triggered_at, failure_count, created_at').eq('user_id', req.userId).order('created_at', { ascending: false });
    res.json({ webhooks: hooks || [] });
});

router.delete('/webhooks/:id', authMiddleware, async (req, res) => {
    await supabase.from('webhooks').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Webhook deleted' });
});

router.get('/webhooks/:id/logs', authMiddleware, async (req, res) => {
    const { data: logs } = await supabase.from('webhook_logs').select('*').eq('webhook_id', req.params.id).order('created_at', { ascending: false }).limit(50);
    res.json({ logs: logs || [] });
});

router.put('/webhooks/:id/toggle', authMiddleware, async (req, res) => {
    const { data: hook } = await supabase.from('webhooks').select('is_active').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!hook) return res.status(404).json({ error: 'Webhook not found' });
    await supabase.from('webhooks').update({ is_active: !hook.is_active, failure_count: 0 }).eq('id', req.params.id);
    res.json({ message: 'Webhook toggled', isActive: !hook.is_active });
});

// ===== PUBLIC API ENDPOINTS =====
router.get('/me', apiKeyAuth, async (req, res) => {
    const { data: user } = await supabase.from('users').select('id, email, name, display_name, created_at').eq('id', req.userId).single();
    res.json({ user });
});

router.get('/emails', apiKeyAuth, requirePermission('read'), async (req, res) => {
    const { folder = 'inbox', page = 1, limit = 50, unread, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let query = supabase.from('emails').select('id, from_address, from_name, to_addresses, subject, snippet, is_read, is_starred, has_attachments, received_at', { count: 'exact' }).eq('user_id', req.userId).eq('folder_type', folder);
    if (unread === 'true') query = query.eq('is_read', false);
    if (search) query = query.or(`subject.ilike.%${search}%,from_address.ilike.%${search}%`);
    const { data: emails, count: total } = await query.order('received_at', { ascending: false }).range(offset, offset + Number(limit) - 1);
    res.json({ emails: emails || [], total: total || 0, page: Number(page), limit: Number(limit) });
});

router.get('/emails/:id', apiKeyAuth, requirePermission('read'), async (req, res) => {
    const { data: email } = await supabase.from('emails').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!email) return res.status(404).json({ error: 'Email not found' });
    const { data: attachments } = await supabase.from('attachments').select('id, filename, mime_type, size').eq('email_id', email.id);
    res.json({ email, attachments: attachments || [] });
});

router.post('/emails/send', apiKeyAuth, requirePermission('send'), async (req, res) => {
    const { to, cc, bcc, subject, bodyText, bodyHtml, replyTo } = req.body;
    if (!to || !subject) return res.status(400).json({ error: 'to and subject required' });
    const { data: account } = await supabase.from('mail_accounts').select('*').eq('user_id', req.userId).eq('is_primary', true).single();
    if (!account) return res.status(400).json({ error: 'No mail account configured' });
    try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({ host: account.smtp_host, port: account.smtp_port, secure: account.smtp_port === 465, auth: { user: account.username, pass: account.password_encrypted } });
        const info = await transporter.sendMail({ from: `"${account.display_name || account.label}" <${account.email}>`, to, cc, bcc, subject, text: bodyText, html: bodyHtml, replyTo });
        const emailId = uuidv4();
        await supabase.from('emails').insert({ id: emailId, user_id: req.userId, folder_type: 'sent', from_address: account.email, from_name: account.display_name || account.label, to_addresses: to, cc_addresses: cc || '', bcc_addresses: bcc || '', subject, body_text: bodyText || '', body_html: bodyHtml || '', snippet: (bodyText || '').slice(0, 120), is_read: true });
        WebhookService.fire(req.userId, 'email.sent', { emailId, to, subject });
        res.json({ message: 'Email sent', messageId: info.messageId, emailId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/emails/:id', apiKeyAuth, requirePermission('write'), async (req, res) => {
    await supabase.from('emails').delete().eq('id', req.params.id).eq('user_id', req.userId);
    WebhookService.fire(req.userId, 'email.deleted', { emailId: req.params.id });
    res.json({ message: 'Email deleted' });
});

router.put('/emails/:id', apiKeyAuth, requirePermission('write'), async (req, res) => {
    const { isRead, isStarred, folder } = req.body;
    const updates = {};
    if (isRead !== undefined) updates.is_read = !!isRead;
    if (isStarred !== undefined) updates.is_starred = !!isStarred;
    if (folder) updates.folder_type = folder;
    if (Object.keys(updates).length) await supabase.from('emails').update(updates).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Email updated' });
});

router.get('/contacts', apiKeyAuth, requirePermission('read'), async (req, res) => {
    const { data: contacts } = await supabase.from('contacts').select('*').eq('user_id', req.userId).order('name');
    res.json({ contacts: contacts || [] });
});

router.post('/contacts', apiKeyAuth, requirePermission('write'), async (req, res) => {
    const { name, email, phone, company, notes } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });
    const id = uuidv4();
    await supabase.from('contacts').insert({ id, user_id: req.userId, name, email, phone: phone || '', company: company || '', notes: notes || '' });
    res.json({ id, name, email });
});

router.delete('/contacts/:id', apiKeyAuth, requirePermission('write'), async (req, res) => {
    await supabase.from('contacts').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Contact deleted' });
});

router.get('/folders', apiKeyAuth, requirePermission('read'), async (req, res) => {
    const { data: folders } = await supabase.from('folders').select('*').eq('user_id', req.userId);
    res.json({ folders: folders || [] });
});

router.get('/labels', apiKeyAuth, requirePermission('read'), async (req, res) => {
    const { data: labels } = await supabase.from('labels').select('*').eq('user_id', req.userId);
    res.json({ labels: labels || [] });
});

router.get('/search', apiKeyAuth, requirePermission('read'), async (req, res) => {
    const { q, limit = 20 } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query (q) required' });
    const tsQuery = q.split(/\s+/).join(' & ');
    const { data: emails } = await supabase.from('emails').select('id, from_address, from_name, subject, snippet, folder_type, received_at').eq('user_id', req.userId).textSearch('search_vector', tsQuery).order('received_at', { ascending: false }).limit(Number(limit));
    res.json({ results: emails || [], query: q });
});

router.get('/account/stats', apiKeyAuth, async (req, res) => {
    const { data: user } = await supabase.from('users').select('storage_used, storage_limit').eq('id', req.userId).single();
    const { count: emailCount } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId);
    const { count: unreadCount } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).eq('is_read', false).eq('folder_type', 'inbox');
    const { count: contactCount } = await supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', req.userId);
    res.json({ storageUsed: user?.storage_used || 0, storageLimit: user?.storage_limit || 0, emailCount: emailCount || 0, unreadCount: unreadCount || 0, contactCount: contactCount || 0 });
});

module.exports = router;
