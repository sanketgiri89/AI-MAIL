// ===== OpenRouter AI Service — Full Feature Set =====
const fetch = require('node-fetch');
const { supabase } = require('../config/initDb');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = [
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', cost: 'Free', tier: 'free' },
    { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2 9B', cost: 'Free', tier: 'free' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', cost: 'Free', tier: 'free' },
    { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2 7B', cost: 'Free', tier: 'free' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', cost: '$0.15/1M', tier: 'budget' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', cost: '$0.10/1M', tier: 'budget' },
    { id: 'deepseek/deepseek-chat-v3-0324', name: 'DeepSeek V3', cost: '$0.30/1M', tier: 'budget' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', cost: '$0.30/1M', tier: 'standard' },
    { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', cost: '$1/1M', tier: 'standard' },
    { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', cost: '$3/1M', tier: 'premium' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', cost: '$5/1M', tier: 'premium' },
];

async function getApiKey(userId) {
    const { data } = await supabase.from('integrations')
        .select('api_key').eq('user_id', userId).eq('provider', 'openrouter').single();
    return data?.api_key || process.env.OPENROUTER_API_KEY || null;
}

async function chat(userId, messages, model, opts = {}) {
    const apiKey = await getApiKey(userId);
    if (!apiKey) throw new Error('No OpenRouter API key. Add your key in AI Tools → Settings.');
    const selectedModel = model || process.env.OPENROUTER_DEFAULT_MODEL || MODELS[0].id;
    const res = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_DOMAIN || 'https://llmx.in',
            'X-Title': 'Eclatrecon AI Mail'
        },
        body: JSON.stringify({ model: selectedModel, messages, max_tokens: opts.maxTokens || 2048, temperature: opts.temperature ?? 0.7 })
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `API error ${res.status}`); }
    const d = await res.json();
    return { content: d.choices?.[0]?.message?.content || '', model: d.model, usage: d.usage };
}

// ===== EMAIL COMPOSITION =====
const composeEmail = (uid, prompt, m) => chat(uid, [
    { role: 'system', content: 'You are a professional email writer. Write clear, concise emails. Return ONLY the email body text.' },
    { role: 'user', content: prompt }
], m);

const replyToEmail = (uid, orig, instr, m) => chat(uid, [
    { role: 'system', content: 'Write a professional reply. Return ONLY the reply body.' },
    { role: 'user', content: `Original:\nFrom: ${orig.from}\nSubject: ${orig.subject}\n\n${orig.body}\n\n---\nInstruction: ${instr}` }
], m);

const improveWriting = (uid, text, m) => chat(uid, [
    { role: 'system', content: 'Improve this email for clarity, grammar, and professionalism. Return only the improved text.' },
    { role: 'user', content: text }
], m);

const generateSubjectLine = (uid, body, m) => chat(uid, [
    { role: 'system', content: 'Generate 5 concise, compelling subject lines. Return as numbered list.' },
    { role: 'user', content: body }
], m, { maxTokens: 512 });

const translateEmail = (uid, text, lang, m) => chat(uid, [
    { role: 'system', content: `Translate to ${lang}. Return only the translated text.` },
    { role: 'user', content: text }
], m);

const changeTone = (uid, text, tone, m) => chat(uid, [
    { role: 'system', content: `Rewrite in a ${tone} tone. Return only the rewritten text.` },
    { role: 'user', content: text }
], m);

// ===== EMAIL INTELLIGENCE =====
const summarizeEmail = (uid, text, m) => chat(uid, [
    { role: 'system', content: 'Summarize this email in 2-3 concise bullet points.' },
    { role: 'user', content: text }
], m, { maxTokens: 512 });

const categorizeEmail = (uid, text, m) => chat(uid, [
    { role: 'system', content: 'Categorize this email into ONE of: Important, Newsletter, Social, Promotion, Transactional, Spam, Personal, Work. Return ONLY the category name.' },
    { role: 'user', content: text }
], m, { maxTokens: 64 });

const spamScore = (uid, text, m) => chat(uid, [
    { role: 'system', content: `You are an email deliverability expert. Analyze this email for spam triggers. Return a JSON object:
{"score": 0-100, "verdict": "Clean/Low Risk/Medium Risk/High Risk/Spam", "issues": ["issue1","issue2"], "suggestions": ["fix1","fix2"]}
Score 0 = definitely not spam, 100 = definitely spam. Return ONLY valid JSON.` },
    { role: 'user', content: text }
], m, { maxTokens: 512, temperature: 0.3 });

const prioritizeEmail = (uid, text, m) => chat(uid, [
    { role: 'system', content: `Rate this email's priority. Return JSON: {"priority": "High/Medium/Low", "reason": "brief reason", "action_needed": true/false}. Return ONLY valid JSON.` },
    { role: 'user', content: text }
], m, { maxTokens: 256, temperature: 0.3 });

const extractActionItems = (uid, text, m) => chat(uid, [
    { role: 'system', content: 'Extract all action items and to-dos from this email. Return as a numbered list. If none, say "No action items found."' },
    { role: 'user', content: text }
], m, { maxTokens: 512 });

const summarizeThread = (uid, emails, m) => chat(uid, [
    { role: 'system', content: 'Summarize this email thread. Highlight key points, decisions made, and pending items. Be concise.' },
    { role: 'user', content: emails }
], m, { maxTokens: 1024 });

const contactInsights = (uid, interactions, m) => chat(uid, [
    { role: 'system', content: 'Analyze these email interactions with a contact. Provide: 1) Relationship summary 2) Key topics discussed 3) Pending items 4) Suggested next action. Be concise.' },
    { role: 'user', content: interactions }
], m, { maxTokens: 1024 });

const autoLabel = (uid, text, m) => chat(uid, [
    { role: 'system', content: `Suggest 1-3 labels for this email from: Work, Personal, Finance, Travel, Shopping, Social, Newsletter, Support, Urgent, Follow-Up, Reference, Projects. Return ONLY a comma-separated list.` },
    { role: 'user', content: text }
], m, { maxTokens: 64, temperature: 0.3 });

// ===== CAMPAIGN & MARKETING AI =====
const generateCampaign = (uid, prompt, m) => chat(uid, [
    { role: 'system', content: `You are an email marketing expert. Generate a complete campaign. Return JSON:
{"subject": "subject line", "preview_text": "preview text", "body_html": "<html email body with inline styles>", "body_text": "plain text version", "cta_text": "CTA button text", "cta_url": "https://example.com"}
Use professional HTML email formatting with inline styles. Return ONLY valid JSON.` },
    { role: 'user', content: prompt }
], m, { maxTokens: 4096, temperature: 0.8 });

const abSubjectTest = (uid, topic, m) => chat(uid, [
    { role: 'system', content: 'Generate 5 A/B test subject line variants for an email campaign. For each, explain the psychological trigger used. Format: numbered list with subject in quotes followed by brief explanation.' },
    { role: 'user', content: topic }
], m, { maxTokens: 1024 });

const coldEmail = (uid, data, m) => chat(uid, [
    { role: 'system', content: 'Write a personalized cold outreach email. Be concise (under 150 words), include a clear value prop, end with a soft CTA. Do NOT be salesy. Return ONLY the email body.' },
    { role: 'user', content: `Prospect: ${data.name || 'Unknown'}\nCompany: ${data.company || 'Unknown'}\nRole: ${data.role || 'Unknown'}\nIndustry: ${data.industry || 'Unknown'}\n\nMy product/service: ${data.product}\nValue proposition: ${data.value}\nAdditional context: ${data.context || 'none'}` }
], m);

const followUpEmail = (uid, prevEmail, m) => chat(uid, [
    { role: 'system', content: 'Write a follow-up email based on the previous email that got no response. Be brief, add new value, don\'t be pushy. Return ONLY the email body.' },
    { role: 'user', content: `Previous email:\n${prevEmail}` }
], m);

const landingPageCopy = (uid, prompt, m) => chat(uid, [
    { role: 'system', content: `Write landing page copy. Return JSON:
{"headline": "main headline", "subheadline": "supporting text", "features": [{"title":"","description":""}], "cta_text": "button text", "social_proof": "testimonial or stat"}
Return ONLY valid JSON.` },
    { role: 'user', content: prompt }
], m, { maxTokens: 2048, temperature: 0.8 });

// ===== LEAD & SALES AI =====
const scoreLead = (uid, data, m) => chat(uid, [
    { role: 'system', content: `Score this lead 0-100 based on engagement data. Return JSON:
{"score": 0-100, "grade": "A/B/C/D/F", "signals": ["positive signal1"], "risks": ["risk1"], "recommendation": "next best action"}
Return ONLY valid JSON.` },
    { role: 'user', content: `Lead: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company || 'Unknown'}\nEmails opened: ${data.opens || 0}\nLinks clicked: ${data.clicks || 0}\nReplies: ${data.replies || 0}\nLast activity: ${data.lastActivity || 'Unknown'}\nSubscribe date: ${data.subscribeDate || 'Unknown'}` }
], m, { maxTokens: 512, temperature: 0.3 });

const buildICP = (uid, desc, m) => chat(uid, [
    { role: 'system', content: `Build an Ideal Customer Profile. Return JSON:
{"title": "ICP name", "demographics": {"industry": [], "company_size": "", "revenue": "", "location": []}, "roles": ["target job titles"], "pain_points": ["pain1"], "buying_triggers": ["trigger1"], "channels": ["best outreach channels"], "messaging_tips": ["tip1"]}
Return ONLY valid JSON.` },
    { role: 'user', content: desc }
], m, { maxTokens: 1024, temperature: 0.7 });

const prospectResearch = (uid, company, m) => chat(uid, [
    { role: 'system', content: 'Research and summarize this company for sales outreach. Include: overview, likely pain points, potential value propositions, recommended approach, and talking points. If you don\'t have data, make reasonable inferences from the name/domain.' },
    { role: 'user', content: `Company: ${company}` }
], m, { maxTokens: 1024 });

// ===== PRODUCTIVITY AI =====
const schedulingEmail = (uid, data, m) => chat(uid, [
    { role: 'system', content: 'Write a professional meeting scheduling email. Be concise and friendly. Return ONLY the email body.' },
    { role: 'user', content: `Meeting purpose: ${data.purpose}\nProposed times: ${data.times || 'flexible'}\nDuration: ${data.duration || '30 minutes'}\nLocation/link: ${data.location || 'video call'}\nAdditional context: ${data.context || 'none'}` }
], m);

const generateTemplate = (uid, useCase, m) => chat(uid, [
    { role: 'system', content: `Create a reusable email template with merge tags. Use {{first_name}}, {{company}}, {{custom_1}} as placeholders. Return JSON:
{"name": "template name", "subject": "subject with {{tags}}", "body": "email body with {{tags}}", "description": "when to use this template", "tags_used": ["first_name","company"]}
Return ONLY valid JSON.` },
    { role: 'user', content: useCase }
], m, { maxTokens: 2048 });

const detectUnsubscribe = (uid, text, m) => chat(uid, [
    { role: 'system', content: `Analyze if this email is an unsubscribe/opt-out request. Return JSON: {"is_unsubscribe": true/false, "confidence": 0-100, "reason": "brief explanation"}. Return ONLY valid JSON.` },
    { role: 'user', content: text }
], m, { maxTokens: 128, temperature: 0.2 });

module.exports = {
    MODELS, chat, getApiKey,
    // Email Composition
    composeEmail, replyToEmail, improveWriting, generateSubjectLine, translateEmail, changeTone,
    // Email Intelligence
    summarizeEmail, categorizeEmail, spamScore, prioritizeEmail, extractActionItems,
    summarizeThread, contactInsights, autoLabel,
    // Campaign & Marketing
    generateCampaign, abSubjectTest, coldEmail, followUpEmail, landingPageCopy,
    // Lead & Sales
    scoreLead, buildICP, prospectResearch,
    // Productivity
    schedulingEmail, generateTemplate, detectUnsubscribe
};
