// ===== Eclatrecon AI Mail - Analytics & Reporting Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');

// Email Analytics Dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    // Totals
    const { count: totalSent } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).eq('folder_type', 'sent').gte('received_at', since);
    const { count: totalReceived } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).eq('folder_type', 'inbox').gte('received_at', since);
    const { count: totalRead } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).eq('is_read', true).gte('received_at', since);
    const { count: totalStarred } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).eq('is_starred', true).gte('received_at', since);
    const { count: total } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).gte('received_at', since);

    // Folder breakdown
    const folders = ['inbox', 'sent', 'drafts', 'spam', 'trash'];
    const folderBreakdown = [];
    for (const f of folders) {
        const { count } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).eq('folder_type', f);
        folderBreakdown.push({ folder_type: f, count: count || 0 });
    }

    res.json({
        dailySent: [], dailyReceived: [], hourly: [],
        topSenders: [],
        totals: { total: total || 0, read_count: totalRead || 0, starred: totalStarred || 0, sent: totalSent || 0, received: totalReceived || 0 },
        folders: folderBreakdown,
        period: `Last ${days} days`
    });
});

// SLA Tracking
router.get('/sla', authMiddleware, async (req, res) => {
    const { data: users } = await supabase.from('users').select('id, name, email');
    res.json({ users: users || [] });
});

// Attachment Analytics
router.get('/attachments', authMiddleware, async (req, res) => {
    try {
        const { data: attachments } = await supabase.from('attachments').select('id, email_id, filename, size, content_type').order('size', { ascending: false }).limit(50);
        const byType = {};
        let totalSize = 0;
        (attachments || []).forEach(a => {
            const ext = (a.filename || '').split('.').pop()?.toLowerCase() || 'unknown';
            if (!byType[ext]) byType[ext] = { count: 0, size: 0 };
            byType[ext].count++;
            byType[ext].size += a.size || 0;
            totalSize += a.size || 0;
        });
        res.json({ attachments: (attachments || []).slice(0, 20), byType, totalSize, totalCount: (attachments || []).length });
    } catch (e) {
        res.json({ attachments: [], byType: {}, totalSize: 0, totalCount: 0, note: 'No attachment data available' });
    }
});

module.exports = router;
