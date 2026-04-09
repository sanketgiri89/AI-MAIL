// ===== Eclatrecon AI Mail - Main Server (Supabase) =====
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { supabase, ensureUploadsDir } = require('./config/initDb');
const { authMiddleware } = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const ImapService = require('./services/imap');
const Pop3Service = require('./services/pop3');

// Ensure uploads dir
ensureUploadsDir();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }
});

app.io = io;
const imapService = new ImapService(io);
const pop3Service = new Pop3Service(io);
app.imapService = imapService;
app.pop3Service = pop3Service;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// ===== Frontend =====
const frontendDir = path.join(__dirname, '..', '..');
app.get('/', (req, res) => res.sendFile(path.join(frontendDir, 'landing.html')));

const pageRoutes = {
    '/login': 'login.html', '/signup': 'signup.html', '/app': 'index.html', '/mail': 'index.html',
    '/admin': 'admin.html', '/docs': 'docs.html', '/marketing': 'marketing.html', '/setup': 'setup.html',
    '/forgot-password': 'forgot-password.html', '/landing': 'landing.html', '/ai-tools': 'ai-tools.html',
};
Object.entries(pageRoutes).forEach(([route, file]) => {
    app.get(route, (req, res) => res.sendFile(path.join(frontendDir, file)));
});

app.use(express.static(frontendDir, { extensions: false, index: false }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/v1', require('./routes/publicApi'));
app.use('/api', require('./routes/features'));

const BulkSender = require('./services/bulkSender');
const bulkSenderInstance = new BulkSender();
const campaignRoutes = require('./routes/campaigns');
campaignRoutes.setBulkSender(bulkSenderInstance);
app.use('/api/campaigns', campaignRoutes);

app.use('/api/teams', require('./routes/teams'));
app.use('/api', require('./routes/productivity'));
app.use('/api/security', require('./routes/security'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/data', require('./routes/dataManagement'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/apify', require('./routes/apify'));
app.use('/api/v1', require('./routes/publicApi'));
app.use('/api/developer', require('./routes/publicApi'));
app.use('/api', require('./routes/features'));
app.use('/api', require('./routes/manage'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), version: '1.0.0', database: 'supabase', domain: 'llmx.in' });
});

// === Background Workers (60s interval) ===
const WebhookService = require('./services/webhooks');
setInterval(async () => {
    try {
        // === Scheduled Email Worker ===
        const now = new Date().toISOString();
        const { data: pending } = await supabase.from('scheduled_emails').select('*').eq('status', 'pending').lte('send_at', now);
        for (const e of (pending || [])) {
            const { data: account } = await supabase.from('mail_accounts').select('*').eq('user_id', e.user_id).eq('is_primary', true).single();
            if (!account) { await supabase.from('scheduled_emails').update({ status: 'failed', error: 'No mail account' }).eq('id', e.id); continue; }
            try {
                const nodemailer = require('nodemailer');
                const t = nodemailer.createTransport({ host: account.smtp_host, port: account.smtp_port, secure: account.smtp_port === 465, auth: { user: account.username, pass: account.password_encrypted } });
                await t.sendMail({ from: `"${account.display_name || account.label}" <${account.email}>`, to: e.to_addresses, cc: e.cc_addresses, bcc: e.bcc_addresses, subject: e.subject, text: e.body_text, html: e.body_html });
                await supabase.from('scheduled_emails').update({ status: 'sent' }).eq('id', e.id);
                console.log(`📨 Scheduled email sent: ${e.subject}`);
                WebhookService.fire(e.user_id, 'email.scheduled_sent', { emailId: e.id, subject: e.subject });
            } catch (err) { await supabase.from('scheduled_emails').update({ status: 'failed', error: err.message }).eq('id', e.id); }
        }

        // === Campaign Scheduler ===
        const { data: scheduled } = await supabase.from('campaigns').select('*').eq('status', 'scheduled').lte('schedule_at', now);
        for (const c of (scheduled || [])) {
            console.log(`📢 Auto-starting scheduled campaign: ${c.name}`);
            bulkSenderInstance.startCampaign(c.id);
        }

        // === Drip Sequence Worker ===
        const { data: dripDue } = await supabase.from('drip_enrollments').select('*, drip_sequences(user_id)').eq('status', 'active').lte('next_send_at', now);
        for (const enr of (dripDue || [])) {
            const userId = enr.drip_sequences?.user_id;
            if (!userId) continue;
            const { data: nextStep } = await supabase.from('drip_steps').select('*').eq('sequence_id', enr.sequence_id).eq('step_order', enr.current_step + 1).single();
            if (!nextStep) { await supabase.from('drip_enrollments').update({ status: 'completed' }).eq('id', enr.id); continue; }
            const { data: sub } = await supabase.from('subscribers').select('*').eq('id', enr.subscriber_id).single();
            if (!sub || sub.status !== 'active') { await supabase.from('drip_enrollments').update({ status: 'skipped' }).eq('id', enr.id); continue; }
            const { data: account } = await supabase.from('mail_accounts').select('*').eq('user_id', userId).eq('is_primary', true).single();
            if (account) {
                try {
                    const nodemailer = require('nodemailer');
                    const t = nodemailer.createTransport({ host: account.smtp_host, port: account.smtp_port, secure: account.smtp_port === 465, auth: { user: account.username, pass: account.password_encrypted } });
                    const subject = bulkSenderInstance.mergeTags(nextStep.subject, sub);
                    const html = bulkSenderInstance.mergeTags(nextStep.body_html, sub);
                    await t.sendMail({ from: `"${account.display_name || account.label}" <${account.email}>`, to: sub.email, subject, html, text: nextStep.body_text });
                    console.log(`💧 Drip step ${nextStep.step_order} sent to ${sub.email}`);
                } catch (err) { console.error(`Drip send error: ${err.message}`); }
            }
            const { data: followingStep } = await supabase.from('drip_steps').select('*').eq('sequence_id', enr.sequence_id).eq('step_order', enr.current_step + 2).single();
            if (followingStep) {
                const nextSend = new Date(Date.now() + followingStep.delay_hours * 3600000).toISOString();
                await supabase.from('drip_enrollments').update({ current_step: enr.current_step + 1, next_send_at: nextSend }).eq('id', enr.id);
            } else {
                await supabase.from('drip_enrollments').update({ current_step: enr.current_step + 1, status: 'completed' }).eq('id', enr.id);
            }
        }

        // === Snooze Un-snoozer ===
        const { data: snoozedDue } = await supabase.from('snoozed_emails').select('*').eq('status', 'snoozed').lte('snooze_until', now);
        for (const s of (snoozedDue || [])) {
            await supabase.from('emails').update({ folder_type: s.original_folder || 'inbox', is_read: false }).eq('id', s.email_id);
            await supabase.from('snoozed_emails').update({ status: 'restored' }).eq('id', s.id);
            io.to(s.user_id).emit('snooze-restored', { emailId: s.email_id });
            console.log(`⏰ Snooze restored for email ${s.email_id}`);
        }

        // === Reminder Worker ===
        const { data: remindersDue } = await supabase.from('reminders').select('*').eq('status', 'pending').lte('remind_at', now);
        for (const r of (remindersDue || [])) {
            io.to(r.user_id).emit('reminder', { id: r.id, title: r.title, emailId: r.email_id });
            if (r.is_recurring && r.recurrence_interval) {
                const next = new Date(new Date(r.remind_at).getTime() + parseInt(r.recurrence_interval) * 3600000).toISOString();
                await supabase.from('reminders').update({ remind_at: next }).eq('id', r.id);
            } else {
                await supabase.from('reminders').update({ status: 'fired' }).eq('id', r.id);
            }
            console.log(`🔔 Reminder fired: ${r.title}`);
        }

        // === Email Expiry Worker ===
        const { data: expiredEmails } = await supabase.from('email_expiry').select('*').eq('status', 'active').lte('expires_at', now);
        for (const ee of (expiredEmails || [])) {
            await supabase.from('emails').delete().eq('id', ee.email_id);
            await supabase.from('email_expiry').update({ status: 'expired' }).eq('id', ee.id);
            console.log(`💀 Expired email deleted: ${ee.email_id}`);
        }
    } catch (err) { console.error('Worker error:', err.message); }
}, 60000);

// Socket.IO auth & real-time
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
        try { const decoded = jwt.verify(token, process.env.JWT_SECRET); socket.userId = decoded.userId; next(); }
        catch (e) { next(new Error('Authentication error')); }
    } else { next(new Error('No token')); }
});

io.on('connection', async (socket) => {
    const userId = socket.userId;
    console.log(`🔌 User connected: ${userId}`);
    socket.join(userId);

    // Start sync for user's accounts
    const { data: accounts } = await supabase.from('mail_accounts').select('*').eq('user_id', userId).eq('sync_enabled', true);
    for (const account of (accounts || [])) {
        if (account.incoming_protocol === 'pop3' && (account.pop3_host || account.imap_host)) {
            pop3Service.connect(userId, account);
        } else if (account.imap_host) {
            imapService.connect(userId, account);
        }
    }

    socket.on('mark-read', async (data) => {
        await supabase.from('emails').update({ is_read: true }).eq('id', data.emailId).eq('user_id', userId);
        io.to(userId).emit('email-updated', { emailId: data.emailId, is_read: true });
    });

    socket.on('star-toggle', async (data) => {
        const { data: email } = await supabase.from('emails').select('is_starred').eq('id', data.emailId).eq('user_id', userId).single();
        if (email) {
            const newVal = !email.is_starred;
            await supabase.from('emails').update({ is_starred: newVal }).eq('id', data.emailId);
            io.to(userId).emit('email-updated', { emailId: data.emailId, is_starred: newVal });
        }
    });

    socket.on('typing', (data) => { socket.to(userId).emit('user-typing', data); });

    socket.on('replying-to', async (data) => {
        const { data: user } = await supabase.from('users').select('name').eq('id', userId).single();
        socket.broadcast.emit('user-replying', { emailId: data.emailId, userId, userName: user?.name || 'Someone' });
    });
    socket.on('replying-done', (data) => { socket.broadcast.emit('user-replying-done', { emailId: data.emailId, userId }); });

    socket.on('disconnect', () => { socket.broadcast.emit('user-replying-done', { userId }); console.log(`🔌 User disconnected: ${userId}`); });
});

// 404
app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found' });
    res.status(404).sendFile(path.join(frontendDir, '404.html'));
});

// Error handling
app.use((err, req, res, next) => { console.error('Server error:', err); res.status(500).json({ error: 'Internal server error' }); });

// Start
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║    🚀 Eclatrecon AI Mail (Supabase)        ║
    ║    Port: ${PORT}                          ║
    ║    Frontend: ${process.env.FRONTEND_URL}  ║
    ║    API: http://localhost:${PORT}/api      ║
    ╚════════════════════════════════════════╝
    `);

    // Start automatic IMAP sync for all accounts (every 5 minutes)
    imapService.startAutoSync();
});

process.on('SIGINT', () => { console.log('\n🛑 Shutting down...'); imapService.disconnectAll(); server.close(() => process.exit(0)); });

module.exports = { app, server, io };
