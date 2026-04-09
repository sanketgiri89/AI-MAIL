// ===== Eclatrecon AI Mail - Feature Pages (Productivity, Security, Analytics, Billing, etc.) =====

// =================== CALENDAR ===================
Pages.calendar = function (events) {
    const evCards = (events || []).map(e => {
        const dt = e.start_time ? new Date(e.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        return `<div class="settings-card flex items-start gap-4">
            <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-primary text-lg">event</span></div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-200 truncate">${e.title}</p>
                <p class="text-xs text-slate-500 font-mono mt-0.5">${dt}${e.location ? ' · ' + e.location : ''}</p>
                ${e.description ? `<p class="text-xs text-slate-400 mt-1 truncate">${e.description}</p>` : ''}
            </div>
            <button class="toolbar-btn flex-shrink-0" title="Delete" onclick="deleteCalendarEvent('${e.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
        </div>`;
    }).join('') || '<div class="flex flex-col items-center py-12 text-slate-500"><span class="material-symbols-outlined text-4xl mb-3">calendar_month</span><p class="text-sm">No events yet</p></div>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">CALENDAR</span></div>
            <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showModal('add-event-modal')"><span class="material-symbols-outlined text-sm">add</span> New Event</button>
        </div>
        <div id="add-event-modal" class="settings-card mb-4" style="display:none;">
            <h4 class="text-xs font-bold text-slate-300 mb-3">New Event</h4>
            <div class="flex flex-col gap-3">
                <input type="text" id="ev-title" class="compose-input" placeholder="Event title" />
                <div class="flex gap-3"><input type="datetime-local" id="ev-start" class="compose-input flex-1" /><input type="datetime-local" id="ev-end" class="compose-input flex-1" /></div>
                <input type="text" id="ev-location" class="compose-input" placeholder="Location (optional)" />
                <textarea id="ev-desc" class="compose-input resize-none h-16" placeholder="Description (optional)"></textarea>
                <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="addCalendarEvent()">Create</button><button class="px-4 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('add-event-modal')">Cancel</button></div>
            </div>
        </div>
        <div class="flex flex-col gap-3">${evCards}</div>
    </div></div>`;
};

// =================== TASKS ===================
Pages.tasks = function (tasks) {
    const priorityColors = { P1: 'bg-red-500', P2: 'bg-orange-500', P3: 'bg-blue-500', P4: 'bg-slate-500' };
    const statusGroups = { todo: [], 'in-progress': [], done: [] };
    (tasks || []).forEach(t => { const s = t.status || 'todo'; if (statusGroups[s]) statusGroups[s].push(t); else statusGroups['todo'].push(t); });

    const renderCol = (title, icon, items, status) => {
        const cards = items.map(t => `<div class="p-3 rounded-lg bg-white/[0.03] border border-white/5 mb-2 hover:border-primary/20 transition-all">
            <div class="flex items-center gap-2 mb-1">
                <span class="size-2 rounded-full ${priorityColors[t.priority] || 'bg-slate-500'}"></span>
                <p class="text-sm text-slate-200 flex-1 truncate">${t.title}</p>
                <button class="toolbar-btn" onclick="deleteTask('${t.id}')"><span class="material-symbols-outlined text-xs" style="color:rgba(255,59,48,0.6)">close</span></button>
            </div>
            ${t.description ? `<p class="text-[11px] text-slate-500 truncate">${t.description}</p>` : ''}
            <div class="flex items-center gap-2 mt-2">
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">${t.priority || 'P3'}</span>
                ${t.due_date ? `<span class="text-[10px] font-mono text-slate-500">${new Date(t.due_date).toLocaleDateString([], {month:'short',day:'numeric'})}</span>` : ''}
                ${status !== 'done' ? `<button class="ml-auto text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20" onclick="moveTask('${t.id}','${status === 'todo' ? 'in-progress' : 'done'}')">→</button>` : ''}
            </div>
        </div>`).join('') || '<p class="text-xs text-slate-600 text-center py-4">Empty</p>';
        return `<div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-3 px-1"><span class="material-symbols-outlined text-sm text-primary">${icon}</span><span class="text-xs font-bold dot-matrix text-slate-400">${title}</span><span class="text-[10px] font-mono text-slate-600 ml-auto">${items.length}</span></div><div class="bg-white/[0.01] rounded-xl p-3 min-h-[200px] border border-white/5">${cards}</div></div>`;
    };

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">TASKS</span></div>
            <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showModal('add-task-modal')"><span class="material-symbols-outlined text-sm">add</span> New Task</button>
        </div>
        <div id="add-task-modal" class="settings-card mb-4" style="display:none;">
            <div class="flex gap-3 mb-3"><input type="text" id="task-title" class="compose-input flex-1" placeholder="Task title" /><select id="task-priority" class="form-select-custom w-20"><option>P1</option><option>P2</option><option selected>P3</option><option>P4</option></select></div>
            <div class="flex gap-3"><input type="date" id="task-due" class="compose-input flex-1" /><button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="addTask()">Add</button><button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('add-task-modal')">Cancel</button></div>
        </div>
        <div class="flex gap-4">${renderCol('To Do', 'radio_button_unchecked', statusGroups['todo'], 'todo')}${renderCol('In Progress', 'pending', statusGroups['in-progress'], 'in-progress')}${renderCol('Done', 'check_circle', statusGroups['done'], 'done')}</div>
    </div></div>`;
};

// =================== NOTES ===================
Pages.notes = function (notes) {
    const noteCards = (notes || []).map(n => {
        const updated = n.updated_at ? new Date(n.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
        return `<div class="settings-card relative group">
            ${n.is_pinned ? '<span class="absolute top-2 right-2 material-symbols-outlined text-primary text-sm" style="font-variation-settings:\'FILL\' 1">push_pin</span>' : ''}
            <h4 class="text-sm font-medium text-slate-200 mb-1 pr-6 truncate">${n.title || 'Untitled'}</h4>
            <p class="text-xs text-slate-400 line-clamp-3">${(n.content || '').substring(0, 150)}</p>
            <div class="flex items-center justify-between mt-3"><span class="text-[10px] font-mono text-slate-600">${updated}</span>
                <button class="toolbar-btn opacity-0 group-hover:opacity-100" onclick="deleteNote('${n.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
            </div>
        </div>`;
    }).join('') || '<div class="flex flex-col items-center py-12 text-slate-500 col-span-full"><span class="material-symbols-outlined text-4xl mb-3">sticky_note_2</span><p class="text-sm">No notes yet</p></div>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">NOTES</span></div>
            <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showModal('add-note-modal')"><span class="material-symbols-outlined text-sm">add</span> New Note</button>
        </div>
        <div id="add-note-modal" class="settings-card mb-4" style="display:none;">
            <input type="text" id="note-title" class="compose-input mb-3" placeholder="Note title" />
            <textarea id="note-content" class="compose-input resize-none h-24 mb-3" placeholder="Write your note..."></textarea>
            <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="addNote()">Save</button><button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('add-note-modal')">Cancel</button></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${noteCards}</div>
    </div></div>`;
};

// =================== REMINDERS ===================
Pages.reminders = function (reminders) {
    const items = (reminders || []).map(r => {
        const dt = r.remind_at ? new Date(r.remind_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        return `<div class="settings-card flex items-center gap-4">
            <span class="material-symbols-outlined text-primary">alarm</span>
            <div class="flex-1 min-w-0"><p class="text-sm text-slate-200 truncate">${r.title}</p><p class="text-[11px] font-mono text-slate-500">${dt}${r.is_recurring ? ' · Recurring' : ''}</p></div>
            <button class="toolbar-btn" onclick="deleteReminder('${r.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
        </div>`;
    }).join('') || '<div class="flex flex-col items-center py-12 text-slate-500"><span class="material-symbols-outlined text-4xl mb-3">alarm</span><p class="text-sm">No reminders</p></div>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">REMINDERS</span></div>
            <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showModal('add-reminder-modal')"><span class="material-symbols-outlined text-sm">add</span> New</button>
        </div>
        <div id="add-reminder-modal" class="settings-card mb-4" style="display:none;">
            <div class="flex gap-3 mb-3"><input type="text" id="rem-title" class="compose-input flex-1" placeholder="Reminder title" /><input type="datetime-local" id="rem-time" class="compose-input flex-1" /></div>
            <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="addReminder()">Add</button><button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('add-reminder-modal')">Cancel</button></div>
        </div>
        <div class="flex flex-col gap-3">${items}</div>
    </div></div>`;
};

// =================== SIGNATURES ===================
Pages.signatures = function (sigs) {
    const cards = (sigs || []).map(s => `<div class="settings-card">
        <div class="flex items-center justify-between mb-2"><span class="text-sm font-medium text-slate-200">${s.name}</span>
            <div class="flex items-center gap-2">${s.is_default ? '<span class="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono">DEFAULT</span>' : ''}
                <button class="toolbar-btn" onclick="deleteSignature('${s.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button></div>
        </div>
        <div class="text-xs text-slate-400 border border-white/5 rounded-lg p-3 bg-white/[0.01]">${s.body_html || s.body_text || ''}</div>
    </div>`).join('') || '<div class="flex flex-col items-center py-12 text-slate-500"><span class="material-symbols-outlined text-4xl mb-3">draw</span><p class="text-sm">No signatures yet</p></div>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">SIGNATURES</span></div>
            <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showModal('add-sig-modal')"><span class="material-symbols-outlined text-sm">add</span> New</button>
        </div>
        <div id="add-sig-modal" class="settings-card mb-4" style="display:none;">
            <input type="text" id="sig-name" class="compose-input mb-3" placeholder="Signature name" />
            <textarea id="sig-html" class="compose-input resize-none h-24 mb-3" placeholder="HTML/text signature content"></textarea>
            <label class="flex items-center gap-2 text-xs text-slate-400 mb-3"><input type="checkbox" id="sig-default" class="rounded border-white/10 bg-white/5 text-primary size-4" /> Set as default</label>
            <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="addSignature()">Save</button><button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('add-sig-modal')">Cancel</button></div>
        </div>
        <div class="flex flex-col gap-3">${cards}</div>
    </div></div>`;
};

// =================== TEMPLATES ===================
Pages.templates = function (templates) {
    const cards = (templates || []).map(t => `<div class="settings-card">
        <div class="flex items-center justify-between mb-2"><span class="text-sm font-medium text-slate-200">${t.name}</span>
            <div class="flex items-center gap-2"><span class="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-500 font-mono">${t.category || 'general'}</span>
                <button class="toolbar-btn" onclick="deleteTemplate('${t.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button></div>
        </div>
        <p class="text-xs text-slate-400">${t.subject || '(No subject)'}</p>
    </div>`).join('') || '<div class="flex flex-col items-center py-12 text-slate-500"><span class="material-symbols-outlined text-4xl mb-3">dashboard_customize</span><p class="text-sm">No templates yet</p></div>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">TEMPLATES</span></div>
            <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showModal('add-tpl-modal')"><span class="material-symbols-outlined text-sm">add</span> New</button>
        </div>
        <div id="add-tpl-modal" class="settings-card mb-4" style="display:none;">
            <div class="flex gap-3 mb-3"><input type="text" id="tpl-name" class="compose-input flex-1" placeholder="Template name" /><input type="text" id="tpl-subject" class="compose-input flex-1" placeholder="Subject line" /></div>
            <textarea id="tpl-body" class="compose-input resize-none h-24 mb-3" placeholder="Email body template"></textarea>
            <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="addTemplate()">Save</button><button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('add-tpl-modal')">Cancel</button></div>
        </div>
        <div class="flex flex-col gap-3">${cards}</div>
    </div></div>`;
};

// =================== SCHEDULED EMAILS ===================
Pages.scheduled = function (emails) {
    const items = (emails || []).map(e => `<div class="settings-card flex items-center gap-4">
        <span class="material-symbols-outlined text-primary">schedule_send</span>
        <div class="flex-1 min-w-0"><p class="text-sm text-slate-200 truncate">${e.subject || '(No subject)'}</p><p class="text-[11px] text-slate-500">To: ${e.to_addresses} · Send at: <span class="font-mono">${new Date(e.send_at).toLocaleString()}</span></p></div>
        <span class="text-[10px] px-2 py-0.5 rounded font-mono ${e.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-primary/10 text-primary'}">${e.status || 'pending'}</span>
        ${e.status !== 'sent' ? `<button class="toolbar-btn" onclick="cancelScheduled('${e.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">cancel</span></button>` : ''}
    </div>`).join('') || '<div class="flex flex-col items-center py-12 text-slate-500"><span class="material-symbols-outlined text-4xl mb-3">schedule_send</span><p class="text-sm">No scheduled emails</p></div>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-3 mb-6"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">SCHEDULED EMAILS</span></div>
        <div class="flex flex-col gap-3">${items}</div>
    </div></div>`;
};

// =================== FORWARDING ===================
Pages.forwarding = function (rules) {
    const items = (rules || []).map(r => `<div class="settings-card flex items-center gap-4">
        <span class="material-symbols-outlined text-primary">forward_to_inbox</span>
        <div class="flex-1 min-w-0"><p class="text-sm text-slate-200">${r.forward_to}</p>
            <p class="text-[11px] text-slate-500">${r.condition_from ? 'From: ' + r.condition_from + ' · ' : ''}${r.condition_subject ? 'Subject: ' + r.condition_subject + ' · ' : ''}Keep copy: ${r.keep_copy ? 'Yes' : 'No'}</p></div>
        <span class="text-[10px] px-2 py-0.5 rounded font-mono ${r.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500'}">${r.is_active ? 'Active' : 'Off'}</span>
        <button class="toolbar-btn" onclick="deleteForwardingRule('${r.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
    </div>`).join('') || '<div class="flex flex-col items-center py-12 text-slate-500"><span class="material-symbols-outlined text-4xl mb-3">forward_to_inbox</span><p class="text-sm">No forwarding rules</p></div>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">FORWARDING RULES</span></div>
            <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showModal('add-fwd-modal')"><span class="material-symbols-outlined text-sm">add</span> New Rule</button>
        </div>
        <div id="add-fwd-modal" class="settings-card mb-4" style="display:none;">
            <input type="email" id="fwd-to" class="compose-input mb-3" placeholder="Forward to email" />
            <div class="flex gap-3 mb-3"><input type="text" id="fwd-from" class="compose-input flex-1" placeholder="Condition: from (optional)" /><input type="text" id="fwd-subject" class="compose-input flex-1" placeholder="Condition: subject (optional)" /></div>
            <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="addForwardingRule()">Create</button><button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('add-fwd-modal')">Cancel</button></div>
        </div>
        <div class="flex flex-col gap-3">${items}</div>
    </div></div>`;
};

// =================== ANALYTICS DASHBOARD ===================
Pages.analytics = function (data) {
    const t = data?.totals || {};
    const statCard = (icon, label, value, color = 'text-primary') => `<div class="settings-card flex items-center gap-4">
        <div class="size-10 rounded-lg bg-white/5 flex items-center justify-center"><span class="material-symbols-outlined ${color}">${icon}</span></div>
        <div><p class="text-lg font-bold text-slate-100">${value || 0}</p><p class="text-[10px] text-slate-500 font-mono uppercase">${label}</p></div>
    </div>`;

    const topSenders = (data?.topSenders || []).slice(0, 5).map(s => `<div class="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
        <span class="text-xs text-slate-300 truncate flex-1">${s.from_name || s.from_address}</span>
        <span class="text-xs font-mono text-primary">${s.count}</span>
    </div>`).join('') || '<p class="text-xs text-slate-500">No data</p>';

    const folders = (data?.folders || []).map(f => `<div class="flex items-center justify-between py-1.5">
        <span class="text-xs text-slate-300">${f.folder_type}</span><span class="text-xs font-mono text-slate-400">${f.count}</span>
    </div>`).join('') || '<p class="text-xs text-slate-500">No data</p>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-4xl mx-auto">
        <div class="flex items-center gap-3 mb-6"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">ANALYTICS</span><span class="text-xs text-slate-500 font-mono ml-2">${data?.period || 'Last 30 days'}</span></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            ${statCard('email', 'Total Emails', t.total)}
            ${statCard('inbox', 'Received', t.received, 'text-blue-400')}
            ${statCard('send', 'Sent', t.sent, 'text-emerald-400')}
            ${statCard('star', 'Starred', t.starred, 'text-yellow-400')}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="settings-card"><h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">TOP SENDERS</h4>${topSenders}</div>
            <div class="settings-card"><h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">FOLDER BREAKDOWN</h4>${folders}</div>
        </div>
    </div></div>`;
};

// =================== SECURITY ===================
Pages.security = function (dlpRules, ipWhitelist, gdpr) {
    const dlpCards = (dlpRules || []).map(r => `<div class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
        <div><span class="text-sm text-slate-200">${r.name}</span><span class="text-[10px] font-mono text-slate-500 ml-2">${r.pattern_type}</span></div>
        <button class="toolbar-btn" onclick="deleteDlpRule('${r.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
    </div>`).join('') || '<p class="text-xs text-slate-500">No DLP rules configured</p>';

    const ipCards = (ipWhitelist || []).map(ip => `<div class="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
        <div><span class="text-sm text-slate-200 font-mono">${ip.ip_address}</span><span class="text-xs text-slate-500 ml-2">${ip.label || ''}</span></div>
        <button class="toolbar-btn" onclick="deleteIpWhitelist('${ip.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
    </div>`).join('') || '<p class="text-xs text-slate-500">No IP restrictions</p>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-3xl mx-auto">
        <div class="flex items-center gap-3 mb-6"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">SECURITY & COMPLIANCE</span></div>
        <div class="flex flex-col gap-4">
            <div class="settings-card"><div class="flex items-center justify-between mb-3"><h4 class="text-xs font-bold dot-matrix text-slate-400">DLP RULES</h4>
                <button class="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20" onclick="showModal('add-dlp-modal')">+ Add Rule</button></div>${dlpCards}</div>
            <div id="add-dlp-modal" class="settings-card" style="display:none;">
                <div class="flex gap-3 mb-3"><input type="text" id="dlp-name" class="compose-input flex-1" placeholder="Rule name" /><select id="dlp-type" class="form-select-custom w-32"><option value="regex">Regex</option><option value="keyword">Keyword</option></select></div>
                <div class="flex gap-3"><input type="text" id="dlp-pattern" class="compose-input flex-1" placeholder="Pattern" /><button class="px-3 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="addDlpRule()">Add</button></div>
            </div>
            <div class="settings-card"><div class="flex items-center justify-between mb-3"><h4 class="text-xs font-bold dot-matrix text-slate-400">IP WHITELIST</h4>
                <button class="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20" onclick="showModal('add-ip-modal')">+ Add IP</button></div>${ipCards}</div>
            <div id="add-ip-modal" class="settings-card" style="display:none;">
                <div class="flex gap-3"><input type="text" id="ip-addr" class="compose-input flex-1" placeholder="IP address" /><input type="text" id="ip-label" class="compose-input flex-1" placeholder="Label" /><button class="px-3 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="addIpWhitelist()">Add</button></div>
            </div>
            <div class="settings-card"><h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">GDPR REQUESTS</h4>
                <p class="text-xs text-slate-500">${(gdpr || []).length} requests</p>
                <button class="mt-2 text-xs px-3 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20" onclick="requestGdprExport()">Request Data Export</button>
            </div>
        </div>
    </div></div>`;
};

// =================== BILLING ===================
Pages.billing = function (plans, subscription, usage) {
    const u = usage?.usage || {};
    const planCards = (plans || []).map(p => {
        const isCurrent = subscription?.plan_name === p.name;
        const features = (p.features || '').split(',').map(f => f.trim()).filter(Boolean);
        const featureList = features.map(f => `<p class="flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-400 text-sm">check_circle</span> ${f}
        </p>`).join('');
        return `<div class="settings-card flex-1 flex flex-col ${isCurrent ? 'border-primary/30 ring-1 ring-primary/20' : ''}">
            ${isCurrent ? '<span class="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-mono mb-2 inline-block">CURRENT PLAN</span>' : ''}
            <h4 class="text-lg font-bold text-slate-100">${p.name}</h4>
            <p class="text-2xl font-bold text-primary mt-1">$${p.price_monthly || 0}<span class="text-xs text-slate-500 font-normal">/mo</span></p>
            <div class="flex flex-col gap-1.5 mt-3 text-xs text-slate-400 flex-1">
                <p>• ${p.max_emails_per_day == -1 ? 'Unlimited' : p.max_emails_per_day} emails/day</p>
                <p>• ${p.max_storage_mb || 0} MB storage</p>
                <p>• ${p.max_api_calls_per_hour == -1 ? 'Unlimited' : p.max_api_calls_per_hour} API calls/hr</p>
                <p>• ${p.max_accounts || 1} mail accounts</p>
                ${featureList ? '<div class="border-t border-white/5 pt-2 mt-2">' + featureList + '</div>' : ''}
            </div>
            ${!isCurrent ? `<button class="mt-4 w-full py-2.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 transition-colors flex items-center justify-center gap-2" onclick="subscribeToPlan('${p.id}','${p.name}')">
                <span class="material-symbols-outlined text-sm">upgrade</span> ${p.price_monthly > 0 ? 'Upgrade to ' + p.name : 'Switch to Free'}
            </button>` : '<div class="mt-4 w-full py-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold text-center">Active Plan</div>'}
        </div>`;
    }).join('');

    // Usage progress bars
    const usageBar = (label, current, max, color = 'bg-primary') => {
        const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
        const warn = pct > 80;
        return `<div class="mb-4">
            <div class="flex justify-between text-xs mb-1"><span class="text-slate-400">${label}</span><span class="font-mono ${warn ? 'text-red-400' : 'text-slate-500'}">${current} / ${max}</span></div>
            <div class="w-full h-2 rounded-full bg-white/5 overflow-hidden"><div class="h-full rounded-full ${warn ? 'bg-red-500' : color} transition-all" style="width:${pct}%"></div></div>
        </div>`;
    };

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-5xl mx-auto">
        <div class="flex items-center gap-3 mb-6"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">BILLING & PLANS</span></div>
        <div class="settings-card mb-6">
            <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-4">CURRENT USAGE</h4>
            ${usageBar('Emails Sent Today', u.emailsSentToday || 0, u.emailLimit || 50)}
            ${usageBar('API Calls / Hour', u.apiCallsThisHour || 0, u.apiLimit || 100, 'bg-blue-500')}
            ${usageBar('Storage (MB)', u.storageMb || 0, u.storageLimit || 500, 'bg-emerald-500')}
            ${usageBar('Mail Accounts', u.accounts || 0, u.accountLimit || 1, 'bg-violet-500')}
            <p class="text-[10px] text-slate-600 font-mono mt-2">Plan: ${u.plan || usage?.plan || 'Free'}</p>
        </div>
        <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-4">AVAILABLE PLANS</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">${planCards}</div>
    </div></div>`;
};

// =================== INTEGRATIONS ===================
Pages.integrations = function (status) {
    const ints = status?.integrations || {};
    const baseUrl = window.location.origin + '/api';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-4xl mx-auto">
        <div class="flex items-center gap-3 mb-6"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">INTEGRATIONS</span></div>

        <!-- n8n Integration -->
        <div class="settings-card mb-4">
            <div class="flex items-center gap-3 mb-3">
                <span class="material-symbols-outlined text-primary text-xl">webhook</span>
                <div><h4 class="text-sm font-bold text-slate-100">n8n Integration</h4><p class="text-[10px] text-slate-500">Connect Eclatrecon AI Mail to n8n workflows</p></div>
                <span class="text-[10px] px-2 py-0.5 rounded font-mono ml-auto ${ints.n8n?.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}">${ints.n8n?.status || 'available'}</span>
            </div>
            <div class="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                <p class="text-[10px] font-bold dot-matrix text-slate-400 mb-2">ENDPOINTS FOR n8n</p>
                <div class="space-y-2 text-xs font-mono">
                    <div class="flex items-center gap-2"><span class="text-emerald-400 w-12">GET</span><span class="text-slate-300 flex-1 break-all">${baseUrl}/integrations/n8n/trigger?since=&folder=inbox&limit=20</span></div>
                    <div class="flex items-center gap-2"><span class="text-blue-400 w-12">POST</span><span class="text-slate-300 flex-1 break-all">${baseUrl}/integrations/n8n/send</span></div>
                    <div class="flex items-center gap-2"><span class="text-blue-400 w-12">POST</span><span class="text-slate-300 flex-1 break-all">${baseUrl}/integrations/n8n/contacts</span></div>
                    <div class="flex items-center gap-2"><span class="text-blue-400 w-12">POST</span><span class="text-slate-300 flex-1 break-all">${baseUrl}/integrations/n8n/tasks</span></div>
                </div>
                <p class="text-[10px] text-slate-500 mt-3">Auth: Bearer token in Authorization header. Use your login token or create an API key below.</p>
                <button class="mt-3 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs hover:bg-primary/20" onclick="testN8nTrigger()">🔗 Test Trigger Endpoint</button>
            </div>
        </div>

        <!-- Slack/Discord Notifications -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="settings-card">
                <div class="flex items-center gap-2 mb-3"><span class="material-symbols-outlined text-primary">tag</span><h4 class="text-sm font-bold text-slate-100">Slack</h4>
                    <span class="text-[10px] px-2 py-0.5 rounded font-mono ml-auto bg-emerald-500/10 text-emerald-400">available</span></div>
                <input type="text" id="slack-webhook" class="compose-input mb-2" placeholder="Slack Webhook URL" />
                <input type="text" id="slack-msg" class="compose-input mb-2" placeholder="Test message" value="Hello from Eclatrecon AI Mail! 📧" />
                <button class="px-3 py-1.5 rounded bg-primary text-white text-xs font-bold hover:bg-primary/80" onclick="testSlack()">Send Test</button>
            </div>
            <div class="settings-card">
                <div class="flex items-center gap-2 mb-3"><span class="material-symbols-outlined text-primary">forum</span><h4 class="text-sm font-bold text-slate-100">Discord</h4>
                    <span class="text-[10px] px-2 py-0.5 rounded font-mono ml-auto bg-emerald-500/10 text-emerald-400">available</span></div>
                <input type="text" id="discord-webhook" class="compose-input mb-2" placeholder="Discord Webhook URL" />
                <input type="text" id="discord-msg" class="compose-input mb-2" placeholder="Test message" value="Hello from Eclatrecon AI Mail! 📧" />
                <button class="px-3 py-1.5 rounded bg-primary text-white text-xs font-bold hover:bg-primary/80" onclick="testDiscord()">Send Test</button>
            </div>
        </div>

        <!-- Zapier / Custom Webhooks -->
        <div class="settings-card mb-4">
            <div class="flex items-center gap-2 mb-3"><span class="material-symbols-outlined text-primary">hub</span><h4 class="text-sm font-bold text-slate-100">Zapier & Custom Webhooks</h4></div>
            <p class="text-xs text-slate-400 mb-2">Configure outgoing webhooks to receive notifications when events happen. Manage them in the <a href="#/webhooks" class="text-primary hover:underline">Webhooks</a> section.</p>
            <p class="text-xs text-slate-500">Supported events: <span class="font-mono">email.received, email.sent, email.deleted, contact.created</span></p>
        </div>

        <!-- Public API -->
        <div class="settings-card">
            <div class="flex items-center gap-2 mb-3"><span class="material-symbols-outlined text-primary">api</span><h4 class="text-sm font-bold text-slate-100">REST API</h4></div>
            <p class="text-xs text-slate-400 mb-2">Full REST API at <span class="font-mono text-primary">${baseUrl}/v1/</span> — authenticate with API keys.</p>
            <p class="text-xs text-slate-500 mb-3">Endpoints: emails (CRUD), contacts, folders, labels, search, account stats</p>
            <a href="#/api-keys" class="px-3 py-1.5 rounded bg-primary text-white text-xs font-bold hover:bg-primary/80">Manage API Keys →</a>
            <a href="docs.html" target="_blank" class="ml-3 px-3 py-1.5 rounded bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10">View Docs ↗</a>
        </div>
    </div></div>`;
};

// =================== BACKUP ===================
Pages.backup = function () {
    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-3 mb-6"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">BACKUP & DATA</span></div>
        <div class="flex flex-col gap-4">
            <div class="settings-card">
                <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">EXPORT BACKUP</h4>
                <p class="text-xs text-slate-400 mb-3">Download a complete backup of all your data (emails, contacts, accounts, labels, tasks, notes, signatures, templates).</p>
                <button class="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-2" onclick="createBackup()"><span class="material-symbols-outlined text-sm">download</span> Create Backup</button>
            </div>
            <div class="settings-card">
                <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">DATA RETENTION</h4>
                <p class="text-xs text-slate-400 mb-3">Clean up old trash and spam emails.</p>
                <button class="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10 flex items-center gap-2" onclick="runRetentionCleanup()"><span class="material-symbols-outlined text-sm">delete_sweep</span> Run Cleanup</button>
            </div>
            <div class="settings-card">
                <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">EXPORT EMAILS</h4>
                <p class="text-xs text-slate-400 mb-3">Export your inbox as JSON or EML format.</p>
                <div class="flex gap-3">
                    <a href="${API_BASE}/export/emails?folder=inbox&format=json" class="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10">Export JSON</a>
                    <a href="${API_BASE}/export/emails?folder=inbox&format=eml" class="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10">Export EML</a>
                </div>
            </div>
        </div>
    </div></div>`;
};


// =================== ACTION HANDLERS ===================

function showModal(id) { document.getElementById(id).style.display = ''; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }

// Calendar
async function addCalendarEvent() {
    await Api.addCalendarEvent({ title: document.getElementById('ev-title').value, startTime: document.getElementById('ev-start').value, endTime: document.getElementById('ev-end').value, location: document.getElementById('ev-location').value, description: document.getElementById('ev-desc').value });
    Router.handleRoute();
}
async function deleteCalendarEvent(id) { if (confirm('Delete event?')) { await Api.deleteCalendarEvent(id); Router.handleRoute(); } }

// Tasks
async function addTask() {
    await Api.addTask({ title: document.getElementById('task-title').value, priority: document.getElementById('task-priority').value, dueDate: document.getElementById('task-due').value || null });
    Router.handleRoute();
}
async function moveTask(id, status) { await Api.updateTask(id, { status }); Router.handleRoute(); }
async function deleteTask(id) { if (confirm('Delete task?')) { await Api.deleteTask(id); Router.handleRoute(); } }

// Notes
async function addNote() {
    await Api.addNote({ title: document.getElementById('note-title').value, content: document.getElementById('note-content').value });
    Router.handleRoute();
}
async function deleteNote(id) { if (confirm('Delete note?')) { await Api.deleteNote(id); Router.handleRoute(); } }

// Reminders
async function addReminder() {
    await Api.addReminder({ title: document.getElementById('rem-title').value, remindAt: document.getElementById('rem-time').value });
    Router.handleRoute();
}
async function deleteReminder(id) { if (confirm('Delete reminder?')) { await Api.deleteReminder(id); Router.handleRoute(); } }

// Signatures
async function addSignature() {
    await Api.addSignature({ name: document.getElementById('sig-name').value, bodyHtml: document.getElementById('sig-html').value, isDefault: document.getElementById('sig-default').checked });
    Router.handleRoute();
}
async function deleteSignature(id) { if (confirm('Delete signature?')) { await Api.deleteSignature(id); Router.handleRoute(); } }

// Templates
async function addTemplate() {
    await Api.addTemplate({ name: document.getElementById('tpl-name').value, subject: document.getElementById('tpl-subject').value, bodyHtml: document.getElementById('tpl-body').value });
    Router.handleRoute();
}
async function deleteTemplate(id) { if (confirm('Delete template?')) { await Api.deleteTemplate(id); Router.handleRoute(); } }

// Scheduled
async function cancelScheduled(id) { if (confirm('Cancel this scheduled email?')) { await Api.deleteScheduledEmail(id); Router.handleRoute(); } }

// Forwarding
async function addForwardingRule() {
    await Api.addForwardingRule({ forwardTo: document.getElementById('fwd-to').value, conditionFrom: document.getElementById('fwd-from').value, conditionSubject: document.getElementById('fwd-subject').value });
    Router.handleRoute();
}
async function deleteForwardingRule(id) { if (confirm('Delete rule?')) { await Api.deleteForwardingRule(id); Router.handleRoute(); } }

// Security
async function addDlpRule() {
    await Api.addDlpRule({ name: document.getElementById('dlp-name').value, patternType: document.getElementById('dlp-type').value, pattern: document.getElementById('dlp-pattern').value });
    Router.handleRoute();
}
async function deleteDlpRule(id) { if (confirm('Delete DLP rule?')) { await Api.deleteDlpRule(id); Router.handleRoute(); } }
async function addIpWhitelist() {
    await Api.addIpWhitelist({ ipAddress: document.getElementById('ip-addr').value, label: document.getElementById('ip-label').value });
    Router.handleRoute();
}
async function deleteIpWhitelist(id) { if (confirm('Remove IP?')) { await Api.deleteIpWhitelist(id); Router.handleRoute(); } }
async function requestGdprExport() { alert('GDPR export request submitted. You will be notified when ready.'); }

// Backup
async function createBackup() {
    try {
        const data = await Api.createBackup();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `eclatrecon-mail-backup-${new Date().toISOString().split('T')[0]}.json`; a.click();
    } catch (e) { alert('Backup failed: ' + e.message); }
}
async function runRetentionCleanup() {
    if (!confirm('This will permanently delete old trash and spam. Continue?')) return;
    const r = await Api.retentionCleanup({ trashDays: 30, spamDays: 14 });
    alert(`Cleanup done! Trash: ${r.trashDeleted || 0} deleted, Spam: ${r.spamDeleted || 0} deleted`);
}

// =================== API KEYS PAGE ===================
Pages.apiKeys = function (keys) {
    const keyCards = (keys || []).map(k => {
        const lastUsed = k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never';
        const expires = k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never';
        return `<div class="settings-card flex items-start gap-4">
            <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-primary text-lg">key</span></div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <p class="text-sm font-medium text-slate-200">${k.name}</p>
                    <span class="text-[10px] px-2 py-0.5 rounded font-mono ${k.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}">${k.is_active ? 'Active' : 'Revoked'}</span>
                </div>
                <p class="text-xs font-mono text-slate-500">${k.key_prefix}••••••••••</p>
                <div class="flex items-center gap-3 text-[10px] text-slate-600 font-mono mt-1">
                    <span>Permissions: ${k.permissions}</span>
                    <span>Last used: ${lastUsed}</span>
                    <span>Expires: ${expires}</span>
                </div>
            </div>
            <button class="toolbar-btn flex-shrink-0" onclick="revokeApiKey('${k.id}','${k.name}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
        </div>`;
    }).join('') || '<div class="flex flex-col items-center py-12 text-slate-500"><span class="material-symbols-outlined text-4xl mb-3">key</span><p class="text-sm">No API keys yet</p><p class="text-xs text-slate-600 mt-1">Create one to integrate with external services</p></div>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">API KEYS</span></div>
            <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showModal('create-key-modal')"><span class="material-symbols-outlined text-sm">add</span> Generate Key</button>
        </div>

        <div class="settings-card mb-4 bg-primary/[0.03] border-primary/10">
            <p class="text-xs text-slate-400"><span class="material-symbols-outlined text-primary text-sm align-middle">info</span> API keys authenticate requests to the <span class="font-mono text-primary">/api/v1/</span> endpoints. Pass via <span class="font-mono">X-API-Key</span> header or <span class="font-mono">api_key</span> query param.</p>
        </div>

        <div id="create-key-modal" class="settings-card mb-4" style="display:none;">
            <h4 class="text-xs font-bold text-slate-300 mb-3">Generate New API Key</h4>
            <input type="text" id="key-name" class="compose-input mb-3" placeholder="Key name (e.g. 'n8n production')" />
            <div class="flex gap-3 mb-3">
                <select id="key-perms" class="form-select-custom flex-1"><option value="read">Read only</option><option value="read,send">Read + Send</option><option value="read,write">Read + Write</option><option value="read,write,send">Read + Write + Send</option><option value="full">Full access</option></select>
                <select id="key-expiry" class="form-select-custom flex-1"><option value="">Never expires</option><option value="30">30 days</option><option value="90">90 days</option><option value="365">1 year</option></select>
            </div>
            <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="generateApiKey()">Generate</button><button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('create-key-modal')">Cancel</button></div>
        </div>

        <div id="new-key-display" class="settings-card mb-4 border-emerald-500/20" style="display:none;">
            <div class="flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-emerald-400">check_circle</span><span class="text-xs font-bold text-emerald-400">Key Generated — Copy now, it won't be shown again!</span></div>
            <div class="flex items-center gap-2"><input type="text" id="new-key-value" class="compose-input flex-1 font-mono text-xs" readonly /><button class="px-3 py-1.5 rounded bg-primary/10 text-primary text-xs hover:bg-primary/20" onclick="copyApiKey()">Copy</button></div>
        </div>

        <div class="flex flex-col gap-3">${keyCards}</div>
    </div></div>`;
};

// =================== WEBHOOKS PAGE ===================
Pages.webhooks = function (hooks) {
    const hookCards = (hooks || []).map(h => {
        const lastTriggered = h.last_triggered_at ? new Date(h.last_triggered_at).toLocaleDateString() : 'Never';
        return `<div class="settings-card">
            <div class="flex items-center gap-3 mb-2">
                <span class="material-symbols-outlined text-primary">webhook</span>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-mono text-slate-200 truncate">${h.url}</p>
                    <p class="text-[10px] text-slate-500 font-mono">Events: ${h.events} · Fails: ${h.failure_count || 0} · Last: ${lastTriggered}</p>
                </div>
                <button class="px-2 py-1 rounded text-[10px] font-mono ${h.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}" onclick="toggleWebhook('${h.id}')">${h.is_active ? 'Active' : 'Paused'}</button>
                <button class="toolbar-btn" onclick="deleteWebhook('${h.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
            </div>
        </div>`;
    }).join('') || '<div class="flex flex-col items-center py-12 text-slate-500"><span class="material-symbols-outlined text-4xl mb-3">webhook</span><p class="text-sm">No webhooks configured</p><p class="text-xs text-slate-600 mt-1">Receive notifications when events happen</p></div>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-3xl mx-auto">
        <div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">WEBHOOKS</span></div>
            <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showModal('create-hook-modal')"><span class="material-symbols-outlined text-sm">add</span> New Webhook</button>
        </div>

        <div class="settings-card mb-4 bg-primary/[0.03] border-primary/10">
            <p class="text-xs text-slate-400"><span class="material-symbols-outlined text-primary text-sm align-middle">info</span> Webhooks POST JSON payloads to your URL when events occur. Verify authenticity with the <span class="font-mono">X-Webhook-Signature</span> header (HMAC-SHA256).</p>
        </div>

        <div id="create-hook-modal" class="settings-card mb-4" style="display:none;">
            <h4 class="text-xs font-bold text-slate-300 mb-3">New Webhook</h4>
            <input type="url" id="hook-url" class="compose-input mb-3" placeholder="https://yourapp.com/webhook" />
            <p class="text-[10px] text-slate-500 mb-2">Select events to listen for:</p>
            <div class="flex flex-wrap gap-2 mb-3">
                <label class="flex items-center gap-1.5 text-xs text-slate-400"><input type="checkbox" class="hook-event" value="email.received" checked /> email.received</label>
                <label class="flex items-center gap-1.5 text-xs text-slate-400"><input type="checkbox" class="hook-event" value="email.sent" /> email.sent</label>
                <label class="flex items-center gap-1.5 text-xs text-slate-400"><input type="checkbox" class="hook-event" value="email.deleted" /> email.deleted</label>
                <label class="flex items-center gap-1.5 text-xs text-slate-400"><input type="checkbox" class="hook-event" value="contact.created" /> contact.created</label>
                <label class="flex items-center gap-1.5 text-xs text-slate-400"><input type="checkbox" class="hook-event" value="*" /> All events (*)</label>
            </div>
            <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="createWebhook()">Create</button><button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('create-hook-modal')">Cancel</button></div>
        </div>

        <div id="new-hook-secret" class="settings-card mb-4 border-emerald-500/20" style="display:none;">
            <div class="flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-emerald-400">check_circle</span><span class="text-xs font-bold text-emerald-400">Webhook Created — Copy the secret now!</span></div>
            <div class="flex items-center gap-2"><input type="text" id="hook-secret-value" class="compose-input flex-1 font-mono text-xs" readonly /><button class="px-3 py-1.5 rounded bg-primary/10 text-primary text-xs hover:bg-primary/20" onclick="navigator.clipboard.writeText(document.getElementById('hook-secret-value').value);alert('Copied!')">Copy</button></div>
        </div>

        <div class="flex flex-col gap-3">${hookCards}</div>
    </div></div>`;
};


// =================== NEW ACTION HANDLERS ===================

// Billing - Subscribe
async function subscribeToPlan(planId, planName) {
    if (!confirm(`Switch to ${planName} plan?`)) return;
    try {
        const r = await Api.subscribePlan(planId);
        alert(r.message || `Subscribed to ${planName}!`);
        Router.handleRoute();
    } catch(e) { alert('Error: ' + e.message); }
}

// API Keys
async function generateApiKey() {
    const name = document.getElementById('key-name').value;
    if (!name) return alert('Key name required');
    const r = await Api.createApiKey({
        name, permissions: document.getElementById('key-perms').value,
        expiresInDays: document.getElementById('key-expiry').value ? Number(document.getElementById('key-expiry').value) : undefined
    });
    if (r.key) {
        document.getElementById('new-key-value').value = r.key;
        document.getElementById('new-key-display').style.display = '';
        hideModal('create-key-modal');
        Router.handleRoute();
    } else { alert(r.error || 'Failed to generate key'); }
}
function copyApiKey() {
    const val = document.getElementById('new-key-value').value;
    navigator.clipboard.writeText(val).then(() => alert('API key copied to clipboard!')).catch(() => {
        document.getElementById('new-key-value').select();
        document.execCommand('copy');
        alert('Copied!');
    });
}
async function revokeApiKey(id, name) {
    if (!confirm(`Revoke API key "${name}"? This cannot be undone.`)) return;
    await Api.deleteApiKey(id);
    Router.handleRoute();
}

// Webhooks
async function createWebhook() {
    const url = document.getElementById('hook-url').value;
    if (!url) return alert('Webhook URL required');
    const events = [...document.querySelectorAll('.hook-event:checked')].map(e => e.value);
    if (!events.length) return alert('Select at least one event');
    const r = await Api.createWebhook({ url, events });
    if (r.secret) {
        document.getElementById('hook-secret-value').value = r.secret;
        document.getElementById('new-hook-secret').style.display = '';
        hideModal('create-hook-modal');
        // Don't re-render yet so user can copy secret
    } else { alert(r.error || 'Failed'); }
}
async function deleteWebhook(id) { if (confirm('Delete webhook?')) { await Api.deleteWebhook(id); Router.handleRoute(); } }
async function toggleWebhook(id) { await Api.toggleWebhook(id); Router.handleRoute(); }

// Integrations
async function testN8nTrigger() {
    try {
        const r = await Api.n8nTrigger({ limit: 5 });
        const count = Array.isArray(r) ? r.length : 0;
        alert(`✅ n8n trigger working! Returned ${count} emails.`);
    } catch(e) { alert('❌ Failed: ' + e.message); }
}
async function testSlack() {
    const url = document.getElementById('slack-webhook').value;
    const msg = document.getElementById('slack-msg').value;
    if (!url) return alert('Enter Slack webhook URL');
    try {
        const r = await Api.notifySlack({ webhookUrl: url, message: msg });
        alert(r.success ? '✅ Slack message sent!' : '❌ Failed: status ' + r.status);
    } catch(e) { alert('❌ Error: ' + e.message); }
}
async function testDiscord() {
    const url = document.getElementById('discord-webhook').value;
    const msg = document.getElementById('discord-msg').value;
    if (!url) return alert('Enter Discord webhook URL');
    try {
        const r = await Api.notifyDiscord({ webhookUrl: url, content: msg });
        alert(r.success ? '✅ Discord message sent!' : '❌ Failed: status ' + r.status);
    } catch(e) { alert('❌ Error: ' + e.message); }
}

// =================== LEAD SCRAPER (APIFY) ===================
Pages.leadScraper = function (stats, jobs, leads, actors, settings, lists) {
    const s = stats || {};

    // --- Stat cards ---
    const statCards = `<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div class="settings-card flex items-center gap-3">
            <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center"><span class="material-symbols-outlined text-primary">work_history</span></div>
            <div><p class="text-lg font-bold text-slate-100">${s.totalJobs || 0}</p><p class="text-[10px] text-slate-500 font-mono">SCRAPE JOBS</p></div>
        </div>
        <div class="settings-card flex items-center gap-3">
            <div class="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center"><span class="material-symbols-outlined text-emerald-400">group</span></div>
            <div><p class="text-lg font-bold text-slate-100">${s.totalLeads || 0}</p><p class="text-[10px] text-slate-500 font-mono">TOTAL LEADS</p></div>
        </div>
        <div class="settings-card flex items-center gap-3">
            <div class="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><span class="material-symbols-outlined text-blue-400">alternate_email</span></div>
            <div><p class="text-lg font-bold text-slate-100">${s.leadsWithEmail || 0}</p><p class="text-[10px] text-slate-500 font-mono">WITH EMAIL</p></div>
        </div>
        <div class="settings-card flex items-center gap-3">
            <div class="size-10 rounded-lg bg-violet-500/10 flex items-center justify-center"><span class="material-symbols-outlined text-violet-400">campaign</span></div>
            <div><p class="text-lg font-bold text-slate-100">${s.jobsImported || 0}</p><p class="text-[10px] text-slate-500 font-mono">IMPORTED</p></div>
        </div>
    </div>`;

    // --- Actor options ---
    const actorOptions = (actors || []).map(a =>
        `<option value="${a.id}" ${a.id === (settings.default_actor || 'website-contacts') ? 'selected' : ''}>${a.name}</option>`
    ).join('');

    // --- List options ---
    const listOptions = (lists || []).map(l =>
        `<option value="${l.id}">${l.name} (${l.subscriber_count || 0})</option>`
    ).join('');

    // --- Settings panel ---
    const settingsPanel = `<div id="apify-settings-panel" class="settings-card mb-4" style="display:none;">
        <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">⚙️ APIFY SETTINGS</h4>
        <div class="flex flex-col gap-3">
            <div>
                <label class="text-[10px] text-slate-500 font-mono mb-1 block">APIFY API TOKEN</label>
                <div class="flex gap-2"><input type="password" id="apify-token-input" class="compose-input flex-1 font-mono text-xs" placeholder="apify_api_xxxxxxxxxxxxxxxxx" value="${settings.apify_token || ''}" />
                <button class="px-2 py-1 text-[10px] rounded bg-white/5 text-slate-400 hover:bg-white/10" onclick="document.getElementById('apify-token-input').type=document.getElementById('apify-token-input').type==='password'?'text':'password'">Show</button></div>
                <p class="text-[10px] text-slate-600 mt-1">Get your token from <a href="https://console.apify.com/account/integrations" target="_blank" class="text-primary hover:underline">console.apify.com</a></p>
            </div>
            <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" id="apify-auto-import" class="rounded border-white/10 bg-white/5 text-primary size-4" ${settings.auto_import ? 'checked' : ''} /> Auto-import leads to list</label>
                <select id="apify-default-actor" class="form-select-custom text-xs flex-1">${actorOptions}</select>
            </div>
            <button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold self-start hover:bg-primary/80" onclick="saveApifySettings()">Save Settings</button>
        </div>
    </div>`;

    // --- Scrape form ---
    const scrapeForm = `<div id="scrape-form-panel" class="settings-card mb-4" style="display:none;">
        <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">🔍 NEW SCRAPE JOB</h4>
        <div class="flex flex-col gap-3">
            <div class="flex gap-3">
                <div class="flex-1">
                    <label class="text-[10px] text-slate-500 font-mono mb-1 block">SCRAPER TYPE</label>
                    <select id="scrape-actor-type" class="form-select-custom w-full" onchange="updateScrapeFields()">${actorOptions}</select>
                </div>
                <div class="flex-1">
                    <label class="text-[10px] text-slate-500 font-mono mb-1 block">MAX RESULTS</label>
                    <input type="number" id="scrape-max" class="compose-input" value="50" min="1" max="1000" />
                </div>
            </div>
            <div id="scrape-url-field">
                <label class="text-[10px] text-slate-500 font-mono mb-1 block">URL / WEBSITE</label>
                <input type="text" id="scrape-source" class="compose-input" placeholder="https://example.com" />
            </div>
            <div id="scrape-keyword-field" style="display:none;">
                <label class="text-[10px] text-slate-500 font-mono mb-1 block">KEYWORD / SEARCH TERM</label>
                <input type="text" id="scrape-keyword" class="compose-input" placeholder="e.g. web design agencies" />
            </div>
            <div id="scrape-location-field" style="display:none;">
                <label class="text-[10px] text-slate-500 font-mono mb-1 block">LOCATION</label>
                <input type="text" id="scrape-location" class="compose-input" placeholder="e.g. New York, USA" />
            </div>
            <div id="scrape-custom-fields" style="display:none;">
                <label class="text-[10px] text-slate-500 font-mono mb-1 block">CUSTOM ACTOR ID</label>
                <input type="text" id="scrape-custom-actor" class="compose-input mb-2" placeholder="username/actor-name" />
                <label class="text-[10px] text-slate-500 font-mono mb-1 block">INPUT JSON</label>
                <textarea id="scrape-custom-input" class="compose-input resize-none h-20 font-mono text-xs" placeholder='{"key": "value"}'></textarea>
            </div>
            <div class="border-t border-white/5 pt-3">
                <label class="text-[10px] text-slate-500 font-mono mb-1 block">IMPORT LEADS TO LIST</label>
                <div class="flex gap-2">
                    <select id="scrape-target-list" class="form-select-custom flex-1"><option value="">— Select existing list —</option>${listOptions}</select>
                    <span class="text-xs text-slate-500 leading-8">or</span>
                    <input type="text" id="scrape-new-list" class="compose-input flex-1" placeholder="Create new list name" />
                </div>
            </div>
            <div class="flex gap-2">
                <button class="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-2" onclick="startNewScrape()"><span class="material-symbols-outlined text-sm">rocket_launch</span> Start Scraping</button>
                <button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('scrape-form-panel')">Cancel</button>
            </div>
        </div>
    </div>`;

    // --- Jobs table ---
    const statusBadge = (st) => {
        const colors = { running: 'bg-blue-500/10 text-blue-400', completed: 'bg-emerald-500/10 text-emerald-400', imported: 'bg-violet-500/10 text-violet-400', failed: 'bg-red-500/10 text-red-400', pending: 'bg-yellow-500/10 text-yellow-400' };
        return `<span class="text-[10px] px-2 py-0.5 rounded font-mono ${colors[st] || 'bg-white/5 text-slate-500'}">${st || 'unknown'}</span>`;
    };
    const actorIcons = { 'website-contacts': 'language', 'google-maps': 'map', 'linkedin-search': 'person_search', 'linkedin-profiles': 'work', 'linkedin-profile-detail': 'badge', 'yellow-pages': 'menu_book', 'instagram': 'photo_camera', 'twitter': 'tag', 'custom': 'extension' };

    const jobRows = (jobs || []).map(j => {
        const dt = j.created_at ? new Date(j.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        const icon = actorIcons[j.actor_type] || 'search';
        return `<div class="settings-card flex items-center gap-3 group">
            <div class="size-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-primary text-lg">${icon}</span></div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2"><p class="text-sm text-slate-200 truncate">${j.actor_type}</p>${statusBadge(j.status)}</div>
                <p class="text-[10px] text-slate-500 font-mono truncate">${j.source_url || j.keyword || j.actor_id} · ${dt}</p>
                ${j.list_name ? `<p class="text-[10px] text-slate-600">→ List: ${j.list_name}</p>` : ''}
                ${j.error ? `<p class="text-[10px] text-red-400 truncate">⚠ ${j.error}</p>` : ''}
            </div>
            <span class="text-xs font-mono text-primary font-bold">${j.leads_count || 0}</span>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${j.status === 'running' ? `<button class="toolbar-btn" title="Refresh status" onclick="refreshJob('${j.id}')"><span class="material-symbols-outlined text-sm text-blue-400">refresh</span></button>` : ''}
                ${j.status === 'completed' ? `<button class="toolbar-btn" title="Import to list" onclick="showImportModal('${j.id}')"><span class="material-symbols-outlined text-sm text-emerald-400">upload</span></button>` : ''}
                ${j.status === 'completed' || j.status === 'imported' ? `<button class="toolbar-btn" title="Quick campaign" onclick="showQuickCampaignModal('${j.id}')"><span class="material-symbols-outlined text-sm text-violet-400">campaign</span></button>` : ''}
                <button class="toolbar-btn" title="View leads" onclick="viewJobLeads('${j.id}')"><span class="material-symbols-outlined text-sm text-slate-400">visibility</span></button>
                <button class="toolbar-btn" title="Delete" onclick="deleteScrapeJob('${j.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
            </div>
        </div>`;
    }).join('') || '<div class="flex flex-col items-center py-8 text-slate-500"><span class="material-symbols-outlined text-3xl mb-2">search_off</span><p class="text-sm">No scrape jobs yet</p><p class="text-xs text-slate-600 mt-1">Start your first scrape to find leads</p></div>';

    // --- Leads table ---
    const leadsTable = (leads || []).length > 0 ? `<div class="settings-card">
        <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold dot-matrix text-slate-400">RECENT LEADS (with email)</h4>
            <div class="flex gap-2">
                <button class="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1" onclick="exportLeadsCsv()"><span class="material-symbols-outlined text-xs">download</span> CSV</button>
                <button class="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1" onclick="showBulkImportModal()"><span class="material-symbols-outlined text-xs">upload</span> Import All</button>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-xs">
                <thead><tr class="border-b border-white/10 text-slate-500 font-mono text-[10px]">
                    <th class="text-left py-2 pr-3">Email</th><th class="text-left py-2 pr-3">Name</th><th class="text-left py-2 pr-3">Company</th><th class="text-left py-2 pr-3">Phone</th><th class="text-left py-2">Source</th>
                </tr></thead>
                <tbody>${leads.map(l => `<tr class="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td class="py-2 pr-3 text-primary font-mono truncate max-w-[200px]">${l.email || '—'}</td>
                    <td class="py-2 pr-3 text-slate-300 truncate max-w-[150px]">${[l.first_name, l.last_name].filter(Boolean).join(' ') || '—'}</td>
                    <td class="py-2 pr-3 text-slate-400 truncate max-w-[150px]">${l.company || '—'}</td>
                    <td class="py-2 pr-3 text-slate-400 font-mono">${l.phone || '—'}</td>
                    <td class="py-2 text-slate-500 truncate max-w-[120px]">${l.actor_type || '—'}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>
    </div>` : '';

    // --- Import modal ---
    const importModal = `<div id="import-leads-modal" class="settings-card mb-4" style="display:none;">
        <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">📥 IMPORT LEADS TO LIST</h4>
        <input type="hidden" id="import-job-id" />
        <div class="flex gap-2 mb-3">
            <select id="import-list-id" class="form-select-custom flex-1"><option value="">— Select list —</option>${listOptions}</select>
            <span class="text-xs text-slate-500 leading-8">or</span>
            <input type="text" id="import-new-list" class="compose-input flex-1" placeholder="New list name" />
        </div>
        <label class="flex items-center gap-2 text-xs text-slate-400 mb-3"><input type="checkbox" id="import-email-only" class="rounded border-white/10 bg-white/5 text-primary size-4" checked /> Only import leads with email</label>
        <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1" onclick="importLeadsFromJob()"><span class="material-symbols-outlined text-sm">upload</span> Import</button>
        <button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('import-leads-modal')">Cancel</button></div>
    </div>`;

    // --- Quick Campaign modal ---
    const campaignModal = `<div id="quick-campaign-modal" class="settings-card mb-4" style="display:none;">
        <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">🚀 QUICK CAMPAIGN FROM LEADS</h4>
        <input type="hidden" id="qc-job-id" />
        <div class="flex flex-col gap-3">
            <input type="text" id="qc-name" class="compose-input" placeholder="Campaign Name" />
            <input type="text" id="qc-subject" class="compose-input" placeholder="Email Subject Line" />
            <textarea id="qc-body" class="compose-input resize-none h-24" placeholder="Email body (HTML or plain text)...&#10;&#10;Use merge tags: {{first_name}}, {{last_name}}, {{company}}, {{email}}"></textarea>
            <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 flex items-center gap-1" onclick="createQuickCampaign()"><span class="material-symbols-outlined text-sm">campaign</span> Create Campaign</button>
            <button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('quick-campaign-modal')">Cancel</button></div>
        </div>
    </div>`;

    // --- Job leads detail view ---
    const leadsDetail = `<div id="job-leads-detail" class="settings-card mb-4" style="display:none;">
        <div class="flex items-center justify-between mb-3"><h4 class="text-xs font-bold dot-matrix text-slate-400">📋 JOB LEADS</h4>
        <button class="text-xs px-2 py-1 rounded bg-white/5 text-slate-400 hover:bg-white/10" onclick="hideModal('job-leads-detail')">Close</button></div>
        <div id="job-leads-content" class="max-h-80 overflow-y-auto custom-scrollbar"></div>
    </div>`;

    // --- Bulk import modal ---
    const bulkImportModal = `<div id="bulk-import-modal" class="settings-card mb-4" style="display:none;">
        <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">📥 BULK IMPORT ALL LEADS</h4>
        <p class="text-xs text-slate-400 mb-3">Import all scraped leads with emails into a subscriber list.</p>
        <div class="flex gap-2 mb-3">
            <select id="bulk-import-list" class="form-select-custom flex-1"><option value="">— Select list —</option>${listOptions}</select>
            <span class="text-xs text-slate-500 leading-8">or</span>
            <input type="text" id="bulk-import-new-list" class="compose-input flex-1" placeholder="New list name" />
        </div>
        <div class="flex gap-2"><button class="px-4 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700" onclick="bulkImportLeads()">Import All</button>
        <button class="px-3 py-1.5 rounded bg-white/5 text-slate-400 text-xs" onclick="hideModal('bulk-import-modal')">Cancel</button></div>
    </div>`;

    // --- Documentation cards ---
    const docsSection = `<div class="settings-card mb-4 bg-primary/[0.03] border-primary/10">
        <div class="flex items-center gap-2 mb-2"><span class="material-symbols-outlined text-primary text-sm">info</span><span class="text-xs font-bold text-slate-300">HOW IT WORKS</span></div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-400">
            <div class="flex items-start gap-2"><span class="text-primary font-bold">1.</span><span><strong class="text-slate-300">Configure</strong> — Add your Apify API token in Settings. Get one free at <a href="https://apify.com" target="_blank" class="text-primary hover:underline">apify.com</a></span></div>
            <div class="flex items-start gap-2"><span class="text-primary font-bold">2.</span><span><strong class="text-slate-300">Scrape</strong> — Pick a scraper, enter URL/keyword, and start. Leads are extracted automatically from the results.</span></div>
            <div class="flex items-start gap-2"><span class="text-primary font-bold">3.</span><span><strong class="text-slate-300">Campaign</strong> — Import leads to a subscriber list or create a campaign instantly. Use merge tags for personalization.</span></div>
        </div>
    </div>`;

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6"><div class="max-w-5xl mx-auto">
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button>
                <span class="text-sm font-bold dot-matrix text-slate-200">LEAD SCRAPER</span>
                <span class="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full ml-1">APIFY</span>
            </div>
            <div class="flex gap-2">
                <button class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs hover:bg-white/10 flex items-center gap-1" onclick="toggleModal('apify-settings-panel')"><span class="material-symbols-outlined text-sm">settings</span> Settings</button>
                <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="toggleModal('scrape-form-panel')"><span class="material-symbols-outlined text-sm">search</span> New Scrape</button>
            </div>
        </div>

        ${docsSection}
        ${statCards}
        ${settingsPanel}
        ${scrapeForm}
        ${importModal}
        ${campaignModal}
        ${leadsDetail}
        ${bulkImportModal}

        <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3 flex items-center gap-2"><span class="material-symbols-outlined text-sm text-primary">history</span> SCRAPE JOBS</h4>
        <div class="flex flex-col gap-3 mb-6">${jobRows}</div>

        ${leadsTable}
    </div></div>`;
};

// =================== LEAD SCRAPER ACTION HANDLERS ===================

function toggleModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}

function updateScrapeFields() {
    const type = document.getElementById('scrape-actor-type').value;
    const urlField = document.getElementById('scrape-url-field');
    const kwField = document.getElementById('scrape-keyword-field');
    const locField = document.getElementById('scrape-location-field');
    const customFields = document.getElementById('scrape-custom-fields');

    urlField.style.display = 'none'; kwField.style.display = 'none';
    locField.style.display = 'none'; customFields.style.display = 'none';

    switch (type) {
        case 'website-contacts': case 'linkedin-profiles': case 'linkedin-profile-detail': case 'instagram': case 'twitter':
            urlField.style.display = ''; break;
        case 'google-maps': case 'linkedin-search': case 'yellow-pages':
            kwField.style.display = ''; locField.style.display = ''; break;
        case 'custom':
            customFields.style.display = ''; break;
    }

    // Update placeholders based on type
    const srcInput = document.getElementById('scrape-source');
    const kwInput = document.getElementById('scrape-keyword');
    const locInput = document.getElementById('scrape-location');
    if (type === 'linkedin-search') {
        kwInput.placeholder = 'Job title e.g. CEO, Marketing Manager, Software Engineer';
        locInput.placeholder = 'e.g. India, United States, London';
    } else if (type === 'linkedin-profiles' || type === 'linkedin-profile-detail') {
        srcInput.placeholder = 'LinkedIn profile URLs (comma-separated)';
    } else if (type === 'google-maps') {
        kwInput.placeholder = 'e.g. web design agencies, restaurants';
        locInput.placeholder = 'e.g. New York, USA';
    } else {
        kwInput.placeholder = 'e.g. web design agencies';
        locInput.placeholder = 'e.g. New York, USA';
        srcInput.placeholder = 'https://example.com';
    }
}

async function saveApifySettings() {
    const token = document.getElementById('apify-token-input').value;
    const autoImport = document.getElementById('apify-auto-import').checked ? 1 : 0;
    const defaultActor = document.getElementById('apify-default-actor').value;
    try {
        await Api.saveApifySettings({ apify_token: token, auto_import: autoImport, default_actor: defaultActor });
        alert('✅ Settings saved!');
    } catch (e) { alert('❌ Error: ' + e.message); }
}

async function startNewScrape() {
    const actorType = document.getElementById('scrape-actor-type').value;
    const source = document.getElementById('scrape-source')?.value || '';
    const keyword = document.getElementById('scrape-keyword')?.value || '';
    const location = document.getElementById('scrape-location')?.value || '';
    const maxResults = document.getElementById('scrape-max')?.value || 50;
    const listId = document.getElementById('scrape-target-list')?.value || '';
    const newListName = document.getElementById('scrape-new-list')?.value || '';
    const customActorId = document.getElementById('scrape-custom-actor')?.value || '';
    const customInput = document.getElementById('scrape-custom-input')?.value || '';

    if (actorType === 'custom' && !customActorId) return alert('Custom Actor ID required');
    if (['website-contacts', 'linkedin-profiles', 'instagram', 'twitter'].includes(actorType) && !source) return alert('URL is required');
    if (['google-maps', 'linkedin-search', 'yellow-pages'].includes(actorType) && !keyword) return alert('Keyword is required');

    try {
        const r = await Api.startScrape({
            actor_type: actorType, source, keyword, location,
            max_results: maxResults, list_id: listId,
            create_list_name: newListName, custom_actor_id: customActorId,
            custom_input: customInput
        });
        if (r.error) { alert('❌ ' + r.error); return; }
        alert('🚀 Scrape job started! It will run in the background.');
        Router.handleRoute();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

async function refreshJob(jobId) {
    try {
        const r = await Api.refreshScrapeJob(jobId);
        alert(`Job status: ${r.status || r.apiStatus || 'unknown'}`);
        Router.handleRoute();
    } catch (e) { alert('Error: ' + e.message); }
}

async function deleteScrapeJob(jobId) {
    if (!confirm('Delete this scrape job and all its leads?')) return;
    await Api.deleteScrapeJob(jobId);
    Router.handleRoute();
}

async function viewJobLeads(jobId) {
    const detail = document.getElementById('job-leads-detail');
    const content = document.getElementById('job-leads-content');
    detail.style.display = '';
    content.innerHTML = '<p class="text-xs text-slate-500">Loading...</p>';
    try {
        const r = await Api.getScrapeJob(jobId);
        const leads = r.leads || [];
        if (leads.length === 0) { content.innerHTML = '<p class="text-xs text-slate-500">No leads found for this job</p>'; return; }
        content.innerHTML = `<table class="w-full text-xs"><thead><tr class="border-b border-white/10 text-slate-500 font-mono text-[10px]">
            <th class="text-left py-1">Email</th><th class="text-left py-1">Name</th><th class="text-left py-1">Company</th><th class="text-left py-1">Phone</th><th class="text-left py-1">Website</th></tr></thead>
            <tbody>${leads.map(l => `<tr class="border-b border-white/5">
                <td class="py-1.5 pr-2 text-primary font-mono truncate max-w-[180px]">${l.email || '—'}</td>
                <td class="py-1.5 pr-2 text-slate-300">${[l.first_name, l.last_name].filter(Boolean).join(' ') || '—'}</td>
                <td class="py-1.5 pr-2 text-slate-400">${l.company || '—'}</td>
                <td class="py-1.5 pr-2 text-slate-400 font-mono">${l.phone || '—'}</td>
                <td class="py-1.5 text-slate-500 truncate max-w-[120px]">${l.website || '—'}</td>
            </tr>`).join('')}</tbody></table>`;
    } catch (e) { content.innerHTML = `<p class="text-xs text-red-400">Error: ${e.message}</p>`; }
}

function showImportModal(jobId) {
    document.getElementById('import-job-id').value = jobId;
    showModal('import-leads-modal');
}

async function importLeadsFromJob() {
    const jobId = document.getElementById('import-job-id').value;
    const listId = document.getElementById('import-list-id').value;
    const newListName = document.getElementById('import-new-list').value;
    const emailOnly = document.getElementById('import-email-only').checked;
    if (!listId && !newListName) return alert('Select a list or enter a new list name');
    try {
        const r = await Api.importLeads({ job_id: jobId, list_id: listId, create_list_name: newListName, filter_has_email: emailOnly });
        alert(`✅ Imported ${r.imported} leads! (${r.skipped} skipped)\nTotal in list: ${r.totalInList}`);
        Router.handleRoute();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function showQuickCampaignModal(jobId) {
    document.getElementById('qc-job-id').value = jobId;
    showModal('quick-campaign-modal');
}

async function createQuickCampaign() {
    const jobId = document.getElementById('qc-job-id').value;
    const name = document.getElementById('qc-name').value;
    const subject = document.getElementById('qc-subject').value;
    const bodyHtml = document.getElementById('qc-body').value;
    if (!name || !subject) return alert('Campaign name and subject required');
    try {
        const r = await Api.quickCampaign({ job_id: jobId, campaign_name: name, subject, body_html: bodyHtml, body_text: bodyHtml });
        alert(`🚀 Campaign created with ${r.imported} leads!\nOpen Marketing page to send it.`);
        hideModal('quick-campaign-modal');
        Router.handleRoute();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function showBulkImportModal() { showModal('bulk-import-modal'); }

async function bulkImportLeads() {
    const listId = document.getElementById('bulk-import-list').value;
    const newListName = document.getElementById('bulk-import-new-list').value;
    if (!listId && !newListName) return alert('Select a list or enter a new list name');
    try {
        const r = await Api.importLeads({ list_id: listId, create_list_name: newListName, filter_has_email: true });
        alert(`✅ Imported ${r.imported} leads! (${r.skipped} skipped)\nTotal in list: ${r.totalInList}`);
        Router.handleRoute();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

function exportLeadsCsv() {
    window.open(API_BASE + '/apify/export?has_email=1', '_blank');
}

// =================== TEAM PAGE ===================
Pages.team = function (members, sharedMailboxes, delegations, accounts) {
    const currentUser = Api.user();

    // Team members cards
    const memberCards = (members || []).map(m => {
        const init = (m.name || '?').charAt(0).toUpperCase();
        const isMe = m.id === currentUser.id;
        const roleColor = m.is_admin ? 'text-primary bg-primary/10' : 'text-slate-400 bg-white/5';
        const roleText = m.is_admin ? 'Admin' : 'Member';
        return `<div class="flex items-center justify-between py-3 px-4 border border-white/5 rounded-xl group hover:border-white/10 transition-all ${isMe ? 'bg-primary/[0.03] border-primary/10' : ''}">
            <div class="flex items-center gap-3">
                <div class="size-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">${init}</div>
                <div>
                    <p class="text-sm text-slate-200 font-medium">${m.name} ${isMe ? '<span class="text-[9px] font-mono text-primary">(you)</span>' : ''}</p>
                    <p class="text-[10px] text-slate-500 font-mono">${m.email}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded ${roleColor}">${roleText}</span>
                <span class="text-[10px] text-slate-600 font-mono">${new Date(m.created_at).toLocaleDateString()}</span>
                ${!isMe ? `<button class="toolbar-btn opacity-0 group-hover:opacity-100" title="Toggle Role" onclick="toggleMemberRole('${m.id}',${m.is_admin ? 0 : 1})"><span class="material-symbols-outlined text-sm text-blue-400">swap_horiz</span></button>
                <button class="toolbar-btn opacity-0 group-hover:opacity-100" title="Remove" onclick="removeTeamMember('${m.id}','${m.name}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">person_remove</span></button>` : ''}
            </div>
        </div>`;
    }).join('') || '<p class="text-xs text-slate-500 py-4 text-center">No team members yet</p>';

    // Shared mailbox cards
    const mailboxCards = (sharedMailboxes || []).map(mb => {
        return `<div class="flex items-center justify-between py-3 px-4 border border-white/5 rounded-xl group hover:border-white/10 transition-all">
            <div class="flex items-center gap-3">
                <div class="size-9 rounded-xl bg-blue-500/10 flex items-center justify-center"><span class="material-symbols-outlined text-blue-400 text-lg">mail</span></div>
                <div>
                    <p class="text-sm text-slate-200 font-medium">${mb.name}</p>
                    <p class="text-[10px] text-slate-500 font-mono">${mb.email}</p>
                    <p class="text-[10px] text-slate-600 font-mono">${mb.description || ''} · ${mb.member_count || 1} members</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button class="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 hover:bg-white/10" onclick="viewMailboxMembers('${mb.id}','${mb.name}')">Members</button>
                <button class="toolbar-btn opacity-0 group-hover:opacity-100" title="Delete" onclick="deleteSharedMailbox('${mb.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
            </div>
        </div>`;
    }).join('') || '<p class="text-xs text-slate-500 py-4 text-center">No shared mailboxes yet</p>';

    // Delegation cards
    const delegTo = (delegations.delegatedTo || []);
    const delegFrom = (delegations.delegatedFrom || []);
    const delegCards = [...delegTo.map(d => `<div class="flex items-center justify-between py-2 px-3 border border-white/5 rounded-lg">
        <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-sm text-emerald-400">arrow_forward</span>
            <p class="text-xs text-slate-300"><span class="font-medium">${d.delegate_name}</span> <span class="text-slate-600">(${d.delegate_email})</span></p>
            <span class="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400">${d.can_send_as ? 'Send-As' : ''} ${d.can_read ? 'Read' : ''}</span>
        </div>
        <button class="toolbar-btn" onclick="deleteDelegation('${d.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">close</span></button>
    </div>`),
    ...delegFrom.map(d => `<div class="flex items-center justify-between py-2 px-3 border border-white/5 rounded-lg bg-white/[0.02]">
        <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-sm text-blue-400">arrow_back</span>
            <p class="text-xs text-slate-300">From <span class="font-medium">${d.delegator_name}</span> <span class="text-slate-600">(${d.delegator_email})</span></p>
            <span class="text-[9px] font-mono px-1 py-0.5 rounded bg-blue-500/10 text-blue-400">${d.can_send_as ? 'Send-As' : ''} ${d.can_read ? 'Read' : ''}</span>
        </div>
    </div>`)].join('') || '<p class="text-xs text-slate-500 py-4 text-center">No delegations set up</p>';

    // Account selector for shared mailbox creation
    const accountOptions = (accounts || []).map(a => `<option value="${a.id}">${a.email} (${a.label})</option>`).join('');

    // Team members dropdown for adding to shared mailbox or delegation
    const memberOptions = (members || []).map(m => `<option value="${m.id}">${m.name} (${m.email})</option>`).join('');

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div class="max-w-3xl mx-auto flex flex-col gap-6">
            <div class="flex items-center gap-3 mb-2"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">TEAM MANAGEMENT</span></div>

            <!-- TEAM MEMBERS -->
            <div class="settings-card">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h4 class="text-xs font-bold dot-matrix text-slate-400">TEAM MEMBERS</h4>
                        <p class="text-[10px] text-slate-600 font-mono mt-1">${(members || []).length} members</p>
                    </div>
                    <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showModal('invite-modal')"><span class="material-symbols-outlined text-sm">person_add</span> Invite Member</button>
                </div>
                <div class="flex flex-col gap-2">${memberCards}</div>
            </div>

            <!-- SHARED MAILBOXES -->
            <div class="settings-card">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h4 class="text-xs font-bold dot-matrix text-slate-400">SHARED MAILBOXES</h4>
                        <p class="text-[10px] text-slate-600 font-mono mt-1">Company email accounts accessible to team members</p>
                    </div>
                    <button class="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-bold hover:bg-blue-500/30 flex items-center gap-1" onclick="showModal('create-mailbox-modal')"><span class="material-symbols-outlined text-sm">add</span> Create Mailbox</button>
                </div>
                <div class="flex flex-col gap-2">${mailboxCards}</div>
            </div>

            <!-- EMAIL DELEGATION -->
            <div class="settings-card">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h4 class="text-xs font-bold dot-matrix text-slate-400">EMAIL DELEGATION</h4>
                        <p class="text-[10px] text-slate-600 font-mono mt-1">Allow team members to send emails on your behalf</p>
                    </div>
                    <button class="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 flex items-center gap-1" onclick="showModal('delegation-modal')"><span class="material-symbols-outlined text-sm">add</span> Add Delegation</button>
                </div>
                <div class="flex flex-col gap-2">${delegCards}</div>
            </div>
        </div>

        <!-- INVITE MEMBER MODAL -->
        <div id="invite-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content settings-card max-w-md mx-auto mt-24">
                <h4 class="text-sm font-bold text-slate-200 mb-4">Invite Team Member</h4>
                <div class="flex flex-col gap-3">
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">FULL NAME</label><input type="text" id="invite-name" class="compose-input" placeholder="John Doe" /></div>
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">EMAIL</label><input type="email" id="invite-email" class="compose-input" placeholder="john@company.com" /></div>
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">ROLE</label>
                        <select id="invite-role" class="compose-input">
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button class="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80" onclick="inviteTeamMember()">Send Invite</button>
                        <button class="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10" onclick="hideModal('invite-modal')">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- CREATE SHARED MAILBOX MODAL -->
        <div id="create-mailbox-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content settings-card max-w-md mx-auto mt-24">
                <h4 class="text-sm font-bold text-slate-200 mb-4">Create Shared Mailbox</h4>
                <div class="flex flex-col gap-3">
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">MAILBOX NAME</label><input type="text" id="mb-name" class="compose-input" placeholder="e.g. Support, Sales" /></div>
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">EMAIL ADDRESS</label><input type="email" id="mb-email" class="compose-input" placeholder="support@company.com" /></div>
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">DESCRIPTION</label><input type="text" id="mb-desc" class="compose-input" placeholder="Optional description" /></div>
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">LINKED ACCOUNT (optional)</label>
                        <select id="mb-account" class="compose-input"><option value="">— None —</option>${accountOptions}</select>
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button class="px-4 py-2 rounded-lg bg-blue-500/80 text-white text-xs font-bold hover:bg-blue-500" onclick="createSharedMailbox()">Create Mailbox</button>
                        <button class="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10" onclick="hideModal('create-mailbox-modal')">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- DELEGATION MODAL -->
        <div id="delegation-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content settings-card max-w-md mx-auto mt-24">
                <h4 class="text-sm font-bold text-slate-200 mb-4">Add Email Delegation</h4>
                <p class="text-[10px] text-slate-500 font-mono mb-3">Allow a team member to send emails as you</p>
                <div class="flex flex-col gap-3">
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">DELEGATE EMAIL</label><input type="email" id="deleg-email" class="compose-input" placeholder="colleague@company.com" /></div>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" id="deleg-send" checked class="rounded bg-white/10 border-white/20 text-primary focus:ring-primary" /> Can Send As</label>
                        <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer"><input type="checkbox" id="deleg-read" class="rounded bg-white/10 border-white/20 text-primary focus:ring-primary" /> Can Read</label>
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button class="px-4 py-2 rounded-lg bg-emerald-500/80 text-white text-xs font-bold hover:bg-emerald-500" onclick="createDelegation()">Add Delegation</button>
                        <button class="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10" onclick="hideModal('delegation-modal')">Cancel</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- MAILBOX MEMBERS MODAL -->
        <div id="members-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content settings-card max-w-md mx-auto mt-24">
                <h4 class="text-sm font-bold text-slate-200 mb-2" id="members-modal-title">Mailbox Members</h4>
                <div id="members-modal-list" class="flex flex-col gap-2 mb-4"></div>
                <div class="border-t border-white/5 pt-3">
                    <p class="text-[10px] text-slate-500 font-mono mb-2">ADD MEMBER</p>
                    <div class="flex gap-2">
                        <select id="add-member-select" class="compose-input flex-1"><option value="">Select user...</option>${memberOptions}</select>
                        <button class="px-3 py-1.5 rounded-lg bg-blue-500/80 text-white text-xs font-bold hover:bg-blue-500" onclick="addMailboxMember()">Add</button>
                    </div>
                </div>
                <button class="mt-3 text-xs text-slate-500 hover:text-slate-300" onclick="hideModal('members-modal')">Close</button>
            </div>
        </div>
    </div>`;
};

// ========= TEAM HELPER FUNCTIONS =========

async function inviteTeamMember() {
    const name = document.getElementById('invite-name').value;
    const email = document.getElementById('invite-email').value;
    const role = document.getElementById('invite-role').value;
    if (!name || !email) return alert('Name and email are required');
    try {
        const r = await Api.inviteTeamMember({ name, email, role });
        if (r.tempPassword) {
            alert(`✅ Team member invited!\n\nEmail: ${email}\nTemporary Password: ${r.tempPassword}\n\nPlease share this password securely.`);
        } else { alert(r.error || 'Failed'); }
        hideModal('invite-modal');
        Router.handleRoute();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

async function createSharedMailbox() {
    const name = document.getElementById('mb-name').value;
    const email = document.getElementById('mb-email').value;
    const description = document.getElementById('mb-desc').value;
    const accountId = document.getElementById('mb-account').value;
    if (!name || !email) return alert('Name and email are required');
    try {
        const r = await Api.createSharedMailbox({ name, email, description, accountId });
        if (r.id) { alert('✅ Shared mailbox created!'); hideModal('create-mailbox-modal'); Router.handleRoute(); }
        else { alert(r.error || 'Failed'); }
    } catch (e) { alert('❌ Error: ' + e.message); }
}

async function deleteSharedMailbox(id) {
    if (!confirm('Delete this shared mailbox?')) return;
    await Api.deleteSharedMailbox(id);
    Router.handleRoute();
}

async function viewMailboxMembers(mbId, mbName) {
    window._currentMbId = mbId;
    document.getElementById('members-modal-title').textContent = `Members — ${mbName}`;
    const r = await Api.getMailboxMembers(mbId);
    const list = document.getElementById('members-modal-list');
    list.innerHTML = (r.members || []).map(m => `<div class="flex items-center justify-between py-2 px-3 border border-white/5 rounded-lg">
        <div class="flex items-center gap-2">
            <span class="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">${(m.name || '?').charAt(0)}</span>
            <div><p class="text-xs text-slate-200">${m.name}</p><p class="text-[10px] text-slate-500 font-mono">${m.user_email} · ${m.role || 'member'}</p></div>
        </div>
        <div class="flex items-center gap-1">
            ${m.can_send ? '<span class="text-[8px] font-mono px-1 rounded bg-emerald-500/10 text-emerald-400">Send</span>' : ''}
            ${m.can_delete ? '<span class="text-[8px] font-mono px-1 rounded bg-red-500/10 text-red-400">Delete</span>' : ''}
            <button class="toolbar-btn" onclick="removeMailboxMember('${mbId}','${m.user_id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.5)">close</span></button>
        </div>
    </div>`).join('') || '<p class="text-xs text-slate-500 text-center py-2">No members</p>';
    showModal('members-modal');
}

async function addMailboxMember() {
    const userId = document.getElementById('add-member-select').value;
    if (!userId) return alert('Select a user');
    try {
        await Api.addMailboxMember(window._currentMbId, { userId, canSend: true, canDelete: false });
        viewMailboxMembers(window._currentMbId, document.getElementById('members-modal-title').textContent.replace('Members — ', ''));
    } catch (e) { alert(e.message); }
}

async function removeMailboxMember(mbId, userId) {
    if (!confirm('Remove this member?')) return;
    await Api.removeMailboxMember(mbId, userId);
    viewMailboxMembers(mbId, document.getElementById('members-modal-title').textContent.replace('Members — ', ''));
}

async function createDelegation() {
    const email = document.getElementById('deleg-email').value;
    const canSendAs = document.getElementById('deleg-send').checked;
    const canRead = document.getElementById('deleg-read').checked;
    if (!email) return alert('Delegate email required');
    try {
        const r = await Api.createDelegation({ delegateEmail: email, canSendAs, canRead });
        if (r.error) { alert(r.error); return; }
        alert('✅ Delegation created!');
        hideModal('delegation-modal');
        Router.handleRoute();
    } catch (e) { alert('❌ Error: ' + e.message); }
}

async function deleteDelegation(id) {
    if (!confirm('Remove this delegation?')) return;
    await Api.deleteDelegation(id);
    Router.handleRoute();
}

async function toggleMemberRole(memberId, newIsAdmin) {
    const roleName = newIsAdmin ? 'Admin' : 'Member';
    if (!confirm(`Change this member's role to ${roleName}?`)) return;
    showToast('Updating role...', 'loading', 0);
    try {
        const r = await Api.updateTeamMember(memberId, { is_admin: newIsAdmin });
        if (r.error) { showToast('❌ ' + r.error, 'error'); return; }
        showToast(`✅ Role changed to ${roleName}`, 'success');
        Router.handleRoute();
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
}

async function removeTeamMember(memberId, memberName) {
    if (!confirm(`Remove ${memberName} from the team? Their data will be deleted.`)) return;
    showToast('Removing member...', 'loading', 0);
    try {
        const r = await Api.removeTeamMember(memberId);
        if (r.error) { showToast('❌ ' + r.error, 'error'); return; }
        showToast('✅ Member removed', 'success');
        Router.handleRoute();
    } catch (e) { showToast('❌ ' + e.message, 'error'); }
}

// ========= MAILBOX SELECTOR =========
window._selectedMailbox = 'all';

function selectMailbox(accountId) {
    window._selectedMailbox = accountId;
    // Update sidebar mailbox UI
    document.querySelectorAll('#mailbox-list > div').forEach(el => {
        const isSelected = el.dataset.accountId === accountId || (accountId === 'all' && el.dataset.accountId === 'all');
        el.classList.toggle('bg-primary/10', isSelected);
        el.classList.toggle('border-primary/20', isSelected);
        el.classList.toggle('border-white/5', !isSelected);
        el.classList.toggle('bg-transparent', !isSelected);
    });
    // Reload inbox with the filter
    const hash = window.location.hash.slice(1) || '/inbox';
    const page = hash.split('/').filter(Boolean)[0] || 'inbox';
    if (['inbox', 'starred', 'sent', 'drafts', 'spam', 'trash'].includes(page)) {
        Router.handleRoute();
    }
}

async function loadSidebarMailboxes() {
    try {
        const r = await Api.getMailAccounts();
        const accounts = r.accounts || [];
        const list = document.getElementById('mailbox-list');
        if (!list) return;

        const providerIcons = {
            gmail: '📧', outlook: '📬', hostinger: '🟣', godaddy: '🌐', yahoo: '💌', custom: '📨'
        };

        function detectProv(acc) {
            const e = (acc.email || '').toLowerCase();
            const h = (acc.imap_host || '').toLowerCase();
            if (e.includes('gmail') || h.includes('google')) return 'gmail';
            if (h.includes('outlook') || h.includes('office365') || e.includes('outlook') || e.includes('hotmail')) return 'outlook';
            if (h.includes('hostinger')) return 'hostinger';
            if (h.includes('godaddy') || h.includes('secureserver')) return 'godaddy';
            if (e.includes('yahoo') || h.includes('yahoo')) return 'yahoo';
            return 'custom';
        }

        const sel = window._selectedMailbox || 'all';
        list.innerHTML = `<div class="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${sel === 'all' ? 'bg-primary/10 border border-primary/20' : 'border border-white/5 hover:bg-white/5'}" onclick="selectMailbox('all')" data-account-id="all">
            <span class="material-symbols-outlined text-[16px] text-primary">all_inbox</span>
            <span class="text-xs text-slate-200 font-medium">All Accounts</span>
            <span class="ml-auto text-[10px] text-slate-600 font-mono">${accounts.length}</span>
        </div>` + accounts.map(a => {
            const prov = detectProv(a);
            const icon = providerIcons[prov] || '📨';
            const isActive = a.sync_enabled !== 0;
            const selected = sel === a.id;
            return `<div class="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${selected ? 'bg-primary/10 border border-primary/20' : 'border border-white/5 hover:bg-white/5'}" onclick="selectMailbox('${a.id}')" data-account-id="${a.id}">
                <span class="text-sm">${icon}</span>
                <div class="flex-1 min-w-0">
                    <p class="text-[11px] text-slate-300 truncate">${a.email}</p>
                </div>
                <span class="size-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}"></span>
            </div>`;
        }).join('');
    } catch (e) { /* silently fail */ }
}
