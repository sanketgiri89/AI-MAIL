// ===== Eclatrecon AI Mail - Page Renderers (API-Connected) =====
const Pages = {
    // Email list page (inbox, sent, drafts, etc.)
    emailList(folder, emails) {
        const folderLabels = { inbox: 'Inbox', sent: 'Sent', drafts: 'Drafts', spam: 'Spam', trash: 'Trash', starred: 'Starred' };
        const label = folderLabels[folder] || folder.charAt(0).toUpperCase() + folder.slice(1);

        // Group emails by date (Today, Yesterday, This Week, Older)
        let emailRows = '';
        if (emails.length > 0) {
            let currentGroup = '';
            emails.forEach(e => {
                const group = this.getDateGroup(e.received_at);
                if (group !== currentGroup) {
                    currentGroup = group;
                    emailRows += `<div class="date-group-header flex items-center gap-3 px-4 py-2 bg-white/[0.02]">
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">${group}</span>
                        <div class="flex-1 h-px bg-white/5"></div>
                    </div>`;
                }

                const initials = (e.from_name || e.from_address || '?').charAt(0).toUpperCase();
                const date = this.formatDate(e.received_at);
                const isUnread = !e.is_read;
                const isStarred = e.is_starred;
                const unreadDot = isUnread ? '<span class="absolute -left-0.5 top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full bg-primary"></span>' : '';

                emailRows += `<div class="email-row flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] cursor-pointer transition-all hover:bg-white/[0.02] ${isUnread ? 'bg-white/[0.03]' : ''} relative" data-email-id="${e.id}">
                    ${unreadDot}
                    <input type="checkbox" class="email-select-cb accent-primary w-3.5 h-3.5 flex-shrink-0 mt-3 cursor-pointer" data-email-cb="${e.id}" onclick="event.stopPropagation();updateBulkBar()" />
                    <div class="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0 mt-0.5">${initials}</div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2 mb-0.5">
                            <span class="text-[13px] ${isUnread ? 'font-bold text-slate-100' : 'font-medium text-slate-300'} truncate">${e.from_name || e.from_address}</span>
                            <div class="flex items-center gap-1.5 flex-shrink-0">
                                ${e.folder_type === 'sent' ? (e.read_receipt_at ? '<span title="Opened '+new Date(e.read_receipt_at).toLocaleString()+'" style="color:#3b82f6;font-size:11px;font-weight:bold;letter-spacing:-2px">✓✓</span>' : '<span title="Sent" style="color:#64748b;font-size:11px">✓</span>') : ''}
                                ${isStarred ? '<span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings:\'FILL\' 1">star</span>' : ''}
                                <span class="text-[11px] text-slate-500">${date}</span>
                            </div>
                        </div>
                        <p class="text-xs ${isUnread ? 'text-slate-200 font-semibold' : 'text-slate-400'} truncate leading-snug">${e.subject || '(No subject)'}</p>
                        <p class="text-[11px] text-slate-500 truncate mt-0.5 leading-snug">${e.snippet || ''}</p>
                    </div>
                    <div class="email-actions flex gap-1 opacity-0 transition-opacity flex-shrink-0">
                        <button class="toolbar-btn" data-action="archive" title="Archive"><span class="material-symbols-outlined text-sm">archive</span></button>
                        <button class="toolbar-btn" data-action="delete" title="Delete"><span class="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                </div>`;
            });
        } else {
            emailRows = `<div class="flex-1 flex flex-col items-center justify-center py-20 text-slate-500">
                <span class="material-symbols-outlined text-5xl mb-4 text-slate-600">inbox</span>
                <p class="text-sm font-medium">No emails in ${label}</p>
                <p class="text-xs text-slate-600 mt-1">Emails will appear here once synced.</p>
            </div>`;
        }

        return `<div class="flex-1 flex flex-col overflow-hidden">
            <div class="px-4 pt-3 pb-2">
                <div class="flex items-center justify-between mb-2" style="flex-wrap:nowrap;">
                    <h2 class="text-lg font-bold text-slate-100 flex-shrink-0">${label}</h2>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <span id="last-sync-time" class="text-[9px] text-slate-600 font-mono max-w-[100px] truncate"></span>
                        <button class="toolbar-btn" title="Sync now" id="sync-btn" onclick="syncInbox()">
                            <span class="material-symbols-outlined text-sm" id="sync-icon">sync</span>
                        </button>
                        <button class="toolbar-btn" title="Refresh" onclick="Router.handleRoute()"><span class="material-symbols-outlined text-sm">refresh</span></button>
                    </div>
                </div>
                <div class="flex items-center gap-2 border-b border-white/5 pb-2" style="flex-wrap:nowrap;overflow-x:auto;">
                    <label class="flex items-center gap-1 cursor-pointer flex-shrink-0" title="Select all">
                        <input type="checkbox" id="select-all-emails" onchange="toggleSelectAllEmails(this)" class="accent-primary w-3.5 h-3.5" />
                    </label>
                    <button class="email-filter-tab active text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/30" onclick="filterEmails('all')">All</button>
                    <button class="email-filter-tab text-xs font-medium px-3 py-1.5 rounded-full text-slate-400 hover:bg-white/5" onclick="filterEmails('unread')">Unread</button>
                    <button class="email-filter-tab text-xs font-medium px-3 py-1.5 rounded-full text-slate-400 hover:bg-white/5" onclick="filterEmails('starred')">Starred</button>
                    <span class="ml-auto text-[11px] text-slate-500 font-mono flex-shrink-0">${emails.length}</span>
                </div>
                <!-- Bulk action bar -->
                <div id="bulk-action-bar" class="hidden flex items-center gap-2 py-2 px-2 mt-1 bg-primary/10 border border-primary/20 rounded-lg">
                    <span id="bulk-count" class="text-xs font-bold text-primary">0 selected</span>
                    <button onclick="bulkDeleteSelected()" class="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full hover:bg-red-500/30 transition-colors"><span class="material-symbols-outlined text-sm align-middle">delete</span> Delete</button>
                    <button onclick="deselectAllEmails()" class="text-xs text-slate-400 px-3 py-1 rounded-full hover:bg-white/5 transition-colors ml-auto">Cancel</button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto custom-scrollbar">${emailRows}</div>
        </div>`;
    },

    // Email detail view
    emailDetail(email, thread) {
        if (!email) return '<div class="flex-1 flex items-center justify-center text-slate-500"><p>Email not found</p></div>';

        const date = email.received_at ? new Date(email.received_at).toLocaleString() : '';
        const body = email.body_html || email.body_text || '<p class="text-slate-500">No content</p>';

        // Thread view
        let threadHtml = '';
        if (thread && thread.length > 1) {
            threadHtml = `<div class="mb-4"><p class="text-xs text-slate-500 font-mono mb-2">${thread.length} messages in thread</p>
            ${thread.filter(t => t.id !== email.id).map(t => `<div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] mb-1 cursor-pointer hover:bg-white/[0.04]" onclick="Router.navigate('email','${t.id}')">
                <span class="text-xs font-medium text-slate-300 truncate flex-1">${t.from_name || t.from_address}: ${t.subject}</span>
                <span class="text-[10px] text-slate-500 font-mono">${this.formatDate(t.received_at)}</span>
            </div>`).join('')}</div>`;
        }
        // Sanitize email HTML for iframe rendering
        const iframeBody = (email.body_html || '').trim();
        const useIframe = iframeBody.length > 0;
        const plainBody = email.body_text || 'No content';
        
        // Build iframe srcdoc with isolated styles (encode for srcdoc attribute)
        const iframeStyles = 'body{margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.6;color:#e0e0e0;background:#0d0d0d;word-wrap:break-word;overflow-wrap:break-word}img{max-width:100%!important;height:auto!important}table{max-width:100%!important;border-collapse:collapse}td,th{max-width:100%!important;word-wrap:break-word}a{color:#ec5b13}pre,code{max-width:100%;overflow-x:auto;white-space:pre-wrap;word-break:break-all}blockquote{border-left:3px solid rgba(236,91,19,0.5);padding-left:12px;margin:8px 0;color:#94a3b8}*{max-width:100%!important;box-sizing:border-box}';
        const rawHtml = '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>' + iframeStyles + '</style></head><body>' + iframeBody + '</body></html>';
        const encodedSrcdoc = rawHtml.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
        
        // Email body rendering
        const bodyContent = useIframe
            ? '<iframe class="email-iframe" sandbox="allow-same-origin" srcdoc="' + encodedSrcdoc + '" style="width:100%;border:none;min-height:200px;background:#0d0d0d;border-radius:8px" onload="var f=this;setTimeout(function(){try{f.style.height=f.contentDocument.body.scrollHeight+20+\'px\'}catch(e){}},100)"></iframe>'
            : '<div class="email-body text-sm text-slate-300 leading-relaxed" style="white-space:pre-wrap">' + plainBody + '</div>';

        return `<div class="flex-1 flex flex-col overflow-hidden">
            <div class="email-detail-toolbar flex items-center gap-2 px-3 py-2 border-b border-white/5" style="min-height:40px">
                <button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button>
                <div class="flex gap-1 ml-auto">
                    <button class="toolbar-btn" data-action="archive" data-email-id="${email.id}" title="Archive"><span class="material-symbols-outlined text-sm">archive</span></button>
                    <button class="toolbar-btn" data-action="delete" data-email-id="${email.id}" title="Delete"><span class="material-symbols-outlined text-sm">delete</span></button>
                    <button class="toolbar-btn" data-action="star" data-email-id="${email.id}" title="Star"><span class="material-symbols-outlined text-sm">${email.is_starred ? 'star' : 'star_border'}</span></button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                <div class="flex items-center gap-2 mb-3"><h2 class="text-lg sm:text-xl font-bold text-slate-100">${email.subject || '(No subject)'}</h2>
                ${email.folder_type === 'sent' ? (email.read_receipt_at ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-[10px] text-blue-400 font-bold"><span style="letter-spacing:-2px">✓✓</span> Opened '+new Date(email.read_receipt_at).toLocaleString()+'</span>' : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/15 text-[10px] text-slate-400 font-bold">✓ Sent</span>') : ''}</div>
                <div class="flex items-start gap-3 mb-4">
                    <div class="size-9 sm:size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs sm:text-sm font-bold text-primary flex-shrink-0">${(email.from_name || email.from_address || '?').charAt(0).toUpperCase()}</div>
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-bold text-slate-200 truncate">${email.from_name || email.from_address}</p>
                        <p class="text-xs text-slate-500 truncate">${email.from_address} · ${date}</p>
                        <p class="text-xs text-slate-500 mt-0.5 truncate">To: ${email.to_addresses}${email.cc_addresses ? ' · CC: ' + email.cc_addresses : ''}</p>
                    </div>
                </div>
                ${threadHtml}
                ${bodyContent}
                <div class="flex flex-wrap gap-2 mt-6">
                    <button class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-300 hover:bg-white/10" data-action="reply" data-email-id="${email.id}">
                        <span class="material-symbols-outlined text-sm">reply</span> Reply
                    </button>
                    <button class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-300 hover:bg-white/10" data-action="reply-all" data-email-id="${email.id}">
                        <span class="material-symbols-outlined text-sm">reply_all</span> Reply All
                    </button>
                    <button class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-sm text-slate-300 hover:bg-white/10" data-action="forward" data-email-id="${email.id}">
                        <span class="material-symbols-outlined text-sm">forward</span> Forward
                    </button>
                </div>
            </div>
        </div>`;
    },

    // Compose page - Gmail-style full featured
    compose() {
        const user = Api.user();
        const ctx = window._composeContext || {};
        const mode = ctx.mode || 'new';
        const modeLabel = mode === 'reply' ? 'Reply' : mode === 'replyAll' ? 'Reply All' : mode === 'forward' ? 'Forward' : 'New Message';
        const toVal = ctx.to || '';
        const ccVal = ctx.cc || '';
        const subjectVal = ctx.subject || '';
        const bodyVal = ctx.body || '';
        const inReplyTo = ctx.inReplyTo || '';
        window._composeContext = null;

        setTimeout(() => loadComposeFromAccounts(), 50);

        // Init formatting commands after render
        setTimeout(() => {
            // Format buttons
            document.querySelectorAll('[data-format]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const cmd = btn.dataset.format;
                    if (cmd === 'createLink') {
                        const url = prompt('Enter URL:');
                        if (url) document.execCommand(cmd, false, url);
                    } else {
                        document.execCommand(cmd, false, null);
                    }
                    document.getElementById('compose-body-rich')?.focus();
                });
            });
            // Sync rich body to hidden textarea
            const richBody = document.getElementById('compose-body-rich');
            const hiddenBody = document.getElementById('compose-body');
            if (richBody && hiddenBody) {
                if (bodyVal) richBody.innerHTML = bodyVal.replace(/\\n/g, '<br>');
                richBody.addEventListener('input', () => { hiddenBody.value = richBody.innerText; });
            }

            // ===== SCHEDULE SEND =====
            const schedBtn = document.getElementById('schedule-send-btn');
            const schedDrop = document.getElementById('schedule-dropdown');
            if (schedBtn && schedDrop) {
                schedBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    schedDrop.style.display = schedDrop.style.display === 'none' ? 'block' : 'none';
                });
                document.addEventListener('click', () => { if(schedDrop) schedDrop.style.display = 'none'; });
            }
            // Schedule quick buttons
            document.querySelectorAll('[data-schedule]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const to = document.getElementById('compose-to')?.value;
                    const subject = document.getElementById('compose-subject')?.value;
                    if (!to || !subject) { showToast('Fill To and Subject first', 'error'); return; }
                    const rb = document.getElementById('compose-body-rich');
                    const bodyText = rb ? rb.innerText : '';
                    const bodyHtml = rb ? rb.innerHTML : '';
                    const cc = document.getElementById('compose-cc')?.value;
                    const bcc = document.getElementById('compose-bcc')?.value;
                    let sendAt;
                    const val = btn.dataset.schedule;
                    if (val === 'tomorrow-am') {
                        const d = new Date(); d.setDate(d.getDate()+1); d.setHours(8,0,0,0); sendAt = d.toISOString();
                    } else if (val === 'tomorrow-pm') {
                        const d = new Date(); d.setDate(d.getDate()+1); d.setHours(13,0,0,0); sendAt = d.toISOString();
                    } else if (val === 'pick') {
                        const picker = document.getElementById('schedule-datetime');
                        if (picker) { picker.style.display = picker.style.display === 'none' ? 'block' : 'none'; return; }
                    }
                    if (sendAt) {
                        try {
                            await Api.scheduleEmail({ to, cc, bcc, subject, bodyText, bodyHtml, sendAt });
                            showToast('✅ Email scheduled!', 'success');
                            if (schedDrop) schedDrop.style.display = 'none';
                            Router.navigate('inbox');
                        } catch(e) { showToast('❌ Schedule failed: '+e.message,'error'); }
                    }
                });
            });
            // Custom datetime schedule
            const scheduleConfirmBtn = document.getElementById('schedule-confirm-btn');
            if (scheduleConfirmBtn) {
                scheduleConfirmBtn.addEventListener('click', async () => {
                    const dt = document.getElementById('schedule-datetime-input')?.value;
                    if (!dt) { showToast('Pick a date & time', 'error'); return; }
                    const to = document.getElementById('compose-to')?.value;
                    const subject = document.getElementById('compose-subject')?.value;
                    if (!to || !subject) { showToast('Fill To and Subject first', 'error'); return; }
                    const rb = document.getElementById('compose-body-rich');
                    const bodyText = rb ? rb.innerText : '';
                    const bodyHtml = rb ? rb.innerHTML : '';
                    const cc = document.getElementById('compose-cc')?.value;
                    const bcc = document.getElementById('compose-bcc')?.value;
                    const sendAt = new Date(dt).toISOString();
                    try {
                        await Api.scheduleEmail({ to, cc, bcc, subject, bodyText, bodyHtml, sendAt });
                        showToast('✅ Email scheduled for '+new Date(dt).toLocaleString(), 'success');
                        Router.navigate('inbox');
                    } catch(e) { showToast('❌ '+e.message,'error'); }
                });
            }

            // ===== FILE PICKER =====
            const fileInput = document.getElementById('compose-attachment');
            if (fileInput) {
                fileInput.addEventListener('change', () => {
                    const fileList = document.getElementById('attachment-list');
                    if (!fileList) return;
                    fileList.innerHTML = '';
                    Array.from(fileInput.files).forEach(f => {
                        const size = f.size < 1024 ? f.size + ' B' : f.size < 1048576 ? (f.size/1024).toFixed(1) + ' KB' : (f.size/1048576).toFixed(1) + ' MB';
                        fileList.innerHTML += '<div class="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-xs text-slate-300 border border-white/10"><span class="material-symbols-outlined text-sm text-primary">attach_file</span><span class="truncate max-w-[200px]">' + f.name + '</span><span class="text-slate-500">' + size + '</span></div>';
                    });
                });
            }

            // ===== SIGNATURE =====
            const sigBtn = document.getElementById('insert-signature-btn');
            if (sigBtn) {
                sigBtn.addEventListener('click', async () => {
                    try {
                        const data = await Api.getSignatures();
                        const sigs = data.signatures || [];
                        const defaultSig = sigs.find(s => s.is_default) || sigs[0];
                        if (!defaultSig) { showToast('No signature found. Create one in Settings → Signatures', 'error'); return; }
                        const rb = document.getElementById('compose-body-rich');
                        if (rb) {
                            rb.innerHTML += '<br><br><div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:8px;color:#94a3b8;font-size:0.85em">' + defaultSig.body_html + '</div>';
                            showToast('✅ Signature inserted', 'success');
                        }
                    } catch(e) { showToast('❌ Could not load signature', 'error'); }
                });
            }

            // ===== AI EMAIL WRITER =====
            const aiBtn = document.getElementById('ai-writer-btn');
            const aiModal = document.getElementById('ai-writer-modal');
            const aiClose = document.getElementById('ai-writer-close');
            const aiGenerate = document.getElementById('ai-writer-generate');
            if (aiBtn && aiModal) {
                aiBtn.addEventListener('click', () => { aiModal.style.display = 'flex'; setTimeout(() => document.getElementById('ai-writer-prompt')?.focus(), 100); });
                aiClose?.addEventListener('click', () => { aiModal.style.display = 'none'; });
                aiModal.addEventListener('click', (e) => { if (e.target === aiModal) aiModal.style.display = 'none'; });
            }
            if (aiGenerate) {
                aiGenerate.addEventListener('click', async () => {
                    const promptInput = document.getElementById('ai-writer-prompt');
                    const prompt = promptInput?.value?.trim();
                    if (!prompt) { showToast('Describe the email you want to write', 'error'); return; }
                    const resultDiv = document.getElementById('ai-writer-result');
                    aiGenerate.textContent = '✨ Writing...';
                    aiGenerate.disabled = true;
                    if (resultDiv) resultDiv.innerHTML = '<p class="text-xs text-slate-500 animate-pulse">AI is composing your email...</p>';
                    try {
                        const data = await Api.aiCompose(prompt);
                        const content = data.result || data.text || data.email || data.content || '';
                        if (resultDiv) resultDiv.innerHTML = '<div class="text-xs text-slate-300 leading-relaxed max-h-40 overflow-y-auto p-2 bg-white/5 rounded-lg border border-white/10">' + content.replace(/\n/g,'<br>') + '</div>';
                        // Insert into compose body button
                        const useBtn = document.getElementById('ai-writer-use');
                        if (useBtn) {
                            useBtn.style.display = 'block';
                            useBtn.onclick = () => {
                                const rb = document.getElementById('compose-body-rich');
                                if (rb) rb.innerHTML = content.replace(/\n/g,'<br>');
                                aiModal.style.display = 'none';
                                showToast('✅ AI email inserted', 'success');
                            };
                        }
                    } catch(e) {
                        if (resultDiv) resultDiv.innerHTML = '<p class="text-xs text-red-400">❌ ' + (e.message || 'AI generation failed. Make sure you have an OpenRouter API key set in AI Tools.') + '</p>';
                    }
                    aiGenerate.textContent = '✨ Generate Email';
                    aiGenerate.disabled = false;
                });
            }
        }, 80);

        return `<div class="flex-1 flex flex-col overflow-hidden">
            <!-- Gmail-style top bar -->
            <div class="flex items-center justify-between px-3 py-2 border-b border-white/5" style="min-height:44px">
                <div class="flex items-center gap-2">
                    <button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-lg">close</span></button>
                    <span class="text-sm font-medium text-slate-200">${modeLabel}</span>
                </div>
                <div class="flex items-center gap-1">
                    <button class="toolbar-btn" title="Attach" onclick="document.getElementById('compose-attachment')?.click()"><span class="material-symbols-outlined text-lg">attach_file</span></button>
                    <div class="relative">
                        <button class="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/80 transition-all flex items-center gap-1" data-action="send">
                            <span class="material-symbols-outlined text-sm">send</span>
                            <span class="hidden sm:inline">Send</span>
                        </button>
                    </div>
                    <div class="relative">
                        <button id="schedule-send-btn" class="toolbar-btn" title="Schedule send"><span class="material-symbols-outlined text-lg">arrow_drop_down</span></button>
                        <div id="schedule-dropdown" class="absolute right-0 top-full mt-1 w-64 bg-neutral-dark border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden" style="display:none">
                            <div class="p-2 text-xs text-slate-500 font-medium px-3 border-b border-white/5">Schedule Send</div>
                            <button data-schedule="tomorrow-am" class="w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5 flex items-center gap-3">
                                <span class="material-symbols-outlined text-lg text-primary">wb_sunny</span> Tomorrow morning (8:00 AM)
                            </button>
                            <button data-schedule="tomorrow-pm" class="w-full text-left px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5 flex items-center gap-3">
                                <span class="material-symbols-outlined text-lg text-primary">wb_twilight</span> Tomorrow afternoon (1:00 PM)
                            </button>
                            <div class="border-t border-white/5 p-3">
                                <button data-schedule="pick" class="w-full text-left text-sm text-slate-200 hover:text-primary flex items-center gap-3 mb-2">
                                    <span class="material-symbols-outlined text-lg text-primary">schedule</span> Pick date & time
                                </button>
                                <div id="schedule-datetime" style="display:none" class="flex flex-col gap-2">
                                    <input type="datetime-local" id="schedule-datetime-input" class="compose-input !text-xs !py-1.5 !px-2 !bg-white/5 !rounded-lg" />
                                    <button id="schedule-confirm-btn" class="auth-btn text-xs py-1.5 w-full">✅ Schedule</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <input type="hidden" id="compose-in-reply-to" value="${inReplyTo}" />
            <input type="file" id="compose-attachment" class="hidden" multiple />
            
            <!-- Compose fields -->
            <div class="flex-1 overflow-y-auto custom-scrollbar compose-page-wrapper p-4">
                <div class="flex flex-col">
                    <!-- From -->
                    <div class="flex items-center gap-2 px-1 py-2.5 border-b border-white/5">
                        <span class="text-xs text-slate-500 w-14 flex-shrink-0">From</span>
                        <select id="compose-from" class="compose-input flex-1 cursor-pointer !py-0 !border-none !bg-transparent !text-sm" style="appearance:auto;">
                            <option value="">${user.email || 'Loading...'}</option>
                        </select>
                    </div>
                    <!-- To -->
                    <div class="flex items-center gap-2 px-1 py-2.5 border-b border-white/5">
                        <span class="text-xs text-slate-500 w-14 flex-shrink-0">To</span>
                        <input type="text" id="compose-to" class="compose-input flex-1 !py-0 !border-none !bg-transparent !text-sm" placeholder="Recipients" value="${toVal.replace(/"/g, '&quot;')}" />
                        <button class="text-xs text-slate-500 hover:text-primary px-1 flex-shrink-0" onclick="document.getElementById('cc-bcc-row').style.display=document.getElementById('cc-bcc-row').style.display==='none'?'':'none'">Cc/Bcc</button>
                    </div>
                    <!-- CC/BCC -->
                    <div id="cc-bcc-row" style="${ccVal ? '' : 'display:none'}">
                        <div class="flex items-center gap-2 px-1 py-2.5 border-b border-white/5">
                            <span class="text-xs text-slate-500 w-14 flex-shrink-0">Cc</span>
                            <input type="text" id="compose-cc" class="compose-input flex-1 !py-0 !border-none !bg-transparent !text-sm" placeholder="Cc recipients" value="${ccVal.replace(/"/g, '&quot;')}" />
                        </div>
                        <div class="flex items-center gap-2 px-1 py-2.5 border-b border-white/5">
                            <span class="text-xs text-slate-500 w-14 flex-shrink-0">Bcc</span>
                            <input type="text" id="compose-bcc" class="compose-input flex-1 !py-0 !border-none !bg-transparent !text-sm" placeholder="Bcc recipients" />
                        </div>
                    </div>
                    <!-- Subject -->
                    <div class="flex items-center gap-2 px-1 py-2.5 border-b border-white/5">
                        <span class="text-xs text-slate-500 w-14 flex-shrink-0">Subject</span>
                        <input type="text" id="compose-subject" class="compose-input flex-1 !py-0 !border-none !bg-transparent !text-sm" placeholder="Subject" value="${subjectVal.replace(/"/g, '&quot;')}" />
                    </div>
                    
                    <!-- Rich text body -->
                    <div id="compose-body-rich" contenteditable="true" class="compose-body-rich outline-none mt-2 text-sm text-slate-200 leading-relaxed min-h-[calc(100vh-400px)] cursor-text" style="white-space:pre-wrap;word-wrap:break-word" data-placeholder="Compose email..."></div>
                    <textarea id="compose-body" class="hidden">${bodyVal}</textarea>
                    
                    <!-- Attachment list -->
                    <div id="attachment-list" class="flex flex-wrap gap-2 mt-3"></div>
                </div>
            </div>
            
            <!-- Bottom formatting toolbar -->
            <div class="border-t border-white/5 bg-background-dark/90 backdrop-blur-sm">
                <!-- Formatting row -->
                <div class="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto" style="-webkit-overflow-scrolling:touch">
                    <button data-format="bold" class="toolbar-btn" title="Bold"><span class="material-symbols-outlined text-[18px]">format_bold</span></button>
                    <button data-format="italic" class="toolbar-btn" title="Italic"><span class="material-symbols-outlined text-[18px]">format_italic</span></button>
                    <button data-format="underline" class="toolbar-btn" title="Underline"><span class="material-symbols-outlined text-[18px]">format_underlined</span></button>
                    <div class="w-px h-4 bg-white/10 mx-1"></div>
                    <button data-format="insertUnorderedList" class="toolbar-btn" title="Bullet list"><span class="material-symbols-outlined text-[18px]">format_list_bulleted</span></button>
                    <button data-format="insertOrderedList" class="toolbar-btn" title="Numbered list"><span class="material-symbols-outlined text-[18px]">format_list_numbered</span></button>
                    <button data-format="indent" class="toolbar-btn" title="Indent"><span class="material-symbols-outlined text-[18px]">format_indent_increase</span></button>
                    <button data-format="outdent" class="toolbar-btn" title="Outdent"><span class="material-symbols-outlined text-[18px]">format_indent_decrease</span></button>
                    <div class="w-px h-4 bg-white/10 mx-1"></div>
                    <button data-format="createLink" class="toolbar-btn" title="Insert link"><span class="material-symbols-outlined text-[18px]">link</span></button>
                    <button data-format="removeFormat" class="toolbar-btn" title="Remove formatting"><span class="material-symbols-outlined text-[18px]">format_clear</span></button>
                    <button class="toolbar-btn" title="Insert emoji" onclick="document.getElementById('compose-body-rich')?.focus();document.execCommand('insertText',false,'😊')"><span class="material-symbols-outlined text-[18px]">mood</span></button>
                </div>
                <!-- Action row -->
                <div class="flex items-center gap-1 px-2 py-1.5 border-t border-white/5">
                    <button class="toolbar-btn" title="Attach file" onclick="document.getElementById('compose-attachment')?.click()"><span class="material-symbols-outlined text-lg">attach_file</span></button>
                    <button id="ai-writer-btn" class="toolbar-btn" title="AI Email Writer"><span class="material-symbols-outlined text-lg text-primary">auto_awesome</span></button>
                    <button id="insert-signature-btn" class="toolbar-btn" title="Insert signature"><span class="material-symbols-outlined text-lg">draw</span></button>
                    <label class="flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer hover:bg-white/5 transition-colors" title="Track when recipient opens email">
                        <input type="checkbox" id="track-read-receipt" checked class="accent-primary w-3.5 h-3.5" />
                        <span class="text-[10px] text-slate-400 hidden sm:inline">Read Receipt</span>
                        <span class="material-symbols-outlined text-sm text-slate-400 sm:hidden">visibility</span>
                    </label>
                    <div class="flex-1"></div>
                    <button class="toolbar-btn text-slate-500 hover:text-accent-red" title="Discard draft" data-action="back"><span class="material-symbols-outlined text-lg">delete</span></button>
                    <button class="px-3 py-1 rounded bg-white/5 text-xs text-slate-400 hover:bg-white/10 transition-colors" onclick="saveDraft()">Save Draft</button>
                </div>
            </div>

            <!-- AI Writer Modal -->
            <div id="ai-writer-modal" style="display:none" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div class="w-full max-w-md bg-neutral-dark rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                    <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary">auto_awesome</span>
                            <span class="text-sm font-bold text-slate-200">AI Email Writer</span>
                        </div>
                        <button id="ai-writer-close" class="toolbar-btn"><span class="material-symbols-outlined text-lg">close</span></button>
                    </div>
                    <div class="p-4 flex flex-col gap-3">
                        <p class="text-xs text-slate-400">Describe the email you want to write. AI will compose it for you.</p>
                        <textarea id="ai-writer-prompt" class="compose-input !text-sm !min-h-[80px] !rounded-xl" placeholder="e.g. Write a professional follow-up email to a client about project deadline..."></textarea>
                        <button id="ai-writer-generate" class="auth-btn text-sm py-2 flex items-center justify-center gap-2">✨ Generate Email</button>
                        <div id="ai-writer-result"></div>
                        <button id="ai-writer-use" style="display:none" class="w-full py-2 rounded-lg bg-primary/15 text-primary text-sm font-bold border border-primary/30 hover:bg-primary/25 transition-all">📝 Use This Email</button>
                    </div>
                </div>
            </div>
        </div>`;
    },

    // AI Sidebar
    aiSidebar() {
        return `<div class="flex flex-col gap-4 p-4">
            <h3 class="text-xs font-bold dot-matrix text-slate-300 flex items-center gap-2"><span class="material-symbols-outlined text-primary text-sm">auto_awesome</span>AI INSIGHTS</h3>
            <div class="settings-card ai-insight-card"><p class="text-xs text-primary font-mono mb-2">TIPS</p><p class="text-xs text-slate-400">Select an email to see AI-powered insights and suggestions.</p></div>
            <h4 class="text-xs font-bold dot-matrix text-slate-400 mt-2">SMART ACTIONS</h4>
            <button class="smart-action-btn text-xs flex items-center gap-2"><span class="material-symbols-outlined text-sm text-primary">draft</span>Draft Reply</button>
            <button class="smart-action-btn text-xs flex items-center gap-2"><span class="material-symbols-outlined text-sm text-primary">calendar_month</span>Schedule Meeting</button>
            <button class="smart-action-btn text-xs flex items-center gap-2"><span class="material-symbols-outlined text-sm text-primary">checklist</span>Extract Action Items</button>
        </div>`;
    },

    // Format date for email row (smart: time for today, Yesterday, weekday, or date)
    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const now = new Date();

        // Calendar-based day comparison using midnight boundaries
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const emailDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        if (emailDay.getTime() === today.getTime()) {
            return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        if (emailDay.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        }
        // Within last 7 days — show weekday
        const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
        if (emailDay >= weekAgo) {
            return d.toLocaleDateString([], { weekday: 'short' });
        }
        // Older — show date
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    },

    // Get date group label for section headers
    getDateGroup(dateStr) {
        if (!dateStr) return 'Older';
        const d = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const emailDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

        if (emailDay.getTime() === today.getTime()) return 'Today';
        if (emailDay.getTime() === yesterday.getTime()) return 'Yesterday';
        const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 6);
        if (emailDay >= weekAgo) return 'This Week';
        return d.toLocaleDateString([], { month: 'long', year: 'numeric' });
    }
};
