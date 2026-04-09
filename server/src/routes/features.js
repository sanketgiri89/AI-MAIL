// ===== Eclatrecon AI Mail - Features Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');

// =================== SIGNATURES ===================
router.get('/signatures', authMiddleware, async (req, res) => {
    const { data: sigs } = await supabase.from('signatures').select('*').eq('user_id', req.userId).order('is_default', { ascending: false }).order('created_at', { ascending: false });
    res.json({ signatures: sigs || [] });
});

router.post('/signatures', authMiddleware, async (req, res) => {
    const { name, bodyHtml, bodyText, isDefault } = req.body;
    if (!name || !bodyHtml) return res.status(400).json({ error: 'name and bodyHtml required' });
    const id = uuidv4();
    if (isDefault) await supabase.from('signatures').update({ is_default: false }).eq('user_id', req.userId);
    await supabase.from('signatures').insert({ id, user_id: req.userId, name, body_html: bodyHtml, body_text: bodyText || '', is_default: !!isDefault });
    res.status(201).json({ id, name });
});

router.put('/signatures/:id', authMiddleware, async (req, res) => {
    const { name, bodyHtml, bodyText, isDefault } = req.body;
    if (isDefault) await supabase.from('signatures').update({ is_default: false }).eq('user_id', req.userId);
    const updates = {};
    if (name) updates.name = name;
    if (bodyHtml) updates.body_html = bodyHtml;
    if (bodyText !== undefined) updates.body_text = bodyText;
    if (isDefault !== undefined) updates.is_default = !!isDefault;
    await supabase.from('signatures').update(updates).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Signature updated' });
});

router.delete('/signatures/:id', authMiddleware, async (req, res) => {
    await supabase.from('signatures').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Signature deleted' });
});

// =================== TEMPLATES ===================
router.get('/templates', authMiddleware, async (req, res) => {
    const { data: templates } = await supabase.from('email_templates').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    res.json({ templates: templates || [] });
});

router.post('/templates', authMiddleware, async (req, res) => {
    const { name, subject, bodyHtml, bodyText, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Template name required' });
    const id = uuidv4();
    await supabase.from('email_templates').insert({ id, user_id: req.userId, name, subject: subject || '', body_html: bodyHtml || '', body_text: bodyText || '', category: category || 'general' });
    res.status(201).json({ id, name });
});

router.put('/templates/:id', authMiddleware, async (req, res) => {
    const { name, subject, bodyHtml, bodyText, category } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (subject !== undefined) updates.subject = subject;
    if (bodyHtml !== undefined) updates.body_html = bodyHtml;
    if (bodyText !== undefined) updates.body_text = bodyText;
    if (category) updates.category = category;
    await supabase.from('email_templates').update(updates).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Template updated' });
});

router.delete('/templates/:id', authMiddleware, async (req, res) => {
    await supabase.from('email_templates').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Template deleted' });
});

// =================== SCHEDULED EMAILS ===================
router.get('/scheduled', authMiddleware, async (req, res) => {
    const { data: emails } = await supabase.from('scheduled_emails').select('*').eq('user_id', req.userId).order('send_at');
    res.json({ scheduledEmails: emails || [] });
});

router.post('/scheduled', authMiddleware, async (req, res) => {
    const { to, cc, bcc, subject, bodyHtml, bodyText, sendAt } = req.body;
    if (!to || !subject || !sendAt) return res.status(400).json({ error: 'to, subject, and sendAt required' });
    const id = uuidv4();
    await supabase.from('scheduled_emails').insert({ id, user_id: req.userId, to_addresses: to, cc_addresses: cc || '', bcc_addresses: bcc || '', subject, body_html: bodyHtml || '', body_text: bodyText || '', send_at: sendAt });
    res.status(201).json({ id, sendAt, message: 'Email scheduled' });
});

router.delete('/scheduled/:id', authMiddleware, async (req, res) => {
    await supabase.from('scheduled_emails').delete().eq('id', req.params.id).eq('user_id', req.userId).eq('status', 'pending');
    res.json({ message: 'Scheduled email cancelled' });
});

// =================== CONTACT GROUPS ===================
router.get('/contact-groups', authMiddleware, async (req, res) => {
    const { data: groups } = await supabase.from('contact_groups').select('*').eq('user_id', req.userId).order('name');
    res.json({ groups: groups || [] });
});

router.post('/contact-groups', authMiddleware, async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Group name required' });
    const id = uuidv4();
    await supabase.from('contact_groups').insert({ id, user_id: req.userId, name, description: description || '' });
    res.status(201).json({ id, name });
});

router.delete('/contact-groups/:id', authMiddleware, async (req, res) => {
    await supabase.from('contact_groups').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Group deleted' });
});

router.get('/contact-groups/:id/members', authMiddleware, async (req, res) => {
    const { data: memberLinks } = await supabase.from('contact_group_members').select('contact_id').eq('group_id', req.params.id);
    let members = [];
    if (memberLinks && memberLinks.length) {
        const { data } = await supabase.from('contacts').select('*').in('id', memberLinks.map(m => m.contact_id));
        members = data || [];
    }
    res.json({ members });
});

router.post('/contact-groups/:id/members', authMiddleware, async (req, res) => {
    const { contactId } = req.body;
    if (!contactId) return res.status(400).json({ error: 'contactId required' });
    await supabase.from('contact_group_members').upsert({ group_id: req.params.id, contact_id: contactId }, { onConflict: 'group_id,contact_id' });
    res.json({ message: 'Member added' });
});

router.delete('/contact-groups/:id/members/:contactId', authMiddleware, async (req, res) => {
    await supabase.from('contact_group_members').delete().eq('group_id', req.params.id).eq('contact_id', req.params.contactId);
    res.json({ message: 'Member removed' });
});

// =================== FORWARDING RULES ===================
router.get('/forwarding', authMiddleware, async (req, res) => {
    const { data: rules } = await supabase.from('forwarding_rules').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    res.json({ rules: rules || [] });
});

router.post('/forwarding', authMiddleware, async (req, res) => {
    const { forwardTo, keepCopy = true, conditionFrom, conditionSubject } = req.body;
    if (!forwardTo) return res.status(400).json({ error: 'forwardTo email required' });
    const id = uuidv4();
    await supabase.from('forwarding_rules').insert({ id, user_id: req.userId, forward_to: forwardTo, keep_copy: !!keepCopy, condition_from: conditionFrom || null, condition_subject: conditionSubject || null });
    res.status(201).json({ id, forwardTo });
});

router.put('/forwarding/:id/toggle', authMiddleware, async (req, res) => {
    const { data: rule } = await supabase.from('forwarding_rules').select('is_active').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (rule) await supabase.from('forwarding_rules').update({ is_active: !rule.is_active }).eq('id', req.params.id);
    res.json({ message: 'Rule toggled' });
});

router.delete('/forwarding/:id', authMiddleware, async (req, res) => {
    await supabase.from('forwarding_rules').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Rule deleted' });
});

// =================== LOGIN HISTORY ===================
router.get('/login-history', authMiddleware, async (req, res) => {
    const { data: history } = await supabase.from('login_history').select('*').eq('user_id', req.userId).order('created_at', { ascending: false }).limit(50);
    res.json({ history: history || [] });
});

// =================== EXPORT ===================
router.get('/export/emails', authMiddleware, async (req, res) => {
    const { folder = 'inbox', format = 'json' } = req.query;
    const { data: emails } = await supabase.from('emails').select('*').eq('user_id', req.userId).eq('folder_type', folder).order('received_at', { ascending: false });
    if (format === 'eml') {
        let eml = '';
        (emails || []).forEach(e => {
            eml += `From: ${e.from_name} <${e.from_address}>\r\nTo: ${e.to_addresses}\r\nSubject: ${e.subject}\r\nDate: ${e.received_at}\r\nContent-Type: text/plain\r\n\r\n${e.body_text || ''}\r\n\r\n---END OF EMAIL---\r\n\r\n`;
        });
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="eclatrecon-mail-${folder}-export.eml"`);
        return res.send(eml);
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="eclatrecon-mail-${folder}-export.json"`);
    res.json({ emails: emails || [], exportedAt: new Date().toISOString(), folder, count: (emails || []).length });
});

module.exports = router;
