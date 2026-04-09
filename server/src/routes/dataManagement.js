// ===== Eclatrecon AI Mail - Data Management Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');

// =================== BACKUP & RESTORE ===================
router.post('/backup', authMiddleware, async (req, res) => {
    const { data: user } = await supabase.from('users').select('email, name, display_name').eq('id', req.userId).single();
    const { data: emails } = await supabase.from('emails').select('*').eq('user_id', req.userId);
    const { data: contacts } = await supabase.from('contacts').select('*').eq('user_id', req.userId);
    const { data: accounts } = await supabase.from('mail_accounts').select('id, email, label, smtp_host, smtp_port, imap_host, imap_port, created_at').eq('user_id', req.userId);
    const { data: labels } = await supabase.from('labels').select('*').eq('user_id', req.userId);
    const { data: tasks } = await supabase.from('tasks').select('*').eq('user_id', req.userId);
    const { data: notes } = await supabase.from('notes').select('*').eq('user_id', req.userId);
    const { data: signatures } = await supabase.from('signatures').select('*').eq('user_id', req.userId);
    const { data: templates } = await supabase.from('email_templates').select('*').eq('user_id', req.userId);

    const backup = {
        version: '2.0.0', exportedAt: new Date().toISOString(),
        user: { email: user?.email, name: user?.name, displayName: user?.display_name },
        data: { emails: emails||[], contacts: contacts||[], accounts: accounts||[], labels: labels||[], tasks: tasks||[], notes: notes||[], signatures: signatures||[], templates: templates||[] }
    };
    res.set({ 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="eclatrecon-mail_backup_${new Date().toISOString().slice(0, 10)}.json"` });
    res.json(backup);
});

router.post('/restore', authMiddleware, async (req, res) => {
    const { backup } = req.body;
    if (!backup || !backup.data) return res.status(400).json({ error: 'Invalid backup format' });
    let restored = { contacts: 0, tasks: 0, notes: 0 };

    if (backup.data.contacts) {
        for (const c of backup.data.contacts) {
            const { error } = await supabase.from('contacts').insert({ id: uuidv4(), user_id: req.userId, name: c.name, email: c.email, phone: c.phone || '', company: c.company || '', notes: c.notes || '' });
            if (!error) restored.contacts++;
        }
    }
    if (backup.data.tasks) {
        for (const t of backup.data.tasks) {
            const { error } = await supabase.from('tasks').insert({ id: uuidv4(), user_id: req.userId, title: t.title, description: t.description || '', priority: t.priority || 'P3', status: t.status || 'todo', due_date: t.due_date });
            if (!error) restored.tasks++;
        }
    }
    if (backup.data.notes) {
        for (const n of backup.data.notes) {
            const { error } = await supabase.from('notes').insert({ id: uuidv4(), user_id: req.userId, title: n.title, body: n.body || '' });
            if (!error) restored.notes++;
        }
    }
    res.json({ message: 'Restore complete', restored });
});

// =================== MIGRATION ===================
router.post('/migrate/mbox', authMiddleware, async (req, res) => {
    const { mboxContent } = req.body;
    if (!mboxContent) return res.status(400).json({ error: 'mboxContent required' });
    let imported = 0;
    const messages = mboxContent.split(/^From /gm).filter(Boolean);
    for (const msg of messages) {
        const lines = msg.split('\n');
        let subject = '', from = '', to = '', date = '', body = '', inHeaders = true;
        for (const line of lines) {
            if (inHeaders) {
                if (line.trim() === '') { inHeaders = false; continue; }
                if (line.startsWith('Subject:')) subject = line.slice(8).trim();
                if (line.startsWith('From:')) from = line.slice(5).trim();
                if (line.startsWith('To:')) to = line.slice(3).trim();
                if (line.startsWith('Date:')) date = line.slice(5).trim();
            } else { body += line + '\n'; }
        }
        if (subject || from) {
            const emailMatch = from.match(/<([^>]+)>/) || [null, from];
            await supabase.from('emails').insert({
                id: uuidv4(), user_id: req.userId, subject, from_address: emailMatch[1] || from,
                from_name: from.replace(/<[^>]+>/, '').trim(), to_addresses: to, body_text: body.trim(),
                folder_type: 'inbox', received_at: date ? new Date(date).toISOString() : new Date().toISOString()
            });
            imported++;
        }
    }
    res.json({ message: `Imported ${imported} emails from MBOX`, imported });
});

router.post('/migrate/eml', authMiddleware, async (req, res) => {
    const { emlContent } = req.body;
    if (!emlContent) return res.status(400).json({ error: 'emlContent required' });
    const lines = emlContent.split('\n');
    let subject = '', from = '', to = '', date = '', body = '', inHeaders = true;
    for (const line of lines) {
        if (inHeaders) {
            if (line.trim() === '') { inHeaders = false; continue; }
            if (line.startsWith('Subject:')) subject = line.slice(8).trim();
            if (line.startsWith('From:')) from = line.slice(5).trim();
            if (line.startsWith('To:')) to = line.slice(3).trim();
            if (line.startsWith('Date:')) date = line.slice(5).trim();
        } else { body += line + '\n'; }
    }
    const emailMatch = from.match(/<([^>]+)>/) || [null, from];
    await supabase.from('emails').insert({
        id: uuidv4(), user_id: req.userId, subject, from_address: emailMatch[1] || from,
        from_name: from.replace(/<[^>]+>/, '').trim(), to_addresses: to, body_text: body.trim(),
        folder_type: 'inbox', received_at: date ? new Date(date).toISOString() : new Date().toISOString()
    });
    res.json({ message: 'EML imported', imported: 1 });
});

// =================== DATA RETENTION ===================
router.post('/retention/cleanup', authMiddleware, async (req, res) => {
    const { trashDays = 30, spamDays = 14 } = req.body;
    const trashCutoff = new Date(Date.now() - trashDays * 86400000).toISOString();
    const spamCutoff = new Date(Date.now() - spamDays * 86400000).toISOString();

    // Count before delete for reporting
    const { count: trashCount } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).eq('folder_type', 'trash').lt('received_at', trashCutoff);
    const { count: spamCount } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).eq('folder_type', 'spam').lt('received_at', spamCutoff);

    await supabase.from('emails').delete().eq('user_id', req.userId).eq('folder_type', 'trash').lt('received_at', trashCutoff);
    await supabase.from('emails').delete().eq('user_id', req.userId).eq('folder_type', 'spam').lt('received_at', spamCutoff);

    // Expire self-destructing emails
    await supabase.from('email_expiry').update({ status: 'expired' }).eq('status', 'active').lt('expires_at', new Date().toISOString());
    const { data: expired } = await supabase.from('email_expiry').select('email_id').eq('status', 'expired');
    if (expired && expired.length) {
        await supabase.from('emails').delete().in('id', expired.map(e => e.email_id));
    }

    res.json({ trashDeleted: trashCount || 0, spamDeleted: spamCount || 0, expiredEmails: (expired || []).length });
});

module.exports = router;
