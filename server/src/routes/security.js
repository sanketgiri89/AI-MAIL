// ===== Eclatrecon AI Mail - Security & Compliance Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');

// =================== DLP ===================
router.get('/dlp-rules', authMiddleware, async (req, res) => {
    const { data: rules } = await supabase.from('dlp_rules').select('*').order('created_at', { ascending: false });
    res.json({ rules: rules || [] });
});

router.post('/dlp-rules', authMiddleware, async (req, res) => {
    const { name, pattern, action } = req.body;
    if (!name || !pattern) return res.status(400).json({ error: 'name and pattern required' });
    const id = uuidv4();
    await supabase.from('dlp_rules').insert({ id, name, pattern, action: action || 'warn', created_by: req.userId });
    res.status(201).json({ id, name });
});

router.delete('/dlp-rules/:id', authMiddleware, async (req, res) => {
    await supabase.from('dlp_rules').delete().eq('id', req.params.id);
    res.json({ message: 'DLP rule deleted' });
});

router.post('/dlp-check', authMiddleware, async (req, res) => {
    const { text } = req.body;
    if (!text) return res.json({ violations: [] });
    const { data: rules } = await supabase.from('dlp_rules').select('*').eq('is_active', true);
    const violations = [];
    for (const rule of (rules || [])) {
        try {
            const regex = new RegExp(rule.pattern, 'gi');
            const matches = text.match(regex);
            if (matches) violations.push({ rule: rule.name, action: rule.action, matchCount: matches.length });
        } catch (e) { }
    }
    res.json({ violations, blocked: violations.some(v => v.action === 'block') });
});

// =================== IP WHITELIST ===================
router.get('/ip-whitelist', authMiddleware, async (req, res) => {
    const { data: ips } = await supabase.from('ip_whitelist').select('*').order('created_at', { ascending: false });
    res.json({ ips: ips || [] });
});

router.post('/ip-whitelist', authMiddleware, async (req, res) => {
    const { ipAddress, label } = req.body;
    if (!ipAddress) return res.status(400).json({ error: 'ipAddress required' });
    const id = uuidv4();
    await supabase.from('ip_whitelist').insert({ id, ip_address: ipAddress, label: label || '', created_by: req.userId });
    res.status(201).json({ id });
});

router.delete('/ip-whitelist/:id', authMiddleware, async (req, res) => {
    await supabase.from('ip_whitelist').delete().eq('id', req.params.id);
    res.json({ message: 'IP removed' });
});

// =================== EMAIL EXPIRY ===================
router.post('/email-expiry', authMiddleware, async (req, res) => {
    const { emailId, expiresAt } = req.body;
    if (!emailId || !expiresAt) return res.status(400).json({ error: 'emailId and expiresAt required' });
    const id = uuidv4();
    await supabase.from('email_expiry').insert({ id, email_id: emailId, expires_at: expiresAt });
    res.status(201).json({ id, message: `Email will expire at ${expiresAt}` });
});

router.get('/email-expiry', authMiddleware, async (req, res) => {
    const { data: expiring } = await supabase.from('email_expiry').select('*').eq('status', 'active').order('expires_at');
    res.json({ expiring: expiring || [] });
});

// =================== PHISHING DETECTION ===================
router.post('/phishing-check', authMiddleware, (req, res) => {
    const { html, urls } = req.body;
    const suspicious = [];
    const phishingDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd', 'buff.ly', 'ow.ly'];
    const checkUrls = urls || (html ? html.match(/https?:\/\/[^\s"<>]+/gi) || [] : []);
    for (const url of checkUrls) {
        try {
            const u = new URL(url);
            if (phishingDomains.some(d => u.hostname.includes(d))) suspicious.push({ url, reason: 'URL shortener detected' });
            if (u.hostname.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/)) suspicious.push({ url, reason: 'IP address in URL' });
            if (u.hostname.includes('login') || u.hostname.includes('secure') || u.hostname.includes('verify')) suspicious.push({ url, reason: 'Suspicious domain keywords' });
            if (u.hostname.split('.').length > 4) suspicious.push({ url, reason: 'Excessive subdomains' });
        } catch (e) { suspicious.push({ url, reason: 'Malformed URL' }); }
    }
    res.json({ suspicious, riskLevel: suspicious.length > 3 ? 'high' : suspicious.length > 0 ? 'medium' : 'low' });
});

// =================== AUDIT TRAIL ===================
router.get('/audit-trail', authMiddleware, async (req, res) => {
    const { userId, action, limit = 100 } = req.query;
    let query = supabase.from('audit_trail').select('*');
    if (userId) query = query.eq('user_id', userId);
    if (action) query = query.eq('action', action);
    const { data: logs } = await query.order('created_at', { ascending: false }).limit(Number(limit));
    res.json({ logs: logs || [] });
});

// =================== GDPR ===================
router.post('/gdpr/export', authMiddleware, async (req, res) => {
    const { data: user } = await supabase.from('users').select('id, email, name, display_name, created_at').eq('id', req.userId).single();
    const { data: emails } = await supabase.from('emails').select('id, subject, from_address, to_addresses, received_at, folder_type').eq('user_id', req.userId);
    const { data: contacts } = await supabase.from('contacts').select('*').eq('user_id', req.userId);
    const { data: accounts } = await supabase.from('mail_accounts').select('id, email, label, created_at').eq('user_id', req.userId);
    const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', req.userId);
    const { data: notes } = await supabase.from('notes').select('*').eq('user_id', req.userId);
    await supabase.from('gdpr_requests').insert({ id: uuidv4(), user_id: req.userId, request_type: 'export', status: 'completed', completed_at: new Date().toISOString() });
    const exportData = { user, emails: emails||[], contacts: contacts||[], accounts: accounts||[], tasks: tasks||[], notes: notes||[], exportedAt: new Date().toISOString() };
    res.set({ 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="gdpr_export.json"' });
    res.json(exportData);
});

router.post('/gdpr/delete', authMiddleware, async (req, res) => {
    const { confirm } = req.body;
    if (confirm !== 'DELETE_MY_DATA') return res.status(400).json({ error: 'Send { "confirm": "DELETE_MY_DATA" } to proceed' });
    await supabase.from('gdpr_requests').insert({ id: uuidv4(), user_id: req.userId, request_type: 'deletion', status: 'pending' });
    res.json({ message: 'Deletion request submitted. Admin will process within 30 days.' });
});

router.get('/gdpr/requests', authMiddleware, async (req, res) => {
    const { data: requests } = await supabase.from('gdpr_requests').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    res.json({ requests: requests || [] });
});

module.exports = router;
