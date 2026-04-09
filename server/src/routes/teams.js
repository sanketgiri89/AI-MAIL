// ===== Eclatrecon AI Mail - Team Collaboration Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// =================== TEAM MEMBERS ===================
router.get('/members', authMiddleware, async (req, res) => {
    const { data: members } = await supabase.from('users').select('id, email, name, display_name, avatar, is_admin, created_at').order('name');
    res.json({ members: members || [] });
});

router.post('/invite', authMiddleware, async (req, res) => {
    const { email, name, role } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'Email and name are required' });
    const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'User already exists' });
    const tempPassword = 'Welcome' + Math.floor(Math.random() * 9000 + 1000) + '!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const id = uuidv4();
    await supabase.from('users').insert({ id, email, password_hash: passwordHash, name, is_admin: role === 'admin' });
    res.status(201).json({ id, email, name, tempPassword, message: `Team member invited. Temp password: ${tempPassword}` });
});

router.put('/members/:id', authMiddleware, async (req, res) => {
    const { name, is_admin } = req.body;
    const { data: requester } = await supabase.from('users').select('is_admin').eq('id', req.userId).single();
    if (!requester?.is_admin) return res.status(403).json({ error: 'Admin access required' });
    const { data: target } = await supabase.from('users').select('id').eq('id', req.params.id).single();
    if (!target) return res.status(404).json({ error: 'User not found' });
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (is_admin !== undefined) updates.is_admin = !!is_admin;
    if (Object.keys(updates).length) await supabase.from('users').update(updates).eq('id', req.params.id);
    res.json({ message: 'Member updated' });
});

router.delete('/members/:id', authMiddleware, async (req, res) => {
    const { data: requester } = await supabase.from('users').select('is_admin').eq('id', req.userId).single();
    if (!requester?.is_admin) return res.status(403).json({ error: 'Admin access required' });
    if (req.params.id === req.userId) return res.status(400).json({ error: 'Cannot remove yourself' });
    await supabase.from('users').delete().eq('id', req.params.id);
    res.json({ message: 'Member removed' });
});

// =================== SEND-FROM ACCOUNTS ===================
router.get('/send-from', authMiddleware, async (req, res) => {
    const { data: own } = await supabase.from('mail_accounts').select('id, email, label, is_primary').eq('user_id', req.userId);
    // Simplified — delegated and shared need joins which Supabase handles differently
    const { data: delegations } = await supabase.from('email_delegations').select('delegator_id').eq('delegate_id', req.userId).eq('can_send_as', true);
    let delegated = [];
    if (delegations && delegations.length) {
        for (const d of delegations) {
            const { data: acc } = await supabase.from('mail_accounts').select('id, email, label').eq('user_id', d.delegator_id).eq('is_primary', true).single();
            const { data: u } = await supabase.from('users').select('name').eq('id', d.delegator_id).single();
            if (acc) delegated.push({ ...acc, owner_name: u?.name, type: 'delegated' });
        }
    }
    const { data: smm } = await supabase.from('shared_mailbox_members').select('mailbox_id').eq('user_id', req.userId).eq('can_send', true);
    let shared = [];
    if (smm && smm.length) {
        const { data } = await supabase.from('shared_mailboxes').select('id, email, name').in('id', smm.map(m => m.mailbox_id));
        shared = (data || []).map(s => ({ ...s, label: s.name, type: 'shared' }));
    }
    res.json({ accounts: [...(own || []).map(a => ({ ...a, type: 'own' })), ...delegated, ...shared] });
});

// =================== SHARED MAILBOXES ===================
router.get('/shared-mailboxes', authMiddleware, async (req, res) => {
    const { data: memberOf } = await supabase.from('shared_mailbox_members').select('mailbox_id').eq('user_id', req.userId);
    const { data: created } = await supabase.from('shared_mailboxes').select('id').eq('created_by', req.userId);
    const allIds = [...new Set([...(memberOf || []).map(m => m.mailbox_id), ...(created || []).map(c => c.id)])];
    let mailboxes = [];
    if (allIds.length) {
        const { data } = await supabase.from('shared_mailboxes').select('*').in('id', allIds);
        mailboxes = data || [];
    }
    res.json({ mailboxes });
});

router.post('/shared-mailboxes', authMiddleware, async (req, res) => {
    const { email, name, description, accountId } = req.body;
    if (!email || !name) return res.status(400).json({ error: 'email and name required' });
    const id = uuidv4();
    const { error } = await supabase.from('shared_mailboxes').insert({ id, email, name, description: description || '', account_id: accountId || null, created_by: req.userId });
    if (error) return res.status(409).json({ error: 'Mailbox email already exists' });
    await supabase.from('shared_mailbox_members').insert({ id: uuidv4(), mailbox_id: id, user_id: req.userId, role: 'owner', can_send: true, can_delete: true });
    res.status(201).json({ id, email, name });
});

router.delete('/shared-mailboxes/:id', authMiddleware, async (req, res) => {
    await supabase.from('shared_mailboxes').delete().eq('id', req.params.id).eq('created_by', req.userId);
    res.json({ message: 'Shared mailbox deleted' });
});

router.get('/shared-mailboxes/:id/members', authMiddleware, async (req, res) => {
    const { data: members } = await supabase.from('shared_mailbox_members').select('*').eq('mailbox_id', req.params.id);
    res.json({ members: members || [] });
});

router.post('/shared-mailboxes/:id/members', authMiddleware, async (req, res) => {
    const { userId, canSend, canDelete } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const { error } = await supabase.from('shared_mailbox_members').insert({ id: uuidv4(), mailbox_id: req.params.id, user_id: userId, can_send: canSend !== false, can_delete: !!canDelete });
    if (error) return res.status(409).json({ error: 'Already a member' });
    res.status(201).json({ message: 'Member added' });
});

router.delete('/shared-mailboxes/:id/members/:userId', authMiddleware, async (req, res) => {
    await supabase.from('shared_mailbox_members').delete().eq('mailbox_id', req.params.id).eq('user_id', req.params.userId);
    res.json({ message: 'Member removed' });
});

// =================== EMAIL DELEGATION ===================
router.get('/delegations', authMiddleware, async (req, res) => {
    const { data: delegatedTo } = await supabase.from('email_delegations').select('*').eq('delegator_id', req.userId);
    const { data: delegatedFrom } = await supabase.from('email_delegations').select('*').eq('delegate_id', req.userId);
    res.json({ delegatedTo: delegatedTo || [], delegatedFrom: delegatedFrom || [] });
});

router.post('/delegations', authMiddleware, async (req, res) => {
    const { delegateEmail, canSendAs, canRead } = req.body;
    if (!delegateEmail) return res.status(400).json({ error: 'delegateEmail required' });
    const { data: user } = await supabase.from('users').select('id').eq('email', delegateEmail).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { error } = await supabase.from('email_delegations').insert({ id: uuidv4(), delegator_id: req.userId, delegate_id: user.id, can_send_as: canSendAs !== false, can_read: !!canRead });
    if (error) return res.status(409).json({ error: 'Delegation already exists' });
    res.status(201).json({ message: 'Delegation created' });
});

router.delete('/delegations/:id', authMiddleware, async (req, res) => {
    await supabase.from('email_delegations').delete().eq('id', req.params.id).eq('delegator_id', req.userId);
    res.json({ message: 'Delegation removed' });
});

// =================== EMAIL COMMENTS ===================
router.get('/emails/:emailId/comments', authMiddleware, async (req, res) => {
    const { data: comments } = await supabase.from('email_comments').select('*').eq('email_id', req.params.emailId).order('created_at');
    res.json({ comments: comments || [] });
});

router.post('/emails/:emailId/comments', authMiddleware, async (req, res) => {
    const { body, mentions } = req.body;
    if (!body) return res.status(400).json({ error: 'Comment body required' });
    const id = uuidv4();
    await supabase.from('email_comments').insert({ id, email_id: req.params.emailId, user_id: req.userId, body, mentions: JSON.stringify(mentions || []) });
    res.status(201).json({ id });
});

router.delete('/comments/:id', authMiddleware, async (req, res) => {
    await supabase.from('email_comments').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Comment deleted' });
});

// =================== SHARED LABELS ===================
router.get('/shared-labels', authMiddleware, async (req, res) => {
    const { data: labels } = await supabase.from('shared_labels').select('*').order('created_at', { ascending: false });
    res.json({ labels: labels || [] });
});

router.post('/shared-labels', authMiddleware, async (req, res) => {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Label name required' });
    const id = uuidv4();
    await supabase.from('shared_labels').insert({ id, name, color: color || '#ec5b13', created_by: req.userId });
    res.status(201).json({ id, name, color });
});

router.delete('/shared-labels/:id', authMiddleware, async (req, res) => {
    await supabase.from('shared_labels').delete().eq('id', req.params.id);
    res.json({ message: 'Label deleted' });
});

module.exports = router;
