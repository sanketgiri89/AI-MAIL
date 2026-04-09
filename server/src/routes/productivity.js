// ===== Eclatrecon AI Mail - Productivity Suite Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');

// =================== CALENDAR ===================
router.get('/calendar', authMiddleware, async (req, res) => {
    const { start, end, month } = req.query;
    let query = supabase.from('calendar_events').select('*').eq('user_id', req.userId);
    if (start && end) {
        query = query.gte('start_time', start).lte('start_time', end);
    } else if (month) {
        const y = month.slice(0, 4), m = month.slice(5, 7);
        query = query.gte('start_time', `${y}-${m}-01`).lt('start_time', `${y}-${String(Number(m) + 1).padStart(2, '0')}-01`);
    }
    const { data: events } = await query.order('start_time');
    res.json({ events: events || [] });
});

router.get('/calendar/:id', authMiddleware, async (req, res) => {
    const { data: event } = await supabase.from('calendar_events').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const { data: attendees } = await supabase.from('event_attendees').select('*').eq('event_id', req.params.id);
    res.json({ event, attendees: attendees || [] });
});

router.post('/calendar', authMiddleware, async (req, res) => {
    const { title, description, location, startTime, endTime, allDay, recurrence, color, emailId } = req.body;
    if (!title || !startTime || !endTime) return res.status(400).json({ error: 'title, startTime, endTime required' });
    const id = uuidv4();
    const icalUid = `${id}@eclatrecon-mail`;
    await supabase.from('calendar_events').insert({ id, user_id: req.userId, title, description: description || '', location: location || '', start_time: startTime, end_time: endTime, all_day: !!allDay, recurrence: recurrence || null, color: color || '#ec5b13', email_id: emailId || null, ical_uid: icalUid });
    res.status(201).json({ id, icalUid });
});

router.put('/calendar/:id', authMiddleware, async (req, res) => {
    const { title, description, location, startTime, endTime, allDay, recurrence, color } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (startTime) updates.start_time = startTime;
    if (endTime) updates.end_time = endTime;
    if (allDay !== undefined) updates.all_day = !!allDay;
    if (recurrence !== undefined) updates.recurrence = recurrence;
    if (color) updates.color = color;
    await supabase.from('calendar_events').update(updates).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Event updated' });
});

router.delete('/calendar/:id', authMiddleware, async (req, res) => {
    await supabase.from('calendar_events').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Event deleted' });
});

// Attendees
router.post('/calendar/:id/attendees', authMiddleware, async (req, res) => {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const id = uuidv4();
    await supabase.from('event_attendees').insert({ id, event_id: req.params.id, email, name: name || '' });
    res.status(201).json({ id });
});

router.put('/calendar/:eventId/attendees/:id/rsvp', authMiddleware, async (req, res) => {
    const { rsvp } = req.body;
    await supabase.from('event_attendees').update({ rsvp }).eq('id', req.params.id);
    res.json({ message: 'RSVP updated' });
});

// ICS export
router.get('/calendar/:id/ics', authMiddleware, async (req, res) => {
    const { data: event } = await supabase.from('calendar_events').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!event) return res.status(404).json({ error: 'Not found' });
    const { data: attendees } = await supabase.from('event_attendees').select('*').eq('event_id', req.params.id);
    const fmt = d => d.replace(/[-:]/g, '').replace('.000Z', 'Z');
    let ics = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//EclatreconAIMail//EN\r\nBEGIN:VEVENT\r\nUID:${event.ical_uid}\r\nDTSTART:${fmt(event.start_time)}\r\nDTEND:${fmt(event.end_time)}\r\nSUMMARY:${event.title}\r\nDESCRIPTION:${event.description || ''}\r\nLOCATION:${event.location || ''}\r\n`;
    (attendees || []).forEach(a => { ics += `ATTENDEE;RSVP=TRUE:mailto:${a.email}\r\n`; });
    ics += `END:VEVENT\r\nEND:VCALENDAR`;
    res.set({ 'Content-Type': 'text/calendar', 'Content-Disposition': `attachment; filename="${event.title}.ics"` });
    res.send(ics);
});

// =================== TASKS ===================
router.get('/tasks', authMiddleware, async (req, res) => {
    const { status, priority } = req.query;
    let query = supabase.from('tasks').select('*').eq('user_id', req.userId);
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    const { data: tasks } = await query.order('position').order('created_at', { ascending: false });
    res.json({ tasks: tasks || [] });
});

router.post('/tasks', authMiddleware, async (req, res) => {
    const { title, description, priority, dueDate, emailId } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const id = uuidv4();
    await supabase.from('tasks').insert({ id, user_id: req.userId, title, description: description || '', priority: priority || 'P3', due_date: dueDate || null, email_id: emailId || null });
    res.status(201).json({ id });
});

router.put('/tasks/:id', authMiddleware, async (req, res) => {
    const { title, description, priority, status, dueDate, position } = req.body;
    const updates = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority) updates.priority = priority;
    if (status) updates.status = status;
    if (dueDate !== undefined) updates.due_date = dueDate;
    if (position !== undefined) updates.position = position;
    if (status === 'done') updates.completed_at = new Date().toISOString();
    await supabase.from('tasks').update(updates).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Task updated' });
});

router.delete('/tasks/:id', authMiddleware, async (req, res) => {
    await supabase.from('tasks').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Task deleted' });
});

router.post('/tasks/from-email', authMiddleware, async (req, res) => {
    const { emailId } = req.body;
    const { data: email } = await supabase.from('emails').select('subject, from_name').eq('id', emailId).eq('user_id', req.userId).single();
    if (!email) return res.status(404).json({ error: 'Email not found' });
    const id = uuidv4();
    await supabase.from('tasks').insert({ id, user_id: req.userId, title: `Re: ${email.subject}`, description: `Task from email by ${email.from_name}`, email_id: emailId });
    res.status(201).json({ id, title: `Re: ${email.subject}` });
});

// =================== NOTES ===================
router.get('/notes', authMiddleware, async (req, res) => {
    const { data: notes } = await supabase.from('notes').select('*').eq('user_id', req.userId).order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });
    res.json({ notes: notes || [] });
});

router.post('/notes', authMiddleware, async (req, res) => {
    const { title, body, emailId } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const id = uuidv4();
    await supabase.from('notes').insert({ id, user_id: req.userId, title, body: body || '', email_id: emailId || null });
    res.status(201).json({ id });
});

router.put('/notes/:id', authMiddleware, async (req, res) => {
    const { title, body, isPinned } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (title) updates.title = title;
    if (body !== undefined) updates.body = body;
    if (isPinned !== undefined) updates.is_pinned = !!isPinned;
    await supabase.from('notes').update(updates).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Note updated' });
});

router.delete('/notes/:id', authMiddleware, async (req, res) => {
    await supabase.from('notes').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Note deleted' });
});

// =================== REMINDERS ===================
router.get('/reminders', authMiddleware, async (req, res) => {
    const { data: reminders } = await supabase.from('reminders').select('*').eq('user_id', req.userId).order('remind_at');
    res.json({ reminders: reminders || [] });
});

router.post('/reminders', authMiddleware, async (req, res) => {
    const { emailId, title, remindAt, isRecurring, recurrenceInterval } = req.body;
    if (!title || !remindAt) return res.status(400).json({ error: 'title and remindAt required' });
    const id = uuidv4();
    await supabase.from('reminders').insert({ id, user_id: req.userId, email_id: emailId || null, title, remind_at: remindAt, is_recurring: !!isRecurring, recurrence_interval: recurrenceInterval || null });
    res.status(201).json({ id });
});

router.delete('/reminders/:id', authMiddleware, async (req, res) => {
    await supabase.from('reminders').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Reminder deleted' });
});

router.post('/reminders/from-email', authMiddleware, async (req, res) => {
    const { emailId, remindAt } = req.body;
    if (!emailId || !remindAt) return res.status(400).json({ error: 'emailId and remindAt required' });
    const { data: email } = await supabase.from('emails').select('subject').eq('id', emailId).eq('user_id', req.userId).single();
    if (!email) return res.status(404).json({ error: 'Email not found' });
    const id = uuidv4();
    await supabase.from('reminders').insert({ id, user_id: req.userId, email_id: emailId, title: `Reminder: ${email.subject}`, remind_at: remindAt });
    res.status(201).json({ id });
});

// =================== EMAIL SNOOZE ===================
router.post('/snooze', authMiddleware, async (req, res) => {
    const { emailId, snoozeUntil } = req.body;
    if (!emailId || !snoozeUntil) return res.status(400).json({ error: 'emailId and snoozeUntil required' });
    const { data: email } = await supabase.from('emails').select('folder_type').eq('id', emailId).eq('user_id', req.userId).single();
    if (!email) return res.status(404).json({ error: 'Email not found' });
    const id = uuidv4();
    await supabase.from('snoozed_emails').insert({ id, user_id: req.userId, email_id: emailId, snooze_until: snoozeUntil, original_folder: email.folder_type });
    await supabase.from('emails').update({ folder_type: 'snoozed' }).eq('id', emailId);
    res.json({ message: 'Email snoozed', snoozeUntil });
});

router.get('/snoozed', authMiddleware, async (req, res) => {
    const { data: snoozed } = await supabase.from('snoozed_emails').select('*').eq('user_id', req.userId).eq('status', 'snoozed').order('snooze_until');
    res.json({ snoozed: snoozed || [] });
});

router.delete('/snooze/:id', authMiddleware, async (req, res) => {
    const { data: s } = await supabase.from('snoozed_emails').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (s) {
        await supabase.from('emails').update({ folder_type: s.original_folder }).eq('id', s.email_id);
        await supabase.from('snoozed_emails').delete().eq('id', req.params.id);
    }
    res.json({ message: 'Snooze cancelled' });
});

module.exports = router;
