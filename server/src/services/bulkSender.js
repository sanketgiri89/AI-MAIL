// ===== Eclatrecon AI Mail - Bulk Email Send Engine (Supabase) =====
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const { supabase } = require('../config/initDb');
const WebhookService = require('./webhooks');

class BulkSender {
    constructor() {
        this.sending = new Map();
    }

    mergeTags(text, subscriber) {
        if (!text) return text;
        return text.replace(/\{\{(\w+)(?:\|([^}]*))?\}\}/g, (match, tag, fallback) => {
            const map = {
                first_name: subscriber.first_name, last_name: subscriber.last_name,
                email: subscriber.email, company: subscriber.company,
                name: [subscriber.first_name, subscriber.last_name].filter(Boolean).join(' '),
                custom_1: subscriber.custom_1, custom_2: subscriber.custom_2,
                custom_3: subscriber.custom_3, custom_4: subscriber.custom_4, custom_5: subscriber.custom_5,
            };
            return map[tag] || fallback || '';
        });
    }

    injectOpenPixel(html, trackingId, baseUrl) {
        if (!html) return html;
        const pixel = `<img src="${baseUrl}/api/campaigns/track/open/${trackingId}" width="1" height="1" style="display:none" alt="" />`;
        return html.replace('</body>', `${pixel}</body>`) || html + pixel;
    }

    async rewriteLinks(html, campaignId, trackingId, baseUrl) {
        if (!html) return html;
        const linkRegex = /href="(https?:\/\/[^"]+)"/gi;
        let match;
        const replacements = [];
        while ((match = linkRegex.exec(html)) !== null) {
            const url = match[1];
            if (url.includes('/track/') || url.includes('/unsubscribe/')) continue;
            let { data: link } = await supabase.from('campaign_links').select('id').eq('campaign_id', campaignId).eq('original_url', url).single();
            if (!link) {
                const linkId = uuidv4();
                await supabase.from('campaign_links').insert({ id: linkId, campaign_id: campaignId, original_url: url });
                link = { id: linkId };
            }
            replacements.push({ original: match[0], replacement: `href="${baseUrl}/api/campaigns/track/click/${link.id}?r=${trackingId}"` });
        }
        let result = html;
        for (const r of replacements) result = result.replace(r.original, r.replacement);
        return result;
    }

    addUnsubscribeFooter(html, trackingId, unsubText, baseUrl) {
        const link = `<div style="text-align:center;margin-top:30px;padding:16px;border-top:1px solid #333;font-size:12px;color:#888;"><a href="${baseUrl}/api/campaigns/unsubscribe/${trackingId}" style="color:#888;text-decoration:underline;">${unsubText || 'Unsubscribe'}</a></div>`;
        if (html && html.includes('</body>')) return html.replace('</body>', `${link}</body>`);
        return (html || '') + link;
    }

    async startCampaign(campaignId, baseUrl = 'http://localhost:3001') {
        const { data: campaign } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
        if (!campaign) return { error: 'Campaign not found' };
        if (campaign.status === 'sending') return { error: 'Already sending' };

        let account;
        if (campaign.account_id) {
            const { data } = await supabase.from('mail_accounts').select('*').eq('id', campaign.account_id).single();
            account = data;
        } else {
            const { data } = await supabase.from('mail_accounts').select('*').eq('user_id', campaign.user_id).eq('is_primary', true).single();
            account = data;
        }
        if (!account) return { error: 'No mail account configured' };

        const { data: subscribers } = await supabase.from('subscribers').select('*').eq('list_id', campaign.list_id).eq('status', 'active');
        if (!subscribers || !subscribers.length) return { error: 'No active subscribers in list' };

        let variants = null;
        if (campaign.ab_test_enabled) {
            const { data } = await supabase.from('ab_tests').select('*').eq('campaign_id', campaignId);
            variants = data;
        }

        // Create recipients
        const recipientRows = subscribers.map((sub, i) => {
            let variant = 'A';
            if (variants && variants.length > 0) variant = String.fromCharCode(65 + (i % variants.length));
            return { id: uuidv4(), campaign_id: campaignId, subscriber_id: sub.id, email: sub.email, first_name: sub.first_name, variant, tracking_id: uuidv4() };
        });
        await supabase.from('campaign_recipients').insert(recipientRows);
        await supabase.from('campaigns').update({ status: 'sending', started_at: new Date().toISOString(), total_recipients: subscribers.length }).eq('id', campaignId);

        const transporter = nodemailer.createTransport({
            host: account.smtp_host, port: account.smtp_port,
            secure: account.smtp_port === 465,
            auth: { user: account.username, pass: account.password_encrypted }
        });

        const delay = Math.ceil(60000 / (campaign.throttle_per_minute || 50));
        this.sending.set(campaignId, { active: true });
        this._processBatch(campaignId, transporter, account, campaign, variants, baseUrl, delay);

        return { message: 'Campaign sending started', totalRecipients: subscribers.length };
    }

    async _processBatch(campaignId, transporter, account, campaign, variants, baseUrl, delay) {
        const state = this.sending.get(campaignId);
        if (!state || !state.active) return;

        const { data: batch } = await supabase.from('campaign_recipients').select('*').eq('campaign_id', campaignId).eq('status', 'pending').limit(10);

        if (!batch || !batch.length) {
            await supabase.from('campaigns').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', campaignId);
            this.sending.delete(campaignId);
            WebhookService.fire(campaign.user_id, 'campaign.completed', { campaignId, name: campaign.name });
            console.log(`✅ Campaign "${campaign.name}" completed`);
            return;
        }

        for (const recipient of batch) {
            if (!this.sending.get(campaignId)?.active) break;

            let subject = campaign.subject;
            let bodyHtml = campaign.body_html;
            let bodyText = campaign.body_text;

            if (variants && variants.length > 0) {
                const v = variants.find(v => v.variant === recipient.variant);
                if (v) { subject = v.subject; bodyHtml = v.body_html || bodyHtml; bodyText = v.body_text || bodyText; }
            }

            const { data: subData } = await supabase.from('subscribers').select('*').eq('id', recipient.subscriber_id).single();
            const mergeData = subData || recipient;
            subject = this.mergeTags(subject, mergeData);
            bodyHtml = this.mergeTags(bodyHtml, mergeData);
            bodyText = this.mergeTags(bodyText, mergeData);

            if (campaign.track_opens) bodyHtml = this.injectOpenPixel(bodyHtml, recipient.tracking_id, baseUrl);
            if (campaign.track_clicks) bodyHtml = await this.rewriteLinks(bodyHtml, campaignId, recipient.tracking_id, baseUrl);
            // Unsubscribe footer removed — it triggers spam filters

            try {
                // Generate unique Message-ID — do NOT share references/inReplyTo (Gmail detects fake threading as spam)
                const messageId = `<${uuidv4()}@${account.email.split('@')[1]}>`;

                await transporter.sendMail({
                    from: `"${campaign.from_name || account.label}" <${account.email}>`,
                    to: recipient.email, subject, text: bodyText, html: bodyHtml,
                    replyTo: campaign.reply_to || account.email,
                    messageId,
                    // NO references/inReplyTo — each campaign email is independent (prevents spam grouping)
                    // Minimal headers — bulk identifiers trigger spam filters
                    headers: {
                        'X-Mailer': 'Eclatrecon AI Mail 1.0',
                        'MIME-Version': '1.0',
                        'X-Priority': '3',
                        'Importance': 'Normal'
                    },
                    priority: 'normal',
                    envelope: { from: account.email, to: [recipient.email] }
                });

                await supabase.from('campaign_recipients').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', recipient.id);
                const { data: camp } = await supabase.from('campaigns').select('sent_count').eq('id', campaignId).single();
                if (camp) await supabase.from('campaigns').update({ sent_count: (camp.sent_count || 0) + 1 }).eq('id', campaignId);
            } catch (err) {
                const isBounce = err.message.includes('550') || err.message.includes('553') || err.message.includes('mailbox');
                const updates = { status: isBounce ? 'bounced' : 'failed', error: err.message };
                if (isBounce) updates.bounced_at = new Date().toISOString();
                await supabase.from('campaign_recipients').update(updates).eq('id', recipient.id);
                if (isBounce) {
                    const { data: camp } = await supabase.from('campaigns').select('bounce_count').eq('id', campaignId).single();
                    if (camp) await supabase.from('campaigns').update({ bounce_count: (camp.bounce_count || 0) + 1 }).eq('id', campaignId);
                    await supabase.from('subscribers').update({ status: 'bounced', bounced_at: new Date().toISOString() }).eq('id', recipient.subscriber_id);
                }
            }

            await new Promise(r => setTimeout(r, delay));
        }

        setTimeout(() => this._processBatch(campaignId, transporter, account, campaign, variants, baseUrl, delay), 100);
    }

    async pauseCampaign(campaignId) {
        const state = this.sending.get(campaignId);
        if (state) state.active = false;
        await supabase.from('campaigns').update({ status: 'paused' }).eq('id', campaignId);
    }

    preview(campaign, subscriber) {
        return {
            subject: this.mergeTags(campaign.subject, subscriber),
            bodyHtml: this.mergeTags(campaign.body_html, subscriber),
            bodyText: this.mergeTags(campaign.body_text, subscriber),
        };
    }
}

module.exports = BulkSender;
