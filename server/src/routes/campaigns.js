// ===== Eclatrecon AI Mail - Campaign / Marketing Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');

let bulkSender = null;
router.setBulkSender = (bs) => { bulkSender = bs; };

// =================== TRACKING (public) ===================
router.get('/track/open/:trackingId', async (req, res) => {
    const { data: r } = await supabase.from('campaign_recipients').select('*').eq('tracking_id', req.params.trackingId).single();
    if (r) {
        if (!r.opened_at) {
            await supabase.from('campaign_recipients').update({ opened_at: new Date().toISOString(), open_count: (r.open_count || 0) + 1 }).eq('id', r.id);
            await supabase.rpc('increment_field', { table_name: 'campaigns', field_name: 'open_count', row_id: r.campaign_id }).catch(() => {
                // Fallback if RPC doesn't exist
                supabase.from('campaigns').select('open_count').eq('id', r.campaign_id).single().then(({ data }) => {
                    if (data) supabase.from('campaigns').update({ open_count: (data.open_count || 0) + 1 }).eq('id', r.campaign_id);
                });
            });
        } else {
            await supabase.from('campaign_recipients').update({ open_count: (r.open_count || 0) + 1 }).eq('id', r.id);
        }
    }
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set({ 'Content-Type': 'image/gif', 'Cache-Control': 'no-cache, no-store', 'Pragma': 'no-cache' });
    res.send(pixel);
});

router.get('/track/click/:linkId', async (req, res) => {
    const { data: link } = await supabase.from('campaign_links').select('*').eq('id', req.params.linkId).single();
    if (link) {
        await supabase.from('campaign_links').update({ click_count: (link.click_count || 0) + 1 }).eq('id', link.id);
        const trackingId = req.query.r;
        if (trackingId) {
            const { data: r } = await supabase.from('campaign_recipients').select('*').eq('tracking_id', trackingId).single();
            if (r) {
                const isFirst = !r.clicked_at;
                await supabase.from('campaign_recipients').update({ clicked_at: r.clicked_at || new Date().toISOString(), click_count: (r.click_count || 0) + 1 }).eq('id', r.id);
                if (isFirst) {
                    const { data: camp } = await supabase.from('campaigns').select('click_count').eq('id', r.campaign_id).single();
                    if (camp) await supabase.from('campaigns').update({ click_count: (camp.click_count || 0) + 1 }).eq('id', r.campaign_id);
                    await supabase.from('campaign_links').update({ unique_clicks: (link.unique_clicks || 0) + 1 }).eq('id', link.id);
                }
            }
        }
        return res.redirect(link.original_url);
    }
    res.status(404).send('Link not found');
});

router.get('/unsubscribe/:trackingId', async (req, res) => {
    const { data: r } = await supabase.from('campaign_recipients').select('*, campaigns(name)').eq('tracking_id', req.params.trackingId).single();
    res.send(`<!DOCTYPE html><html><head><title>Unsubscribe</title><style>body{font-family:system-ui;background:#0a0a0a;color:#ccc;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{background:#111;border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:40px;max-width:400px;text-align:center}h2{color:#fff;margin-bottom:8px}p{font-size:14px;line-height:1.6;color:#888}.btn{background:#ec5b13;color:#fff;border:none;padding:12px 32px;border-radius:8px;cursor:pointer;font-size:14px;margin-top:16px;font-weight:600}.btn:hover{opacity:.9}</style></head><body><div class="card"><h2>Unsubscribe</h2><p>Email: <strong>${r?.email || 'unknown'}</strong></p><p>You'll be removed from future mailings.</p><form method="POST" action="/api/campaigns/unsubscribe/${req.params.trackingId}"><button type="submit" class="btn">Confirm Unsubscribe</button></form></div></body></html>`);
});

router.post('/unsubscribe/:trackingId', async (req, res) => {
    const { data: r } = await supabase.from('campaign_recipients').select('*').eq('tracking_id', req.params.trackingId).single();
    if (r) {
        await supabase.from('campaign_recipients').update({ unsubscribed_at: new Date().toISOString(), status: 'unsubscribed' }).eq('id', r.id);
        const { data: camp } = await supabase.from('campaigns').select('unsubscribe_count').eq('id', r.campaign_id).single();
        if (camp) await supabase.from('campaigns').update({ unsubscribe_count: (camp.unsubscribe_count || 0) + 1 }).eq('id', r.campaign_id);
        if (r.subscriber_id) await supabase.from('subscribers').update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() }).eq('id', r.subscriber_id);
    }
    res.send(`<!DOCTYPE html><html><head><title>Unsubscribed</title><style>body{font-family:system-ui;background:#0a0a0a;color:#ccc;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}.card{background:#111;border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:40px;max-width:400px;text-align:center}h2{color:#22c55e}p{font-size:14px;color:#888}</style></head><body><div class="card"><h2>✓ Unsubscribed</h2><p>You have been removed and will no longer receive emails from this sender.</p></div></body></html>`);
});

// =================== SUBSCRIBER LISTS ===================
router.get('/lists', authMiddleware, async (req, res) => {
    const { data: lists } = await supabase.from('subscriber_lists').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    res.json({ lists: lists || [] });
});

router.post('/lists', authMiddleware, async (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'List name required' });
    const id = uuidv4();
    await supabase.from('subscriber_lists').insert({ id, user_id: req.userId, name, description: description || '' });
    res.status(201).json({ id, name });
});

router.delete('/lists/:id', authMiddleware, async (req, res) => {
    await supabase.from('subscriber_lists').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'List deleted' });
});

router.get('/lists/:id/subscribers', authMiddleware, async (req, res) => {
    const { status, page = 1, limit = 100, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    let query = supabase.from('subscribers').select('*', { count: 'exact' }).eq('list_id', req.params.id);
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    const { data: subs, count: total } = await query.order('created_at', { ascending: false }).range(offset, offset + Number(limit) - 1);
    res.json({ subscribers: subs || [], total: total || 0, page: Number(page) });
});

router.post('/lists/:id/subscribers', authMiddleware, async (req, res) => {
    const { email, firstName, lastName, company, custom1, custom2, custom3, custom4, custom5 } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const id = uuidv4();
    const { error } = await supabase.from('subscribers').insert({ id, list_id: req.params.id, email, first_name: firstName || '', last_name: lastName || '', company: company || '', custom_1: custom1 || '', custom_2: custom2 || '', custom_3: custom3 || '', custom_4: custom4 || '', custom_5: custom5 || '' });
    if (error) return res.status(409).json({ error: 'Subscriber already exists in this list' });
    // Update count
    const { count } = await supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('list_id', req.params.id);
    await supabase.from('subscriber_lists').update({ subscriber_count: count || 0 }).eq('id', req.params.id);
    res.status(201).json({ id, email });
});

router.delete('/lists/:id/subscribers/:subId', authMiddleware, async (req, res) => {
    await supabase.from('subscribers').delete().eq('id', req.params.subId).eq('list_id', req.params.id);
    res.json({ message: 'Subscriber removed' });
});

// CSV Import
router.post('/lists/:id/import', authMiddleware, async (req, res) => {
    const { csv } = req.body;
    if (!csv) return res.status(400).json({ error: 'CSV data required' });
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    let imported = 0, skipped = 0;
    for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {}; headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
        if (!row.email) { skipped++; continue; }
        const { error } = await supabase.from('subscribers').insert({ id: uuidv4(), list_id: req.params.id, email: row.email, first_name: row.first_name || row.firstname || row.name || '', last_name: row.last_name || row.lastname || '', company: row.company || '', custom_1: row.custom_1 || '', custom_2: row.custom_2 || '', custom_3: row.custom_3 || '', custom_4: row.custom_4 || '', custom_5: row.custom_5 || '' });
        if (!error) imported++; else skipped++;
    }
    const { count } = await supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('list_id', req.params.id);
    await supabase.from('subscriber_lists').update({ subscriber_count: count || 0 }).eq('id', req.params.id);
    res.json({ imported, skipped, total: imported + skipped });
});

// =================== DRIP SEQUENCES ===================
router.get('/drips', authMiddleware, async (req, res) => {
    const { data: drips } = await supabase.from('drip_sequences').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    res.json({ drips: drips || [] });
});

router.post('/drips', authMiddleware, async (req, res) => {
    const { name, description, listId } = req.body;
    if (!name) return res.status(400).json({ error: 'Sequence name required' });
    const id = uuidv4();
    await supabase.from('drip_sequences').insert({ id, user_id: req.userId, name, description: description || '', list_id: listId || null });
    res.status(201).json({ id, name });
});

router.delete('/drips/:id', authMiddleware, async (req, res) => {
    await supabase.from('drip_sequences').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Drip sequence deleted' });
});

router.get('/drips/:id/steps', authMiddleware, async (req, res) => {
    const { data: steps } = await supabase.from('drip_steps').select('*').eq('sequence_id', req.params.id).order('step_order');
    res.json({ steps: steps || [] });
});

router.post('/drips/:id/steps', authMiddleware, async (req, res) => {
    const { delayHours, subject, bodyHtml, bodyText } = req.body;
    if (!subject) return res.status(400).json({ error: 'Subject required' });
    const { data: maxData } = await supabase.from('drip_steps').select('step_order').eq('sequence_id', req.params.id).order('step_order', { ascending: false }).limit(1).single();
    const id = uuidv4();
    await supabase.from('drip_steps').insert({ id, sequence_id: req.params.id, step_order: (maxData?.step_order || 0) + 1, delay_hours: delayHours || 24, subject, body_html: bodyHtml || '', body_text: bodyText || '' });
    res.status(201).json({ id });
});

router.delete('/drips/:id/steps/:stepId', authMiddleware, async (req, res) => {
    await supabase.from('drip_steps').delete().eq('id', req.params.stepId).eq('sequence_id', req.params.id);
    res.json({ message: 'Step deleted' });
});

router.post('/drips/:id/start', authMiddleware, async (req, res) => {
    const { data: drip } = await supabase.from('drip_sequences').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!drip || !drip.list_id) return res.status(400).json({ error: 'Drip not found or no list assigned' });
    const { data: firstStep } = await supabase.from('drip_steps').select('*').eq('sequence_id', req.params.id).order('step_order').limit(1).single();
    if (!firstStep) return res.status(400).json({ error: 'Add at least one step first' });
    const { data: subs } = await supabase.from('subscribers').select('id').eq('list_id', drip.list_id).eq('status', 'active');
    const nextSend = new Date(Date.now() + firstStep.delay_hours * 3600000).toISOString();
    if (subs && subs.length) {
        await supabase.from('drip_enrollments').insert(subs.map(s => ({ id: uuidv4(), sequence_id: req.params.id, subscriber_id: s.id, current_step: 0, next_send_at: nextSend })));
    }
    await supabase.from('drip_sequences').update({ status: 'active' }).eq('id', req.params.id);
    res.json({ message: `Drip started for ${(subs || []).length} subscribers`, firstSendAt: nextSend });
});

// =================== CAMPAIGNS ===================
router.get('/', authMiddleware, async (req, res) => {
    const { data: campaigns } = await supabase.from('campaigns').select('*').eq('user_id', req.userId).order('created_at', { ascending: false });
    res.json({ campaigns: campaigns || [] });
});

router.post('/', authMiddleware, async (req, res) => {
    const { name, subject, bodyHtml, bodyText, fromName, replyTo, listId, accountId, throttlePerMinute, trackOpens, trackClicks, unsubscribeText } = req.body;
    if (!name || !subject) return res.status(400).json({ error: 'name and subject required' });
    const id = uuidv4();
    await supabase.from('campaigns').insert({ id, user_id: req.userId, account_id: accountId || null, name, subject, body_html: bodyHtml || '', body_text: bodyText || '', from_name: fromName || '', reply_to: replyTo || '', list_id: listId || null, throttle_per_minute: throttlePerMinute || 50, track_opens: trackOpens !== false, track_clicks: trackClicks !== false, unsubscribe_text: unsubscribeText || 'Unsubscribe' });
    res.status(201).json({ id, name });
});

router.get('/:id', authMiddleware, async (req, res) => {
    const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const { data: variants } = await supabase.from('ab_tests').select('*').eq('campaign_id', req.params.id);
    res.json({ campaign, variants: variants || [] });
});

router.put('/:id', authMiddleware, async (req, res) => {
    const { name, subject, bodyHtml, bodyText, fromName, replyTo, listId, accountId, throttlePerMinute, trackOpens, trackClicks, unsubscribeText } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (subject) updates.subject = subject;
    if (bodyHtml !== undefined) updates.body_html = bodyHtml;
    if (bodyText !== undefined) updates.body_text = bodyText;
    if (fromName !== undefined) updates.from_name = fromName;
    if (replyTo !== undefined) updates.reply_to = replyTo;
    if (listId !== undefined) updates.list_id = listId;
    if (accountId !== undefined) updates.account_id = accountId;
    if (throttlePerMinute !== undefined) updates.throttle_per_minute = throttlePerMinute;
    if (trackOpens !== undefined) updates.track_opens = !!trackOpens;
    if (trackClicks !== undefined) updates.track_clicks = !!trackClicks;
    if (unsubscribeText !== undefined) updates.unsubscribe_text = unsubscribeText;
    await supabase.from('campaigns').update(updates).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Campaign updated' });
});

router.delete('/:id', authMiddleware, async (req, res) => {
    await supabase.from('campaigns').delete().eq('id', req.params.id).eq('user_id', req.userId).in('status', ['draft', 'completed', 'paused']);
    res.json({ message: 'Campaign deleted' });
});

// =================== CAMPAIGN ACTIONS ===================
router.post('/:id/send', authMiddleware, async (req, res) => {
    if (!bulkSender) return res.status(500).json({ error: 'Bulk sender not initialized' });
    const baseUrl = process.env.APP_DOMAIN || req.body.baseUrl || `${req.protocol}://${req.get('host')}`;
    const result = await bulkSender.startCampaign(req.params.id, baseUrl);
    if (result.error) return res.status(400).json(result);
    res.json(result);
});

router.post('/:id/pause', authMiddleware, (req, res) => {
    if (!bulkSender) return res.status(500).json({ error: 'Bulk sender not initialized' });
    bulkSender.pauseCampaign(req.params.id);
    res.json({ message: 'Campaign paused' });
});

router.post('/:id/resume', authMiddleware, async (req, res) => {
    if (!bulkSender) return res.status(500).json({ error: 'Bulk sender not initialized' });
    await supabase.from('campaigns').update({ status: 'sending' }).eq('id', req.params.id);
    const baseUrl = process.env.APP_DOMAIN || req.body.baseUrl || `${req.protocol}://${req.get('host')}`;
    const result = await bulkSender.startCampaign(req.params.id, baseUrl);
    res.json(result);
});

router.post('/:id/schedule', authMiddleware, async (req, res) => {
    const { scheduleAt } = req.body;
    if (!scheduleAt) return res.status(400).json({ error: 'scheduleAt datetime required' });
    await supabase.from('campaigns').update({ status: 'scheduled', schedule_at: scheduleAt }).eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Campaign scheduled', scheduleAt });
});

router.post('/:id/test', authMiddleware, async (req, res) => {
    const { testEmail } = req.body;
    if (!testEmail) return res.status(400).json({ error: 'testEmail required' });
    const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    let account;
    if (campaign.account_id) {
        const { data } = await supabase.from('mail_accounts').select('*').eq('id', campaign.account_id).single();
        account = data;
    } else {
        const { data } = await supabase.from('mail_accounts').select('*').eq('user_id', req.userId).eq('is_primary', true).single();
        account = data;
    }
    if (!account) return res.status(400).json({ error: 'No mail account' });
    try {
        const nodemailer = require('nodemailer');
        const t = nodemailer.createTransport({ host: account.smtp_host, port: account.smtp_port, secure: account.smtp_port === 465, auth: { user: account.username, pass: account.password_encrypted } });
        const sample = { first_name: 'Test', last_name: 'User', email: testEmail, company: 'Test Co' };
        const subject = bulkSender ? bulkSender.mergeTags(campaign.subject, sample) : campaign.subject;
        const html = bulkSender ? bulkSender.mergeTags(campaign.body_html, sample) : campaign.body_html;
        await t.sendMail({ from: `"${campaign.from_name || account.display_name || account.label}" <${account.email}>`, to: testEmail, subject: `[TEST] ${subject}`, html: html + '<p style="color:red;font-size:11px;">[This is a test email]</p>', text: campaign.body_text });
        res.json({ message: `Test email sent to ${testEmail}` });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/preview', authMiddleware, async (req, res) => {
    const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    let sample = req.body.subscriber;
    if (!sample && campaign.list_id) {
        const { data } = await supabase.from('subscribers').select('*').eq('list_id', campaign.list_id).eq('status', 'active').limit(1).single();
        sample = data;
    }
    sample = sample || { first_name: 'John', last_name: 'Doe', email: 'john@example.com', company: 'Acme Inc' };
    if (!bulkSender) return res.json({ subject: campaign.subject, bodyHtml: campaign.body_html });
    const result = bulkSender.preview(campaign, sample);
    res.json(result);
});

router.get('/:id/analytics', authMiddleware, async (req, res) => {
    const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    const stats = {
        total: campaign.total_recipients, sent: campaign.sent_count, opened: campaign.open_count, clicked: campaign.click_count, bounced: campaign.bounce_count, unsubscribed: campaign.unsubscribe_count,
        openRate: campaign.sent_count > 0 ? ((campaign.open_count / campaign.sent_count) * 100).toFixed(1) + '%' : '0%',
        clickRate: campaign.sent_count > 0 ? ((campaign.click_count / campaign.sent_count) * 100).toFixed(1) + '%' : '0%',
        bounceRate: campaign.sent_count > 0 ? ((campaign.bounce_count / campaign.sent_count) * 100).toFixed(1) + '%' : '0%',
    };
    const { data: links } = await supabase.from('campaign_links').select('*').eq('campaign_id', req.params.id).order('click_count', { ascending: false });
    const { data: variants } = await supabase.from('ab_tests').select('*').eq('campaign_id', req.params.id);
    const { data: recentOpens } = await supabase.from('campaign_recipients').select('email, first_name, opened_at').eq('campaign_id', req.params.id).not('opened_at', 'is', null).order('opened_at', { ascending: false }).limit(20);
    res.json({ stats, links: links || [], recipientBreakdown: [], variants: variants || [], recentOpens: recentOpens || [] });
});

router.get('/:id/recipients', authMiddleware, async (req, res) => {
    const { status, page = 1 } = req.query;
    const offset = (Number(page) - 1) * 100;
    let query = supabase.from('campaign_recipients').select('*', { count: 'exact' }).eq('campaign_id', req.params.id);
    if (status) query = query.eq('status', status);
    const { data: recipients, count: total } = await query.order('sent_at', { ascending: false }).range(offset, offset + 99);
    res.json({ recipients: recipients || [], total: total || 0, page: Number(page) });
});

router.post('/:id/ab-test', authMiddleware, async (req, res) => {
    const { variants } = req.body;
    if (!variants || !Array.isArray(variants)) return res.status(400).json({ error: 'variants array required' });
    await supabase.from('ab_tests').delete().eq('campaign_id', req.params.id);
    await supabase.from('ab_tests').insert(variants.map(v => ({ id: uuidv4(), campaign_id: req.params.id, variant: v.variant || 'A', subject: v.subject, body_html: v.bodyHtml || '', body_text: v.bodyText || '' })));
    await supabase.from('campaigns').update({ ab_test_enabled: true }).eq('id', req.params.id);
    res.json({ message: `${variants.length} variants created` });
});

// =================== FOLLOW-UP CAMPAIGN ===================
router.post('/:id/follow-up', authMiddleware, async (req, res) => {
    try {
        const { data: originalCampaign } = await supabase.from('campaigns').select('*').eq('id', req.params.id).eq('user_id', req.userId).single();
        if (!originalCampaign) return res.status(404).json({ error: 'Original campaign not found' });

        // Get recipients who did NOT open the original campaign
        const { data: unopened, count } = await supabase.from('campaign_recipients')
            .select('email, subscriber_id', { count: 'exact' })
            .eq('campaign_id', req.params.id)
            .eq('status', 'sent')
            .is('opened_at', null);

        if (!unopened || unopened.length === 0) return res.status(400).json({ error: 'All recipients have opened the original campaign — no follow-up needed!' });

        const { subject, bodyHtml, bodyText, fromName } = req.body;
        const followUpId = uuidv4();
        await supabase.from('campaigns').insert({
            id: followUpId, user_id: req.userId,
            account_id: originalCampaign.account_id,
            name: `Follow-up: ${originalCampaign.name}`,
            subject: subject || `Re: ${originalCampaign.subject}`,
            body_html: bodyHtml || originalCampaign.body_html,
            body_text: bodyText || originalCampaign.body_text,
            from_name: fromName || originalCampaign.from_name,
            reply_to: originalCampaign.reply_to,
            list_id: originalCampaign.list_id,
            throttle_per_minute: originalCampaign.throttle_per_minute,
            track_opens: originalCampaign.track_opens,
            track_clicks: originalCampaign.track_clicks,
            is_follow_up: true,
            parent_campaign_id: req.params.id
        });

        res.status(201).json({
            message: `Follow-up campaign created for ${unopened.length} unopened recipients`,
            campaignId: followUpId,
            unopenedCount: unopened.length,
            totalOriginal: (count || 0)
        });
    } catch (err) {
        console.error('Follow-up error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
