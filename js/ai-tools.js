// ===== Eclatrecon AI Mail - AI Tools Frontend =====
const API = window.location.origin + '/api';
const token = localStorage.getItem('nm_token');
if (!token) window.location.href = '/login';
const H = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

let selectedModel = '';
let models = [];

// ===== TOOLS DEFINITIONS =====
const TOOLS = [
    // Email Composition
    { id:'compose', cat:'Email Composition', icon:'edit_note', name:'AI Compose', desc:'Write a full email from a prompt', fields:[{id:'prompt',label:'What should the email say?',type:'textarea',ph:'e.g. Write a professional email declining a meeting invite politely'}], endpoint:'/ai/compose', bodyKey:'prompt' },
    { id:'reply', cat:'Email Composition', icon:'reply', name:'Smart Reply', desc:'Generate a reply to an email', fields:[{id:'orig-from',label:'From',type:'input',ph:'sender@example.com'},{id:'orig-subject',label:'Subject',type:'input',ph:'Original subject'},{id:'orig-body',label:'Original Email Body',type:'textarea',ph:'Paste the email you received...'},{id:'instruction',label:'Reply Instruction',type:'input',ph:'e.g. Agree and suggest next Tuesday'}], endpoint:'/ai/reply', buildBody: f => ({ originalEmail: { from:f['orig-from'],subject:f['orig-subject'],body:f['orig-body'] }, instruction:f.instruction }) },
    { id:'improve', cat:'Email Composition', icon:'auto_fix_high', name:'Improve Writing', desc:'Fix grammar, clarity, professionalism', fields:[{id:'text',label:'Email Text',type:'textarea',ph:'Paste your draft email here...'}], endpoint:'/ai/improve', bodyKey:'text' },
    { id:'subject', cat:'Email Composition', icon:'title', name:'Subject Generator', desc:'Generate 5 compelling subject lines', fields:[{id:'text',label:'Email Body',type:'textarea',ph:'Paste your email body and I will suggest subject lines...'}], endpoint:'/ai/subject', bodyKey:'text' },
    { id:'translate', cat:'Email Composition', icon:'translate', name:'Translate Email', desc:'Translate email to any language', fields:[{id:'text',label:'Email Text',type:'textarea',ph:'Paste email to translate...'},{id:'targetLang',label:'Target Language',type:'input',ph:'e.g. Spanish, French, Hindi, Japanese'}], endpoint:'/ai/translate', bodyKey:'text', extra:['targetLang'] },
    { id:'tone', cat:'Email Composition', icon:'tune', name:'Change Tone', desc:'Rewrite in a different tone', fields:[{id:'text',label:'Email Text',type:'textarea',ph:'Paste your email...'},{id:'tone',label:'Desired Tone',type:'select',options:['Professional','Friendly','Casual','Formal','Urgent','Apologetic','Enthusiastic','Empathetic','Assertive','Humorous']}], endpoint:'/ai/tone', bodyKey:'text', extra:['tone'] },

    // Email Intelligence
    { id:'summarize', cat:'Email Intelligence', icon:'summarize', name:'Summarize', desc:'2-3 bullet point email summary', fields:[{id:'text',label:'Email Text',type:'textarea',ph:'Paste email to summarize...'}], endpoint:'/ai/summarize', bodyKey:'text' },
    { id:'categorize', cat:'Email Intelligence', icon:'category', name:'Categorize', desc:'Auto-categorize email type', fields:[{id:'text',label:'Email Text',type:'textarea',ph:'Paste email to categorize...'}], endpoint:'/ai/categorize', bodyKey:'text' },
    { id:'spam', cat:'Email Intelligence', icon:'report', name:'Spam Score', desc:'Check if your email will trigger spam filters', fields:[{id:'text',label:'Email Text (your outgoing email)',type:'textarea',ph:'Paste the email you plan to send...'}], endpoint:'/ai/spam-score', bodyKey:'text', isJson:true },
    { id:'priority', cat:'Email Intelligence', icon:'priority_high', name:'Priority Check', desc:'AI-rate email importance', fields:[{id:'text',label:'Email Text',type:'textarea',ph:'Paste incoming email...'}], endpoint:'/ai/prioritize', bodyKey:'text', isJson:true },
    { id:'actions', cat:'Email Intelligence', icon:'checklist', name:'Action Items', desc:'Extract to-dos from email', fields:[{id:'text',label:'Email Text',type:'textarea',ph:'Paste email with tasks...'}], endpoint:'/ai/action-items', bodyKey:'text' },
    { id:'thread', cat:'Email Intelligence', icon:'forum', name:'Thread Summary', desc:'Summarize a long email thread', fields:[{id:'text',label:'Full Thread (paste all emails)',type:'textarea',ph:'Paste the entire email thread...'}], endpoint:'/ai/thread-summary', bodyKey:'text' },
    { id:'contact', cat:'Email Intelligence', icon:'person_search', name:'Contact Insights', desc:'Analyze all interactions with a contact', fields:[{id:'text',label:'Email History (paste all emails with this contact)',type:'textarea',ph:'Paste email exchanges...'}], endpoint:'/ai/contact-insights', bodyKey:'text' },
    { id:'autolabel', cat:'Email Intelligence', icon:'label', name:'Auto-Label', desc:'Suggest labels for an email', fields:[{id:'text',label:'Email Text',type:'textarea',ph:'Paste email to label...'}], endpoint:'/ai/auto-label', bodyKey:'text' },

    // Campaign & Marketing
    { id:'campaign', cat:'Campaign & Marketing', icon:'campaign', name:'Campaign Generator', desc:'AI creates full campaign email with HTML', fields:[{id:'prompt',label:'Campaign Brief',type:'textarea',ph:'e.g. Black Friday sale, 40% off all plans, highlight Pro plan features, urgent tone'}], endpoint:'/ai/campaign', bodyKey:'prompt', isJson:true },
    { id:'abtest', cat:'Campaign & Marketing', icon:'science', name:'A/B Subject Test', desc:'Generate A/B test subject variants', fields:[{id:'topic',label:'Campaign Topic',type:'textarea',ph:'e.g. SaaS product launch announcing new AI features'}], endpoint:'/ai/ab-subject', bodyKey:'topic' },
    { id:'cold', cat:'Campaign & Marketing', icon:'ac_unit', name:'Cold Email Writer', desc:'Personalized cold outreach', fields:[{id:'name',label:'Prospect Name',type:'input',ph:'John Smith'},{id:'company',label:'Company',type:'input',ph:'Acme Corp'},{id:'role',label:'Role/Title',type:'input',ph:'VP Marketing'},{id:'industry',label:'Industry',type:'input',ph:'SaaS'},{id:'product',label:'Your Product/Service',type:'input',ph:'Email marketing platform'},{id:'value',label:'Value Proposition',type:'input',ph:'Increase open rates by 40%'},{id:'context',label:'Additional Context (optional)',type:'input',ph:'They recently raised Series A'}], endpoint:'/ai/cold-email', buildBody:f=>f },
    { id:'followup', cat:'Campaign & Marketing', icon:'forward_to_inbox', name:'Follow-Up Generator', desc:'Generate follow-up for unanswered email', fields:[{id:'text',label:'Previous Email Sent',type:'textarea',ph:'Paste the email that got no response...'}], endpoint:'/ai/follow-up', bodyKey:'text' },
    { id:'landing', cat:'Campaign & Marketing', icon:'web', name:'Landing Page Copy', desc:'AI writes landing page text', fields:[{id:'prompt',label:'Product/Campaign Description',type:'textarea',ph:'e.g. AI-powered email platform for small businesses, affordable pricing, easy setup'}], endpoint:'/ai/landing-copy', bodyKey:'prompt', isJson:true },

    // Lead & Sales
    { id:'score', cat:'Lead & Sales', icon:'leaderboard', name:'Lead Scoring', desc:'AI scores a lead 0-100', fields:[{id:'name',label:'Lead Name',type:'input',ph:'Jane Doe'},{id:'email',label:'Email',type:'input',ph:'jane@company.com'},{id:'company',label:'Company',type:'input',ph:'TechCorp'},{id:'opens',label:'Emails Opened',type:'input',ph:'12'},{id:'clicks',label:'Links Clicked',type:'input',ph:'5'},{id:'replies',label:'Replies',type:'input',ph:'2'},{id:'lastActivity',label:'Last Activity',type:'input',ph:'2 days ago'},{id:'subscribeDate',label:'Subscribe Date',type:'input',ph:'2025-01-15'}], endpoint:'/ai/score-lead', buildBody:f=>f, isJson:true },
    { id:'icp', cat:'Lead & Sales', icon:'target', name:'ICP Builder', desc:'Build Ideal Customer Profile', fields:[{id:'description',label:'Describe Your Ideal Customer',type:'textarea',ph:'e.g. SMB SaaS companies with 10-50 employees, US-based, using HubSpot, series A funded'}], endpoint:'/ai/build-icp', bodyKey:'description', isJson:true },
    { id:'research', cat:'Lead & Sales', icon:'travel_explore', name:'Prospect Research', desc:'AI researches a company for outreach', fields:[{id:'company',label:'Company Name or Domain',type:'input',ph:'e.g. stripe.com or Stripe'}], endpoint:'/ai/prospect-research', bodyKey:'company' },

    // Productivity
    { id:'schedule', cat:'Productivity', icon:'calendar_month', name:'Meeting Email', desc:'Draft a meeting scheduling email', fields:[{id:'purpose',label:'Meeting Purpose',type:'input',ph:'Product demo follow-up'},{id:'times',label:'Proposed Times',type:'input',ph:'Tue 2pm or Wed 10am'},{id:'duration',label:'Duration',type:'input',ph:'30 minutes'},{id:'location',label:'Location/Link',type:'input',ph:'Google Meet'},{id:'context',label:'Context (optional)',type:'input',ph:'Discussed at conference last week'}], endpoint:'/ai/scheduling', buildBody:f=>f },
    { id:'template', cat:'Productivity', icon:'draft', name:'Template Generator', desc:'Create reusable email template with merge tags', fields:[{id:'useCase',label:'Template Use Case',type:'textarea',ph:'e.g. Welcome email for new subscribers with their first name and company name'}], endpoint:'/ai/template', bodyKey:'useCase', isJson:true },
    { id:'unsub', cat:'Productivity', icon:'unsubscribe', name:'Unsubscribe Detector', desc:'Detect if email is an unsubscribe request', fields:[{id:'text',label:'Email Text',type:'textarea',ph:'Paste email to check...'}], endpoint:'/ai/detect-unsubscribe', bodyKey:'text', isJson:true },
];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    buildToolSections();
    buildOverview();
    setupNav();
    await loadConfig();
});

async function loadConfig() {
    try {
        const r = await fetch(`${API}/ai/config`, { headers: H });
        const d = await r.json();
        selectedModel = d.selectedModel;
        const badge = document.getElementById('key-badge');
        if (d.hasKey) { badge.textContent = '🔑 Key Connected'; badge.className = 'key-status connected'; }
        else if (d.hasPlatformKey) { badge.textContent = '🏢 Platform Key'; badge.className = 'key-status connected'; }
        else { badge.textContent = 'No API Key'; badge.className = 'key-status missing'; }
    } catch(e) { console.error(e); }
    try {
        const r = await fetch(`${API}/ai/models`, { headers: H });
        const d = await r.json();
        models = d.models;
        const sel = document.getElementById('model-select');
        sel.innerHTML = '';
        d.models.forEach(m => {
            const o = document.createElement('option');
            o.value = m.id; o.textContent = `${m.name} (${m.cost})`;
            if (m.id === selectedModel) o.selected = true;
            sel.appendChild(o);
        });
        sel.addEventListener('change', async () => {
            selectedModel = sel.value;
            await fetch(`${API}/ai/model`, { method:'POST', headers:H, body:JSON.stringify({model:sel.value}) });
        });
        buildModelCards(d.models);
    } catch(e) { console.error(e); }
}

function buildModelCards(mods) {
    const c = document.getElementById('model-cards');
    if (!c) return;
    c.innerHTML = mods.map(m => `
        <div style="background:rgba(255,255,255,.02);border:1px solid ${m.id===selectedModel?'#ec5b13':'rgba(255,255,255,.06)'};border-radius:10px;padding:14px;cursor:pointer;transition:.2s"
             onclick="selectModel('${m.id}',this)" class="model-card">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-size:13px;font-weight:600">${m.name}</span>
                <span style="font-size:10px;padding:2px 8px;border-radius:4px;background:${m.tier==='free'?'rgba(16,185,129,.1)':m.tier==='budget'?'rgba(59,130,246,.1)':m.tier==='standard'?'rgba(168,85,247,.1)':'rgba(236,91,19,.1)'};color:${m.tier==='free'?'#10b981':m.tier==='budget'?'#3b82f6':m.tier==='standard'?'#a855f7':'#ec5b13'}">${m.cost}</span>
            </div>
            <div style="font-size:10px;color:#475569;margin-top:4px;font-family:'JetBrains Mono',monospace">${m.id.split('/').pop()}</div>
        </div>
    `).join('');
}

async function selectModel(id, el) {
    selectedModel = id;
    document.getElementById('model-select').value = id;
    document.querySelectorAll('.model-card').forEach(c => c.style.borderColor = 'rgba(255,255,255,.06)');
    if(el) el.style.borderColor = '#ec5b13';
    await fetch(`${API}/ai/model`, { method:'POST', headers:H, body:JSON.stringify({model:id}) });
}

// ===== API KEY MGMT =====
async function saveKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) return;
    const msg = document.getElementById('key-msg');
    try {
        const r = await fetch(`${API}/ai/key`, { method:'POST', headers:H, body:JSON.stringify({apiKey:key}) });
        const d = await r.json();
        msg.innerHTML = `<span style="color:#10b981">✓ ${d.message}</span>`;
        document.getElementById('key-badge').textContent = '🔑 Key Connected';
        document.getElementById('key-badge').className = 'key-status connected';
        document.getElementById('api-key-input').value = '';
    } catch(e) { msg.innerHTML = `<span style="color:#ff3b30">✗ Error saving key</span>`; }
}

async function removeKey() {
    if (!confirm('Remove your OpenRouter API key?')) return;
    const msg = document.getElementById('key-msg');
    await fetch(`${API}/ai/key`, { method:'DELETE', headers:H });
    msg.innerHTML = `<span style="color:#ff3b30">Key removed</span>`;
    document.getElementById('key-badge').textContent = 'No API Key';
    document.getElementById('key-badge').className = 'key-status missing';
}

// ===== BUILD UI =====
function buildOverview() {
    const grid = document.getElementById('feature-grid');
    grid.innerHTML = TOOLS.map(t => `
        <div class="feat-card" onclick="switchTab('${t.id}')">
            <div class="icon"><span class="material-symbols-outlined">${t.icon}</span></div>
            <h4>${t.name}</h4>
            <p>${t.desc}</p>
        </div>
    `).join('');
}

function buildToolSections() {
    const container = document.getElementById('tool-sections');
    container.innerHTML = TOOLS.map(t => `
        <div class="section" id="sec-${t.id}">
            <div class="card">
                <h3><span class="material-symbols-outlined">${t.icon}</span> ${t.name}</h3>
                <p class="desc">${t.desc}</p>
                ${t.fields.map(f => `
                    <div class="form-group" style="margin-bottom:12px">
                        <label>${f.label}</label>
                        ${f.type === 'textarea' ? `<textarea class="fi" id="f-${t.id}-${f.id}" placeholder="${f.ph||''}"></textarea>`
                        : f.type === 'select' ? `<select class="fi" id="f-${t.id}-${f.id}">${f.options.map(o=>`<option>${o}</option>`).join('')}</select>`
                        : `<input type="text" class="fi" id="f-${t.id}-${f.id}" placeholder="${f.ph||''}">`}
                    </div>
                `).join('')}
                <button class="btn btn-primary" id="btn-${t.id}" onclick="runTool('${t.id}')">
                    <span class="material-symbols-outlined">auto_awesome</span> Generate
                </button>
                <div class="result-box" id="res-${t.id}">
                    <button class="copy-btn" onclick="copyResult('${t.id}')"><span class="material-symbols-outlined" style="font-size:14px">content_copy</span>Copy</button>
                    <div id="res-content-${t.id}"></div>
                </div>
            </div>
        </div>
    `).join('');
}

function setupNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
}

function switchTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const navBtn = document.querySelector(`.nav-btn[data-tab="${tab}"]`);
    if (navBtn) navBtn.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const sec = document.getElementById(`sec-${tab}`);
    if (sec) sec.classList.add('active');
    const t = TOOLS.find(x => x.id === tab);
    document.getElementById('page-title').textContent = t ? t.name.toUpperCase() : tab === 'overview' ? 'AI TOOLS' : tab === 'settings' ? 'SETTINGS' : tab.toUpperCase();
}

// ===== RUN TOOLS =====
async function runTool(id) {
    const tool = TOOLS.find(t => t.id === id);
    if (!tool) return;
    const btn = document.getElementById(`btn-${id}`);
    const resBox = document.getElementById(`res-${id}`);
    const resContent = document.getElementById(`res-content-${id}`);

    // Collect form values
    const vals = {};
    tool.fields.forEach(f => { vals[f.id] = document.getElementById(`f-${id}-${f.id}`)?.value || ''; });

    // Build body
    let body;
    if (tool.buildBody) {
        body = tool.buildBody(vals);
    } else {
        body = {};
        if (tool.bodyKey) body[tool.bodyKey] = vals[tool.fields[0].id];
        if (tool.extra) tool.extra.forEach(k => { body[k] = vals[k]; });
    }
    body.model = selectedModel;

    btn.disabled = true;
    resContent.innerHTML = '<div class="loading">Generating with AI...</div>';
    resBox.classList.add('show');

    try {
        const r = await fetch(`${API}${tool.endpoint}`, { method:'POST', headers:H, body:JSON.stringify(body) });
        const d = await r.json();
        if (d.error) throw new Error(d.error);

        const content = d.content || JSON.stringify(d, null, 2);

        if (tool.isJson) {
            try {
                const jsonStr = content.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
                const parsed = JSON.parse(jsonStr);
                resContent.innerHTML = renderJson(parsed, tool.id);
            } catch {
                resContent.innerHTML = formatText(content);
            }
        } else {
            resContent.innerHTML = formatText(content);
        }
        if (d.usage) {
            resContent.innerHTML += `<div style="margin-top:12px;padding-top:8px;border-top:1px solid rgba(255,255,255,.04);font-size:10px;color:#475569">${d.model || ''} · ${d.usage.total_tokens||0} tokens</div>`;
        }
    } catch(e) {
        resContent.innerHTML = `<span style="color:#ff3b30">Error: ${e.message}</span>`;
    }
    btn.disabled = false;
}

function formatText(t) {
    return t.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/__(.*?)__/g,'<em>$1</em>');
}

function renderJson(obj, toolId) {
    if (toolId === 'spam') {
        const c = obj.score < 30 ? '#10b981' : obj.score < 60 ? '#f59e0b' : '#ff3b30';
        return `<div style="text-align:center;padding:16px"><div style="font-size:36px;font-weight:700;color:${c}">${obj.score}/100</div><div style="font-size:14px;font-weight:600;color:${c};margin:4px 0">${obj.verdict}</div></div>
        ${obj.issues?.length?`<div style="margin-top:12px"><strong style="color:#ff3b30">⚠ Issues:</strong><ul style="margin:4px 0 0 16px">${obj.issues.map(i=>`<li style="color:#ccc;font-size:12px;margin:4px 0">${i}</li>`).join('')}</ul></div>`:''}
        ${obj.suggestions?.length?`<div style="margin-top:8px"><strong style="color:#10b981">✓ Suggestions:</strong><ul style="margin:4px 0 0 16px">${obj.suggestions.map(s=>`<li style="color:#ccc;font-size:12px;margin:4px 0">${s}</li>`).join('')}</ul></div>`:''}`;
    }
    if (toolId === 'priority') {
        const c = obj.priority==='High'?'#ff3b30':obj.priority==='Medium'?'#f59e0b':'#10b981';
        return `<div style="display:flex;align-items:center;gap:12px"><span style="font-size:24px;font-weight:700;color:${c}">${obj.priority}</span><span style="color:#94a3b8;font-size:13px">${obj.reason||''}</span></div>${obj.action_needed?'<div style="margin-top:8px;color:#f59e0b;font-size:12px">⚡ Action needed</div>':''}`;
    }
    if (toolId === 'score') {
        const c = obj.score>=70?'#10b981':obj.score>=40?'#f59e0b':'#ff3b30';
        return `<div style="text-align:center;padding:12px"><div style="font-size:36px;font-weight:700;color:${c}">${obj.score}</div><div style="font-size:18px;font-weight:600;color:${c}">Grade ${obj.grade}</div></div>
        ${obj.signals?.length?`<div style="margin-top:8px"><strong style="color:#10b981">+ Positive Signals:</strong><ul style="margin:4px 0 0 16px">${obj.signals.map(s=>`<li style="font-size:12px;color:#ccc;margin:2px 0">${s}</li>`).join('')}</ul></div>`:''}
        ${obj.risks?.length?`<div style="margin-top:8px"><strong style="color:#ff3b30">- Risks:</strong><ul style="margin:4px 0 0 16px">${obj.risks.map(s=>`<li style="font-size:12px;color:#ccc;margin:2px 0">${s}</li>`).join('')}</ul></div>`:''}
        ${obj.recommendation?`<div style="margin-top:8px;padding:8px 12px;background:rgba(236,91,19,.06);border-radius:6px;font-size:12px;color:#ec5b13">→ ${obj.recommendation}</div>`:''}`;
    }
    if (toolId === 'campaign') {
        return `<div style="margin-bottom:12px"><strong>Subject:</strong> ${obj.subject||''}</div><div style="margin-bottom:12px"><strong>Preview:</strong> ${obj.preview_text||''}</div><div style="margin-bottom:8px"><strong>CTA:</strong> ${obj.cta_text||''}</div><div style="margin-top:12px;background:#1a1a24;padding:16px;border-radius:8px;border:1px solid rgba(255,255,255,.06)"><strong style="font-size:11px;color:#64748b;display:block;margin-bottom:8px">HTML PREVIEW:</strong>${obj.body_html||obj.body_text||''}</div>`;
    }
    if (toolId === 'icp') {
        return `<h4 style="color:#ec5b13;margin-bottom:8px">${obj.title||'ICP'}</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
        <div><strong>Industry:</strong> ${obj.demographics?.industry?.join(', ')||'—'}</div>
        <div><strong>Size:</strong> ${obj.demographics?.company_size||'—'}</div>
        <div><strong>Revenue:</strong> ${obj.demographics?.revenue||'—'}</div>
        <div><strong>Location:</strong> ${obj.demographics?.location?.join(', ')||'—'}</div></div>
        <div style="margin-top:8px"><strong>Target Roles:</strong> ${obj.roles?.join(', ')||'—'}</div>
        ${obj.pain_points?.length?`<div style="margin-top:8px"><strong>Pain Points:</strong><ul style="margin:2px 0 0 16px">${obj.pain_points.map(p=>`<li style="font-size:12px;margin:2px 0">${p}</li>`).join('')}</ul></div>`:''}
        ${obj.messaging_tips?.length?`<div style="margin-top:8px"><strong>Messaging Tips:</strong><ul style="margin:2px 0 0 16px">${obj.messaging_tips.map(t=>`<li style="font-size:12px;margin:2px 0">${t}</li>`).join('')}</ul></div>`:''}`;
    }
    if (toolId === 'landing') {
        return `<div style="text-align:center;padding:16px 0"><h2 style="font-size:20px;font-weight:700;color:#fff">${obj.headline||''}</h2><p style="color:#94a3b8;margin-top:4px">${obj.subheadline||''}</p></div>
        ${obj.features?.length?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0">${obj.features.map(f=>`<div style="background:rgba(255,255,255,.02);padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,.04)"><strong style="font-size:12px">${f.title}</strong><p style="font-size:11px;color:#94a3b8;margin-top:2px">${f.description}</p></div>`).join('')}</div>`:''}
        <div style="text-align:center;margin-top:12px"><span style="background:#ec5b13;color:#fff;padding:8px 24px;border-radius:6px;font-size:13px;font-weight:600">${obj.cta_text||'Get Started'}</span></div>
        ${obj.social_proof?`<div style="text-align:center;margin-top:12px;font-size:12px;color:#64748b;font-style:italic">"${obj.social_proof}"</div>`:''}`;
    }
    if (toolId === 'template') {
        return `<div style="margin-bottom:8px"><strong>Template:</strong> ${obj.name||''}</div><div style="margin-bottom:8px"><strong>Subject:</strong> <span style="font-family:'JetBrains Mono',monospace;font-size:12px;background:rgba(236,91,19,.06);padding:2px 6px;border-radius:4px">${obj.subject||''}</span></div><div style="margin-bottom:8px"><strong>Body:</strong></div><div style="background:rgba(255,255,255,.02);padding:12px;border-radius:8px;font-size:12px;line-height:1.7;white-space:pre-wrap">${obj.body||''}</div><div style="margin-top:8px;font-size:11px;color:#64748b"><strong>Tags used:</strong> ${obj.tags_used?.join(', ')||'none'}</div>`;
    }
    if (toolId === 'unsub') {
        const c = obj.is_unsubscribe ? '#ff3b30' : '#10b981';
        return `<div style="text-align:center;padding:12px"><div style="font-size:28px;font-weight:700;color:${c}">${obj.is_unsubscribe?'⚠ UNSUBSCRIBE REQUEST':'✓ NOT AN UNSUBSCRIBE'}</div><div style="font-size:13px;color:#94a3b8;margin-top:4px">Confidence: ${obj.confidence}%</div><div style="font-size:12px;color:#64748b;margin-top:4px">${obj.reason||''}</div></div>`;
    }
    // Default JSON render
    return `<pre style="font-size:12px;font-family:'JetBrains Mono',monospace;white-space:pre-wrap">${JSON.stringify(obj,null,2)}</pre>`;
}

function copyResult(id) {
    const el = document.getElementById(`res-content-${id}`);
    navigator.clipboard.writeText(el.innerText).then(() => {
        const btn = el.parentElement.querySelector('.copy-btn');
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">check</span>Copied!';
        setTimeout(() => { btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px">content_copy</span>Copy'; }, 1500);
    });
}
