// ===== Eclatrecon AI Mail - Webhook Service (Supabase) =====
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { supabase } = require('../config/initDb');

class WebhookService {
    static async fire(userId, event, payload) {
        const { data: hooks } = await supabase.from('webhooks').select('*').eq('user_id', userId).eq('is_active', true);
        for (const hook of (hooks || [])) {
            const events = hook.events.split(',').map(e => e.trim());
            if (!events.includes(event) && !events.includes('*')) continue;
            this._send(hook, event, payload);
        }
    }

    static async _send(hook, event, payload) {
        const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString(), webhookId: hook.id });
        const signature = crypto.createHmac('sha256', hook.secret).update(body).digest('hex');
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(hook.url, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': signature, 'X-Webhook-Event': event },
                body, signal: controller.signal
            });
            clearTimeout(timeout);
            const responseBody = await res.text().catch(() => '');
            await supabase.from('webhook_logs').insert({ id: uuidv4(), webhook_id: hook.id, event, payload: body, response_status: res.status, response_body: responseBody.slice(0, 500) });
            await supabase.from('webhooks').update({ last_triggered_at: new Date().toISOString(), failure_count: 0 }).eq('id', hook.id);
        } catch (err) {
            await supabase.from('webhook_logs').insert({ id: uuidv4(), webhook_id: hook.id, event, payload: body, response_status: 0, response_body: err.message });
            const { data: hook2 } = await supabase.from('webhooks').select('failure_count').eq('id', hook.id).single();
            const newCount = (hook2?.failure_count || 0) + 1;
            const updates = { failure_count: newCount };
            if (newCount >= 10) updates.is_active = false;
            await supabase.from('webhooks').update(updates).eq('id', hook.id);
        }
    }

    static generateSecret() { return 'whsec_' + crypto.randomBytes(24).toString('hex'); }
}

module.exports = WebhookService;
