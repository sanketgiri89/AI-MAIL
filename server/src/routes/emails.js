// ===== Eclatrecon AI Mail - Email Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');
const { sendEmail } = require('../services/smtp');
const multer = require('multer');
const path = require('path');

// File upload config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// 1x1 transparent GIF pixel (43 bytes)
const TRACKING_PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

// POST /api/emails/sync - Manual IMAP sync
router.post('/sync', authMiddleware, async (req, res) => {
    try {
        if (!req.app.imapService) return res.status(500).json({ error: 'IMAP service not available' });
        const result = await req.app.imapService.manualSync(req.userId);
        const { data: account } = await supabase.from('mail_accounts')
            .select('last_sync').eq('user_id', req.userId).eq('is_primary', true).single();
        res.json({
            message: `Synced ${result.synced} new emails`,
            synced: result.synced, totalOnServer: result.total,
            accounts: result.accounts, lastSync: account?.last_sync || null
        });
    } catch (err) {
        console.error('Manual sync error:', err);
        res.status(500).json({ error: 'Sync failed: ' + err.message });
    }
});

// GET /api/emails/sync-status
router.get('/sync-status', authMiddleware, async (req, res) => {
    const { data: accounts } = await supabase.from('mail_accounts')
        .select('email, last_sync, sync_enabled').eq('user_id', req.userId);
    res.json({ accounts: accounts || [], lastSync: accounts?.[0]?.last_sync || null });
});

// GET /api/emails?folder=inbox&page=1&limit=50
router.get('/', authMiddleware, async (req, res) => {
    const { folder = 'inbox', page = 1, limit = 50, starred, unread, account_id } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase.from('emails').select('*', { count: 'exact' }).eq('user_id', req.userId);

    if (starred === 'true') {
        query = query.eq('is_starred', true);
    } else {
        query = query.eq('folder_type', folder);
    }
    if (unread === 'true') query = query.eq('is_read', false);
    if (account_id) query = query.eq('account_id', account_id);

    const { data: emails, count: total } = await query
        .order('received_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

    // Unread count
    let unreadQuery = supabase.from('emails').select('id', { count: 'exact', head: true })
        .eq('user_id', req.userId).eq('folder_type', folder).eq('is_read', false);
    const { count: unreadCount } = await unreadQuery;

    res.json({ emails: emails || [], total: total || 0, unread: unreadCount || 0, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/emails/counts
router.get('/counts', authMiddleware, async (req, res) => {
    const folders = ['inbox', 'sent', 'drafts', 'spam', 'trash'];
    const counts = {};
    for (const f of folders) {
        const { count: total } = await supabase.from('emails').select('id', { count: 'exact', head: true })
            .eq('user_id', req.userId).eq('folder_type', f);
        const { count: unread } = await supabase.from('emails').select('id', { count: 'exact', head: true })
            .eq('user_id', req.userId).eq('folder_type', f).eq('is_read', false);
        counts[f] = { total: total || 0, unread: unread || 0 };
    }
    const { count: starredCount } = await supabase.from('emails').select('id', { count: 'exact', head: true })
        .eq('user_id', req.userId).eq('is_starred', true);
    counts.starred = { total: starredCount || 0, unread: 0 };
    res.json({ counts });
});

// GET /api/emails/:id
router.get('/:id', authMiddleware, async (req, res) => {
    const { data: email } = await supabase.from('emails').select('*')
        .eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!email) return res.status(404).json({ error: 'Email not found' });

    // Mark as read
    if (!email.is_read) {
        await supabase.from('emails').update({ is_read: true }).eq('id', req.params.id);
    }

    // Get attachments
    const { data: attachments } = await supabase.from('attachments').select('*').eq('email_id', req.params.id);

    // Get labels (join)
    const { data: emailLabels } = await supabase.from('email_labels').select('label_id').eq('email_id', req.params.id);
    let labels = [];
    if (emailLabels && emailLabels.length > 0) {
        const labelIds = emailLabels.map(el => el.label_id);
        const { data: labelData } = await supabase.from('labels').select('*').in('id', labelIds);
        labels = labelData || [];
    }

    // Get thread
    let thread = [];
    if (email.thread_id) {
        const { data: threadData } = await supabase.from('emails')
            .select('id, from_name, from_address, subject, snippet, received_at, is_read')
            .eq('thread_id', email.thread_id).eq('user_id', req.userId)
            .order('received_at', { ascending: true });
        thread = threadData || [];
    }

    res.json({ email, attachments: attachments || [], labels, thread });
});

// POST /api/emails/send
router.post('/send', authMiddleware, upload.array('attachments', 10), async (req, res) => {
    try {
        const { to, cc, bcc, subject, bodyText, bodyHtml, inReplyTo, accountId, trackRead } = req.body;
        if (!to || !subject) return res.status(400).json({ error: 'To and Subject are required' });

        // Get mail account
        let account;
        if (accountId) {
            const { data } = await supabase.from('mail_accounts').select('*').eq('id', accountId).eq('user_id', req.userId).single();
            account = data;
        } else {
            const { data } = await supabase.from('mail_accounts').select('*').eq('user_id', req.userId).eq('is_primary', true).single();
            account = data;
        }

        const { data: user } = await supabase.from('users').select('name, email').eq('id', req.userId).single();
        const fromAddress = account ? account.email : user.email;
        const fromName = account?.display_name || account?.label || user.name;

        // Generate email ID early for tracking pixel
        const emailId = uuidv4();
        let finalHtml = bodyHtml || '';

        // Only inject tracking pixel if read receipt is ON
        if (trackRead !== '0' && trackRead !== 'false') {
            const appDomain = process.env.APP_DOMAIN || `http://localhost:${process.env.PORT || 3001}`;
            const trackingPixel = `<img src="${appDomain}/api/emails/track/${emailId}.png" width="1" height="1" style="display:none;width:1px;height:1px;border:0" alt="" />`;
            if (finalHtml) {
                finalHtml = finalHtml.includes('</body>') ? finalHtml.replace('</body>', trackingPixel + '</body>') : finalHtml + trackingPixel;
            }
        }

        // Send via SMTP
        let smtpResult = null;
        if (account && account.smtp_host) {
            const attachmentFiles = (req.files || []).map(f => ({ filename: f.originalname, path: f.path }));
            smtpResult = await sendEmail({
                host: account.smtp_host, port: account.smtp_port,
                user: account.username, pass: account.password_encrypted,
                encryption: account.encryption,
                from: `${fromName} <${fromAddress}>`,
                to, cc, bcc, subject, text: bodyText, html: finalHtml,
                inReplyTo, attachments: attachmentFiles
            });
        }

        // Generate thread ID
        let threadId = uuidv4();
        if (inReplyTo) {
            const { data: parent } = await supabase.from('emails')
                .select('thread_id').eq('message_id', inReplyTo).eq('user_id', req.userId).single();
            if (parent) threadId = parent.thread_id;
        }

        // Save to DB (emailId already generated above for tracking)
        const messageId = smtpResult?.messageId || `<${emailId}@eclatrecon-mail.local>`;
        await supabase.from('emails').insert({
            id: emailId, user_id: req.userId, account_id: account?.id || null,
            message_id: messageId, thread_id: threadId, in_reply_to: inReplyTo || null,
            from_address: fromAddress, from_name: fromName,
            to_addresses: to, cc_addresses: cc || null, bcc_addresses: bcc || null,
            subject, body_text: bodyText || '', body_html: bodyHtml || '',
            snippet: (bodyText || '').substring(0, 200),
            folder_type: 'sent', is_read: true,
            has_attachments: (req.files || []).length > 0
        });

        // Save attachments
        if (req.files && req.files.length > 0) {
            await supabase.from('attachments').insert(req.files.map(file => ({
                id: uuidv4(), email_id: emailId, filename: file.originalname,
                mime_type: file.mimetype, size: file.size, path: file.path
            })));
        }

        await supabase.from('audit_logs').insert({
            id: uuidv4(), user_id: req.userId, action: 'send_email', details: `To: ${to}, Subject: ${subject}`
        });

        if (req.app.io) req.app.io.to(req.userId).emit('email-sent', { emailId, subject, to });

        res.status(201).json({ message: 'Email sent', emailId, messageId });
    } catch (err) {
        console.error('Send email error:', err);
        res.status(500).json({ error: 'Failed to send email', details: err.message });
    }
});

// ===== READ RECEIPT TRACKING PIXEL =====
router.get('/track/:id.png', async (req, res) => {
    try {
        const emailId = req.params.id;
        const now = new Date().toISOString();
        const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
        const ua = req.headers['user-agent'] || 'unknown';

        // Update the email with read receipt info
        const { data: email } = await supabase.from('emails').select('user_id, read_receipt_at, subject').eq('id', emailId).single();
        if (email && !email.read_receipt_at) {
            await supabase.from('emails').update({
                read_receipt_at: now,
                read_receipt_ip: ip,
                read_receipt_ua: ua
            }).eq('id', emailId);
            console.log(`👁️ Read receipt: "${email.subject}" opened at ${now}`);
            // Real-time notification
            if (req.app.io) {
                req.app.io.to(email.user_id).emit('read-receipt', {
                    emailId, openedAt: now, ip, subject: email.subject
                });
            }
        }
    } catch (e) { /* silent fail — don't break the pixel */ }

    // Always return the pixel image
    res.set({ 'Content-Type': 'image/gif', 'Content-Length': TRACKING_PIXEL.length, 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 'Pragma': 'no-cache', 'Expires': '0' });
    res.end(TRACKING_PIXEL);
});

// GET /api/emails/:id/tracking — check read receipt status
router.get('/:id/tracking', authMiddleware, async (req, res) => {
    const { data: email } = await supabase.from('emails')
        .select('read_receipt_at, read_receipt_ip, read_receipt_ua')
        .eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!email) return res.status(404).json({ error: 'Not found' });
    res.json({ opened: !!email.read_receipt_at, openedAt: email.read_receipt_at, ip: email.read_receipt_ip, device: email.read_receipt_ua });
});

// POST /api/emails/draft
router.post('/draft', authMiddleware, async (req, res) => {
    const { to, cc, bcc, subject, bodyText, bodyHtml } = req.body;
    const { data: user } = await supabase.from('users').select('name, email').eq('id', req.userId).single();
    const emailId = uuidv4();
    await supabase.from('emails').insert({
        id: emailId, user_id: req.userId, from_address: user.email, from_name: user.name,
        to_addresses: to || '', cc_addresses: cc || '', bcc_addresses: bcc || '',
        subject: subject || '', body_text: bodyText || '', body_html: bodyHtml || '',
        snippet: (bodyText || '').substring(0, 200),
        folder_type: 'drafts', is_draft: true, is_read: true
    });
    res.status(201).json({ message: 'Draft saved', emailId });
});

// PUT /api/emails/:id/star
router.put('/:id/star', authMiddleware, async (req, res) => {
    const { data: email } = await supabase.from('emails').select('is_starred').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!email) return res.status(404).json({ error: 'Not found' });
    const newVal = !email.is_starred;
    await supabase.from('emails').update({ is_starred: newVal }).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ starred: newVal });
});

// PUT /api/emails/:id/read
router.put('/:id/read', authMiddleware, async (req, res) => {
    const { isRead } = req.body;
    await supabase.from('emails').update({ is_read: !!isRead }).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Updated' });
});

// PUT /api/emails/:id/move
router.put('/:id/move', authMiddleware, async (req, res) => {
    const { folder } = req.body;
    await supabase.from('emails').update({ folder_type: folder }).eq('id', req.params.id).eq('user_id', req.userId);
    if (req.app.io) req.app.io.to(req.userId).emit('email-moved', { emailId: req.params.id, folder });
    res.json({ message: `Moved to ${folder}` });
});

// DELETE /api/emails/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    const { data: email } = await supabase.from('emails').select('folder_type').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!email) return res.status(404).json({ error: 'Not found' });
    if (email.folder_type === 'trash') {
        await supabase.from('emails').delete().eq('id', req.params.id).eq('user_id', req.userId);
    } else {
        await supabase.from('emails').update({ folder_type: 'trash' }).eq('id', req.params.id).eq('user_id', req.userId);
    }
    res.json({ message: 'Deleted' });
});

// POST /api/emails/bulk-delete — Multi-select delete
router.post('/bulk-delete', authMiddleware, async (req, res) => {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No email IDs provided' });
    // Move to trash (or permanently delete if already in trash)
    const { data: emails } = await supabase.from('emails').select('id, folder_type').in('id', ids).eq('user_id', req.userId);
    const trashIds = (emails || []).filter(e => e.folder_type === 'trash').map(e => e.id);
    const moveIds = (emails || []).filter(e => e.folder_type !== 'trash').map(e => e.id);
    if (trashIds.length) await supabase.from('emails').delete().in('id', trashIds).eq('user_id', req.userId);
    if (moveIds.length) await supabase.from('emails').update({ folder_type: 'trash' }).in('id', moveIds).eq('user_id', req.userId);
    res.json({ message: `${trashIds.length} permanently deleted, ${moveIds.length} moved to trash` });
});

// POST /api/emails/search
router.post('/search', authMiddleware, async (req, res) => {
    const { query, folder, from, dateFrom, dateTo, hasAttachment } = req.body;

    let dbQuery;
    if (query) {
        // PostgreSQL full-text search
        const tsQuery = query.split(/\s+/).join(' & ');
        dbQuery = supabase.from('emails').select('*')
            .eq('user_id', req.userId)
            .textSearch('search_vector', tsQuery);
    } else {
        dbQuery = supabase.from('emails').select('*').eq('user_id', req.userId);
    }

    if (folder) dbQuery = dbQuery.eq('folder_type', folder);
    if (from) dbQuery = dbQuery.ilike('from_address', `%${from}%`);
    if (dateFrom) dbQuery = dbQuery.gte('received_at', dateFrom);
    if (dateTo) dbQuery = dbQuery.lte('received_at', dateTo);
    if (hasAttachment === true) dbQuery = dbQuery.eq('has_attachments', true);

    const { data: results } = await dbQuery.order('received_at', { ascending: false }).limit(50);
    res.json({ results: results || [], count: (results || []).length });
});

module.exports = router;
