// ===== Eclatrecon AI Mail - Full Admin Panel Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');

const SERVER_START = Date.now();

// Admin middleware
async function adminMiddleware(req, res, next) {
    const { data: user } = await supabase.from('users').select('is_admin').eq('id', req.userId).single();
    if (!user || !user.is_admin) return res.status(403).json({ error: 'Admin access required' });
    next();
}

// POST /bootstrap
router.post('/bootstrap', authMiddleware, async (req, res) => {
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_admin', true);
    if (count > 0) return res.status(400).json({ error: 'Admin already exists' });
    await supabase.from('users').update({ is_admin: true }).eq('id', req.userId);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'bootstrap_admin', details: 'First admin created' });
    res.json({ message: 'You are now admin!' });
});

// =================== DASHBOARD ===================
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    const { count: totalUsers } = await supabase.from('users').select('id', { count: 'exact', head: true });
    const { count: totalEmails } = await supabase.from('emails').select('id', { count: 'exact', head: true });
    const { data: storageData } = await supabase.from('users').select('storage_used');
    const totalStorage = (storageData || []).reduce((sum, u) => sum + (u.storage_used || 0), 0);
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const { count: activeToday } = await supabase.from('sessions').select('user_id', { count: 'exact', head: true }).gte('created_at', yesterday);
    const { count: emailsSentToday } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('folder_type', 'sent').gte('created_at', yesterday);
    const { count: emailsReceivedToday } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('folder_type', 'inbox').gte('created_at', yesterday);
    const { count: spamBlocked } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('folder_type', 'spam');
    const { count: totalContacts } = await supabase.from('contacts').select('id', { count: 'exact', head: true });
    const { count: totalAccounts } = await supabase.from('mail_accounts').select('id', { count: 'exact', head: true });
    const { count: totalAttachments } = await supabase.from('attachments').select('id', { count: 'exact', head: true });
    const { count: activeSessions } = await supabase.from('sessions').select('id', { count: 'exact', head: true });
    res.json({ stats: { totalUsers: totalUsers||0, totalEmails: totalEmails||0, totalStorage, activeToday: activeToday||0, emailsSentToday: emailsSentToday||0, emailsReceivedToday: emailsReceivedToday||0, spamBlocked: spamBlocked||0, totalContacts: totalContacts||0, totalAccounts: totalAccounts||0, totalAttachments: totalAttachments||0, activeSessions: activeSessions||0 } });
});

// =================== USER MANAGEMENT ===================
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: users } = await supabase.from('users')
        .select('id, email, name, display_name, phone, location, job_title, timezone, language, theme, storage_used, storage_limit, totp_enabled, is_admin, created_at, updated_at')
        .order('created_at', { ascending: false });
    res.json({ users: users || [] });
});

router.get('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: user } = await supabase.from('users')
        .select('id, email, name, display_name, phone, location, job_title, timezone, language, theme, storage_used, storage_limit, totp_enabled, is_admin, created_at, updated_at')
        .eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { data: accounts } = await supabase.from('mail_accounts').select('*').eq('user_id', req.params.id);
    const { data: folders } = await supabase.from('folders').select('*').eq('user_id', req.params.id);
    const { data: labels } = await supabase.from('labels').select('*').eq('user_id', req.params.id);
    const { data: rules } = await supabase.from('email_rules').select('*').eq('user_id', req.params.id);
    const { data: autoReply } = await supabase.from('auto_replies').select('*').eq('user_id', req.params.id);
    res.json({ user, accounts: accounts||[], folders: folders||[], labels: labels||[], rules: rules||[], autoReply: autoReply||[] });
});

router.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
    const { email, password, name, storageLimit, isAdmin } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Missing required fields' });
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'Email already exists' });
    const userId = uuidv4();
    const hash = await bcrypt.hash(password, 12);
    await supabase.from('users').insert({ id: userId, email, password_hash: hash, name, storage_limit: storageLimit || 15737418240, is_admin: !!isAdmin });
    const folders = [{ n: 'Inbox', t: 'inbox' }, { n: 'Sent', t: 'sent' }, { n: 'Drafts', t: 'drafts' }, { n: 'Spam', t: 'spam' }, { n: 'Trash', t: 'trash' }];
    await supabase.from('folders').insert(folders.map(f => ({ id: uuidv4(), user_id: userId, name: f.n, type: f.t })));
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_create_user', details: `Created: ${email}` });
    res.status(201).json({ id: userId, email, name });
});

router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { name, displayName, phone, location, jobTitle, timezone, language, theme, storageLimit, isAdmin } = req.body;
    const { data: user } = await supabase.from('users').select('id').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updates = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (displayName) updates.display_name = displayName;
    if (phone) updates.phone = phone;
    if (location) updates.location = location;
    if (jobTitle) updates.job_title = jobTitle;
    if (timezone) updates.timezone = timezone;
    if (language) updates.language = language;
    if (theme) updates.theme = theme;
    if (storageLimit) updates.storage_limit = storageLimit;
    if (isAdmin !== undefined) updates.is_admin = !!isAdmin;
    await supabase.from('users').update(updates).eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_update_user', details: `Updated: ${req.params.id}` });
    res.json({ message: 'User updated' });
});

router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    if (req.params.id === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
    const { data: user } = await supabase.from('users').select('email').eq('id', req.params.id).single();
    await supabase.from('users').delete().eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_delete_user', details: `Deleted: ${user?.email}` });
    res.json({ message: 'User deleted' });
});

router.put('/users/:id/reset-password', authMiddleware, adminMiddleware, async (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be 6+ characters' });
    const hash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_reset_password', details: `Reset for: ${req.params.id}` });
    res.json({ message: 'Password reset' });
});

router.put('/users/:id/toggle-admin', authMiddleware, adminMiddleware, async (req, res) => {
    if (req.params.id === req.userId) return res.status(400).json({ error: 'Cannot change your own role' });
    const { data: user } = await supabase.from('users').select('is_admin, email').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const newRole = !user.is_admin;
    await supabase.from('users').update({ is_admin: newRole }).eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_toggle_role', details: `${user.email} → ${newRole ? 'Admin' : 'User'}` });
    res.json({ message: `User is now ${newRole ? 'Admin' : 'User'}`, isAdmin: newRole });
});

router.put('/users/:id/disable-2fa', authMiddleware, adminMiddleware, async (req, res) => {
    await supabase.from('users').update({ totp_enabled: false, totp_secret: null }).eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_disable_2fa', details: `Disabled 2FA: ${req.params.id}` });
    res.json({ message: '2FA disabled' });
});

// =================== EMAIL MANAGEMENT ===================
router.get('/emails', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId, folder, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let query = supabase.from('emails').select('*', { count: 'exact' });
    if (userId) query = query.eq('user_id', userId);
    if (folder) query = query.eq('folder_type', folder);
    if (search) query = query.or(`subject.ilike.%${search}%,from_address.ilike.%${search}%,to_addresses.ilike.%${search}%`);
    const { data: emails, count: total } = await query.order('received_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);
    res.json({ emails: emails || [], total: total || 0, page: Number(page), limit: Number(limit) });
});

router.delete('/emails/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: email } = await supabase.from('emails').select('subject').eq('id', req.params.id).single();
    await supabase.from('emails').delete().eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_delete_email', details: `Deleted: ${email?.subject}` });
    res.json({ message: 'Email deleted' });
});

router.delete('/emails/bulk/delete', authMiddleware, adminMiddleware, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
    await supabase.from('emails').delete().in('id', ids);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_bulk_delete_emails', details: `Deleted ${ids.length} emails` });
    res.json({ message: `${ids.length} emails deleted` });
});

// =================== MAIL ACCOUNTS ===================
router.get('/accounts', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: accounts } = await supabase.from('mail_accounts').select('*').order('created_at', { ascending: false });
    res.json({ accounts: accounts || [] });
});

router.delete('/accounts/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: acc } = await supabase.from('mail_accounts').select('email').eq('id', req.params.id).single();
    await supabase.from('mail_accounts').delete().eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_delete_account', details: `Removed: ${acc?.email}` });
    res.json({ message: 'Account removed' });
});

// =================== SESSION MANAGEMENT ===================
router.get('/sessions', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: sessions } = await supabase.from('sessions').select('*').order('created_at', { ascending: false });
    res.json({ sessions: sessions || [] });
});

router.delete('/sessions/:id', authMiddleware, adminMiddleware, async (req, res) => {
    await supabase.from('sessions').delete().eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_revoke_session', details: `Session: ${req.params.id}` });
    res.json({ message: 'Session revoked' });
});

router.delete('/sessions/user/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    const { count } = await supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('user_id', req.params.userId);
    await supabase.from('sessions').delete().eq('user_id', req.params.userId);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_revoke_all_sessions', details: `All sessions for: ${req.params.userId}` });
    res.json({ message: `${count || 0} sessions revoked` });
});

// =================== AUDIT LOGS ===================
router.get('/logs', authMiddleware, adminMiddleware, async (req, res) => {
    const { page = 1, limit = 100, userId, action } = req.query;
    const offset = (page - 1) * limit;
    let query = supabase.from('audit_logs').select('*', { count: 'exact' });
    if (userId) query = query.eq('user_id', userId);
    if (action) query = query.ilike('action', `%${action}%`);
    const { data: logs, count: total } = await query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);
    res.json({ logs: logs || [], total: total || 0, page: Number(page) });
});

router.delete('/logs/clear', authMiddleware, adminMiddleware, async (req, res) => {
    const { count } = await supabase.from('audit_logs').select('id', { count: 'exact', head: true });
    await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_clear_logs', details: `Cleared ${count || 0} log entries` });
    res.json({ message: `${count || 0} logs cleared` });
});

// =================== SECURITY ===================
router.post('/block-sender', authMiddleware, adminMiddleware, async (req, res) => {
    const { email, reason } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'block_sender', details: `Blocked: ${email} - ${reason || 'No reason'}` });
    res.json({ message: `${email} blocked` });
});

router.get('/blocked-senders', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: blocked } = await supabase.from('audit_logs').select('details, created_at').eq('action', 'block_sender').order('created_at', { ascending: false });
    res.json({ blocked: (blocked || []).map(b => ({ ...b, email: b.details.replace('Blocked: ', '').split(' - ')[0], reason: b.details.split(' - ')[1] || '' })) });
});

// =================== STORAGE ===================
router.get('/storage', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: users } = await supabase.from('users').select('id, email, name, storage_used, storage_limit').order('storage_used', { ascending: false });
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    let uploadsSize = 0;
    try { if (fs.existsSync(uploadsDir)) { fs.readdirSync(uploadsDir).forEach(f => { try { uploadsSize += fs.statSync(path.join(uploadsDir, f)).size; } catch(e){} }); } } catch(e){}
    res.json({ users: users||[], totalStorage: 0, totalLimit: 0, dbSize: 0, uploadsSize });
});

router.put('/storage/:userId', authMiddleware, adminMiddleware, async (req, res) => {
    const { storageLimit } = req.body;
    await supabase.from('users').update({ storage_limit: storageLimit }).eq('id', req.params.userId);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_update_storage', details: `Set storage for ${req.params.userId}` });
    res.json({ message: 'Storage limit updated' });
});

// =================== SERVER HEALTH ===================
router.get('/health', authMiddleware, adminMiddleware, async (req, res) => {
    const uptime = Date.now() - SERVER_START;
    const memUsage = process.memoryUsage();
    const tableStats = {};
    const tables = ['users', 'emails', 'attachments', 'folders', 'labels', 'contacts', 'mail_accounts', 'sessions', 'email_rules', 'auto_replies', 'audit_logs'];
    for (const t of tables) {
        const { count } = await supabase.from(t).select('id', { count: 'exact', head: true });
        tableStats[t] = count || 0;
    }
    res.json({
        server: { uptime, uptimeStr: formatUptime(uptime), nodeVersion: process.version, platform: os.platform(), arch: os.arch(), hostname: os.hostname() },
        memory: { rss: memUsage.rss, heapUsed: memUsage.heapUsed, heapTotal: memUsage.heapTotal, external: memUsage.external },
        system: { totalMem: os.totalmem(), freeMem: os.freemem(), cpus: os.cpus().length, loadAvg: os.loadavg() },
        database: { type: 'supabase-postgresql', tables: tableStats },
        env: { port: process.env.PORT || 3001, nodeEnv: process.env.NODE_ENV || 'development' }
    });
});

function formatUptime(ms) {
    const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const h = Math.floor(m / 60); const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
    if (h > 0) return `${h}h ${m % 60}m ${s % 60}s`;
    return `${m}m ${s % 60}s`;
}

// =================== BROADCAST ===================
router.post('/broadcast', authMiddleware, adminMiddleware, async (req, res) => {
    const { subject, message } = req.body;
    if (!subject || !message) return res.status(400).json({ error: 'Subject and message required' });
    const { data: users } = await supabase.from('users').select('id');
    const emailInserts = [];
    for (const u of (users || [])) {
        const { data: inboxFolder } = await supabase.from('folders').select('id').eq('user_id', u.id).eq('type', 'inbox').single();
        emailInserts.push({
            id: uuidv4(), user_id: u.id, folder_id: inboxFolder?.id || null, folder_type: 'inbox',
            from_address: 'system@eclatrecon-mail.com', from_name: 'System Admin',
            to_addresses: 'All Users', subject, body_text: message,
            body_html: `<div style="padding:20px;background:#1a1a1a;border-radius:8px;border:1px solid rgba(236,91,19,0.3)"><h3 style="color:#ec5b13;margin:0 0 12px 0">📢 System Announcement</h3><p style="color:#e2e8f0;margin:0;line-height:1.6">${message}</p></div>`,
            snippet: message.slice(0, 100), is_read: false
        });
    }
    if (emailInserts.length) await supabase.from('emails').insert(emailInserts);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_broadcast', details: `Broadcast: ${subject} → ${(users||[]).length} users` });
    res.json({ message: `Broadcast sent to ${(users||[]).length} users` });
});

// =================== DOMAINS ===================
router.get('/domains', authMiddleware, adminMiddleware, (req, res) => {
    res.json({
        domains: [{ domain: 'eclatrecon-mail.com', status: 'active', mx: true, spf: true, dkim: false, dmarc: false }],
        dnsRecords: [
            { type: 'MX', host: '@', value: 'mail.eclatrecon-mail.com', priority: 10, status: 'active' },
            { type: 'TXT', host: '@', value: 'v=spf1 include:eclatrecon-mail.com ~all', status: 'pending' },
            { type: 'TXT', host: 'dkim._domainkey', value: 'v=DKIM1; k=rsa; p=...', status: 'not configured' },
            { type: 'TXT', host: '_dmarc', value: 'v=DMARC1; p=none; rua=mailto:admin@eclatrecon-mail.com', status: 'not configured' }
        ]
    });
});

// =================== RULES & CONTACTS ===================
router.get('/rules', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: rules } = await supabase.from('email_rules').select('*').order('created_at', { ascending: false });
    res.json({ rules: rules || [] });
});

router.delete('/rules/:id', authMiddleware, adminMiddleware, async (req, res) => {
    await supabase.from('email_rules').delete().eq('id', req.params.id);
    res.json({ message: 'Rule deleted' });
});

router.get('/contacts', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: contacts } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
    res.json({ contacts: contacts || [] });
});

// =================== SUBSCRIPTIONS & PLANS ===================
router.get('/plans', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: plans } = await supabase.from('plans').select('*').order('price_monthly', { ascending: true });
    res.json({ plans: plans || [] });
});

router.put('/plans/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { name, price_monthly, max_storage_mb, max_emails_per_day, max_api_calls_per_hour, max_accounts, features } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (price_monthly !== undefined) updates.price_monthly = price_monthly;
    if (max_storage_mb) updates.max_storage_mb = max_storage_mb;
    if (max_emails_per_day) updates.max_emails_per_day = max_emails_per_day;
    if (max_api_calls_per_hour) updates.max_api_calls_per_hour = max_api_calls_per_hour;
    if (max_accounts) updates.max_accounts = max_accounts;
    if (features) updates.features = features;
    await supabase.from('plans').update(updates).eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_update_plan', details: `Updated plan: ${req.params.id}` });
    res.json({ message: 'Plan updated' });
});

router.get('/subscriptions', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: subs } = await supabase.from('subscriptions').select('*, users(email, name), plans(name, price_monthly)').order('created_at', { ascending: false });
    res.json({ subscriptions: subs || [] });
});

router.put('/subscriptions/:userId/plan', authMiddleware, adminMiddleware, async (req, res) => {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: 'Plan ID required' });
    const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', req.params.userId).single();
    if (existing) {
        await supabase.from('subscriptions').update({ plan_id: planId }).eq('user_id', req.params.userId);
    } else {
        await supabase.from('subscriptions').insert({ id: uuidv4(), user_id: req.params.userId, plan_id: planId, status: 'active' });
    }
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_change_plan', details: `User ${req.params.userId} → Plan ${planId}` });
    res.json({ message: 'Subscription updated' });
});

// =================== CAMPAIGNS OVERVIEW ===================
router.get('/campaigns', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: campaigns } = await supabase.from('campaigns').select('*, users(email, name)').order('created_at', { ascending: false });
    const { count: totalCampaigns } = await supabase.from('campaigns').select('id', { count: 'exact', head: true });
    const { count: activeCampaigns } = await supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('status', 'sending');
    const { count: totalSubscribers } = await supabase.from('subscribers').select('id', { count: 'exact', head: true });
    const { count: totalLists } = await supabase.from('subscriber_lists').select('id', { count: 'exact', head: true });
    res.json({ campaigns: campaigns || [], stats: { totalCampaigns: totalCampaigns||0, activeCampaigns: activeCampaigns||0, totalSubscribers: totalSubscribers||0, totalLists: totalLists||0 } });
});

router.put('/campaigns/:id/pause', authMiddleware, adminMiddleware, async (req, res) => {
    await supabase.from('campaigns').update({ status: 'paused' }).eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_pause_campaign', details: `Paused: ${req.params.id}` });
    res.json({ message: 'Campaign paused' });
});

router.delete('/campaigns/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: c } = await supabase.from('campaigns').select('name').eq('id', req.params.id).single();
    await supabase.from('campaigns').delete().eq('id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_delete_campaign', details: `Deleted: ${c?.name}` });
    res.json({ message: 'Campaign deleted' });
});

// =================== LOGIN HISTORY ===================
router.get('/login-history', authMiddleware, adminMiddleware, async (req, res) => {
    const { userId, status, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;
    let query = supabase.from('login_history').select('*, users(email, name)', { count: 'exact' });
    if (userId) query = query.eq('user_id', userId);
    if (status) query = query.eq('status', status);
    const { data: history, count: total } = await query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);
    res.json({ history: history || [], total: total || 0, page: Number(page) });
});

// =================== SYSTEM SETTINGS ===================
// In-memory settings with DB persistence
let systemSettings = { platformName: 'Eclatrecon AI Mail', maintenanceMode: false, registrationEnabled: true, defaultStorageLimit: 15737418240, maxUploadSize: 25000000, smtpRateLimit: 100, requireEmailVerification: false, sessionTimeout: 168 };

router.get('/settings', authMiddleware, adminMiddleware, (req, res) => {
    res.json({ settings: systemSettings });
});

router.put('/settings', authMiddleware, adminMiddleware, async (req, res) => {
    const allowed = ['platformName', 'maintenanceMode', 'registrationEnabled', 'defaultStorageLimit', 'maxUploadSize', 'smtpRateLimit', 'requireEmailVerification', 'sessionTimeout'];
    for (const key of allowed) {
        if (req.body[key] !== undefined) systemSettings[key] = req.body[key];
    }
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_update_settings', details: `Updated: ${Object.keys(req.body).filter(k => allowed.includes(k)).join(', ')}` });
    res.json({ message: 'Settings saved', settings: systemSettings });
});

// =================== USER SUSPEND/UNSUSPEND ===================
router.put('/users/:id/suspend', authMiddleware, adminMiddleware, async (req, res) => {
    if (req.params.id === req.userId) return res.status(400).json({ error: 'Cannot suspend yourself' });
    const { data: user } = await supabase.from('users').select('email').eq('id', req.params.id).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Delete all sessions to force logout
    await supabase.from('sessions').delete().eq('user_id', req.params.id);
    await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: req.userId, action: 'admin_suspend_user', details: `Suspended: ${user.email}` });
    res.json({ message: `${user.email} suspended and all sessions revoked` });
});

// =================== EXPORT ALL USERS (CSV) ===================
router.get('/users/export/csv', authMiddleware, adminMiddleware, async (req, res) => {
    const { data: users } = await supabase.from('users').select('name, email, phone, location, job_title, timezone, is_admin, totp_enabled, storage_used, storage_limit, created_at').order('created_at', { ascending: false });
    const headers = ['Name', 'Email', 'Phone', 'Location', 'Job Title', 'Timezone', 'Admin', '2FA', 'Storage Used', 'Storage Limit', 'Created'];
    let csv = headers.join(',') + '\n';
    for (const u of (users || [])) {
        csv += [u.name, u.email, u.phone||'', u.location||'', u.job_title||'', u.timezone, u.is_admin?'Yes':'No', u.totp_enabled?'Yes':'No', u.storage_used, u.storage_limit, u.created_at].map(v => `"${(String(v||'')).replace(/"/g, '""')}"`).join(',') + '\n';
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="users_${Date.now()}.csv"`);
    res.send(csv);
});

module.exports = router;

