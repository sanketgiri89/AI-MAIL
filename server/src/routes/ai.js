// ===== Eclatrecon AI Mail - AI Routes (All Features) =====
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { supabase } = require('../config/initDb');
const { v4: uuidv4 } = require('uuid');
const AI = require('../services/ai');

// === Config & Key Management ===
router.get('/models', authMiddleware, (req, res) => res.json({ models: AI.MODELS }));

router.get('/config', authMiddleware, async (req, res) => {
    const { data: int } = await supabase.from('integrations').select('api_key, is_active, created_at').eq('user_id', req.userId).eq('provider', 'openrouter').single();
    const { data: pref } = await supabase.from('user_preferences').select('value').eq('user_id', req.userId).eq('key', 'ai_model').single();
    res.json({ hasKey: !!int?.api_key, hasPlatformKey: !!process.env.OPENROUTER_API_KEY, selectedModel: pref?.value || process.env.OPENROUTER_DEFAULT_MODEL || AI.MODELS[0].id, connectedAt: int?.created_at });
});

router.post('/key', authMiddleware, async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ error: 'API key required' });
    const { data: ex } = await supabase.from('integrations').select('id').eq('user_id', req.userId).eq('provider', 'openrouter').single();
    if (ex) await supabase.from('integrations').update({ api_key: apiKey, is_active: true, last_used_at: new Date().toISOString() }).eq('id', ex.id);
    else await supabase.from('integrations').insert({ id: uuidv4(), user_id: req.userId, provider: 'openrouter', api_key: apiKey, is_active: true });
    res.json({ message: 'API key saved' });
});

router.delete('/key', authMiddleware, async (req, res) => {
    await supabase.from('integrations').delete().eq('user_id', req.userId).eq('provider', 'openrouter');
    res.json({ message: 'API key removed' });
});

router.post('/model', authMiddleware, async (req, res) => {
    const { model } = req.body;
    const { data: ex } = await supabase.from('user_preferences').select('id').eq('user_id', req.userId).eq('key', 'ai_model').single();
    if (ex) await supabase.from('user_preferences').update({ value: model }).eq('id', ex.id);
    else await supabase.from('user_preferences').insert({ id: uuidv4(), user_id: req.userId, key: 'ai_model', value: model });
    res.json({ message: 'Model updated' });
});

// Helper
function ep(fn) { return async (req, res) => { try { const r = await fn(req); res.json(r); } catch(e) { res.status(500).json({ error: e.message }); } }; }

// === Email Composition ===
router.post('/compose', authMiddleware, ep(r => AI.composeEmail(r.userId, r.body.prompt, r.body.model)));
router.post('/reply', authMiddleware, ep(r => AI.replyToEmail(r.userId, r.body.originalEmail, r.body.instruction, r.body.model)));
router.post('/improve', authMiddleware, ep(r => AI.improveWriting(r.userId, r.body.text, r.body.model)));
router.post('/subject', authMiddleware, ep(r => AI.generateSubjectLine(r.userId, r.body.text, r.body.model)));
router.post('/translate', authMiddleware, ep(r => AI.translateEmail(r.userId, r.body.text, r.body.targetLang, r.body.model)));
router.post('/tone', authMiddleware, ep(r => AI.changeTone(r.userId, r.body.text, r.body.tone, r.body.model)));

// === Email Intelligence ===
router.post('/summarize', authMiddleware, ep(r => AI.summarizeEmail(r.userId, r.body.text, r.body.model)));
router.post('/categorize', authMiddleware, ep(r => AI.categorizeEmail(r.userId, r.body.text, r.body.model)));
router.post('/spam-score', authMiddleware, ep(r => AI.spamScore(r.userId, r.body.text, r.body.model)));
router.post('/prioritize', authMiddleware, ep(r => AI.prioritizeEmail(r.userId, r.body.text, r.body.model)));
router.post('/action-items', authMiddleware, ep(r => AI.extractActionItems(r.userId, r.body.text, r.body.model)));
router.post('/thread-summary', authMiddleware, ep(r => AI.summarizeThread(r.userId, r.body.text, r.body.model)));
router.post('/contact-insights', authMiddleware, ep(r => AI.contactInsights(r.userId, r.body.text, r.body.model)));
router.post('/auto-label', authMiddleware, ep(r => AI.autoLabel(r.userId, r.body.text, r.body.model)));

// === Campaign & Marketing ===
router.post('/campaign', authMiddleware, ep(r => AI.generateCampaign(r.userId, r.body.prompt, r.body.model)));
router.post('/ab-subject', authMiddleware, ep(r => AI.abSubjectTest(r.userId, r.body.topic, r.body.model)));
router.post('/cold-email', authMiddleware, ep(r => AI.coldEmail(r.userId, r.body, r.body.model)));
router.post('/follow-up', authMiddleware, ep(r => AI.followUpEmail(r.userId, r.body.text, r.body.model)));
router.post('/landing-copy', authMiddleware, ep(r => AI.landingPageCopy(r.userId, r.body.prompt, r.body.model)));

// === Lead & Sales ===
router.post('/score-lead', authMiddleware, ep(r => AI.scoreLead(r.userId, r.body, r.body.model)));
router.post('/build-icp', authMiddleware, ep(r => AI.buildICP(r.userId, r.body.description, r.body.model)));
router.post('/prospect-research', authMiddleware, ep(r => AI.prospectResearch(r.userId, r.body.company, r.body.model)));

// === Productivity ===
router.post('/scheduling', authMiddleware, ep(r => AI.schedulingEmail(r.userId, r.body, r.body.model)));
router.post('/template', authMiddleware, ep(r => AI.generateTemplate(r.userId, r.body.useCase, r.body.model)));
router.post('/detect-unsubscribe', authMiddleware, ep(r => AI.detectUnsubscribe(r.userId, r.body.text, r.body.model)));

// === Chat ===
router.post('/chat', authMiddleware, ep(r => AI.chat(r.userId, r.body.messages, r.body.model)));

module.exports = router;
