// ===== Eclatrecon AI Mail - Billing & Plans Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');

// =================== PLANS ===================
router.get('/plans', async (req, res) => {
    const { data: plans } = await supabase.from('plans').select('*').order('price_monthly');
    if (!plans || !plans.length) {
        // Seed defaults
        const defaults = [
            { id: uuidv4(), name: 'Free', price_monthly: 0, max_storage_mb: 500, max_emails_per_day: 50, max_api_calls_per_hour: 100, max_accounts: 1, features: 'Basic email,5 labels,2 contacts groups' },
            { id: uuidv4(), name: 'Pro', price_monthly: 9.99, max_storage_mb: 5000, max_emails_per_day: 500, max_api_calls_per_hour: 1000, max_accounts: 5, features: 'All Free features,Campaigns,Templates,Calendar,Tasks,API access' },
            { id: uuidv4(), name: 'Enterprise', price_monthly: 29.99, max_storage_mb: 50000, max_emails_per_day: 5000, max_api_calls_per_hour: 10000, max_accounts: 20, features: 'All Pro features,Shared mailboxes,Delegation,DLP,SLA tracking,Priority support' }
        ];
        await supabase.from('plans').insert(defaults);
        return res.json({ plans: defaults });
    }
    res.json({ plans });
});

// =================== SUBSCRIPTIONS ===================
router.get('/subscription', authMiddleware, async (req, res) => {
    const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', req.userId).single();
    if (!sub) {
        // Auto-assign free plan
        const { data: free } = await supabase.from('plans').select('id').eq('name', 'Free').single();
        if (free) {
            const newSub = { id: uuidv4(), user_id: req.userId, plan_id: free.id };
            await supabase.from('subscriptions').insert(newSub);
            return res.json({ subscription: newSub });
        }
    }
    // Get plan details
    if (sub) {
        const { data: plan } = await supabase.from('plans').select('*').eq('id', sub.plan_id).single();
        return res.json({ subscription: { ...sub, plan_name: plan?.name, price_monthly: plan?.price_monthly, max_storage_mb: plan?.max_storage_mb, max_emails_per_day: plan?.max_emails_per_day, max_api_calls_per_hour: plan?.max_api_calls_per_hour, max_accounts: plan?.max_accounts, features: plan?.features } });
    }
    res.json({ subscription: null });
});

router.post('/subscribe', authMiddleware, async (req, res) => {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ error: 'planId required' });
    const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', req.userId).single();
    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    if (existing) {
        await supabase.from('subscriptions').update({ plan_id: planId, status: 'active', current_period_start: now, current_period_end: periodEnd }).eq('user_id', req.userId);
    } else {
        await supabase.from('subscriptions').insert({ id: uuidv4(), user_id: req.userId, plan_id: planId, current_period_start: now, current_period_end: periodEnd });
    }
    res.json({ message: `Subscribed to ${plan.name}`, plan: plan.name });
});

// =================== USAGE TRACKING ===================
router.get('/usage', authMiddleware, async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const { data: sub } = await supabase.from('subscriptions').select('plan_id').eq('user_id', req.userId).single();
    let limits = { max_storage_mb: 500, max_emails_per_day: 50, max_api_calls_per_hour: 100, max_accounts: 1 };
    let planName = 'Free';
    if (sub) {
        const { data: plan } = await supabase.from('plans').select('*').eq('id', sub.plan_id).single();
        if (plan) { limits = plan; planName = plan.name; }
    }
    const { count: emailsToday } = await supabase.from('emails').select('id', { count: 'exact', head: true }).eq('user_id', req.userId).eq('folder_type', 'sent').gte('received_at', today);
    const { count: accountCount } = await supabase.from('mail_accounts').select('id', { count: 'exact', head: true }).eq('user_id', req.userId);
    res.json({
        usage: {
            emailsSentToday: emailsToday || 0, emailLimit: limits.max_emails_per_day,
            storageMb: 0, storageLimit: limits.max_storage_mb,
            apiCallsThisHour: 0, apiLimit: limits.max_api_calls_per_hour,
            accounts: accountCount || 0, accountLimit: limits.max_accounts
        },
        plan: planName
    });
});

// Stripe webhook placeholder
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), (req, res) => {
    console.log('📦 Stripe webhook received');
    res.json({ received: true });
});

module.exports = router;
