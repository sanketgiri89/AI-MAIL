// ===== Eclatrecon AI Mail - Settings, Account, Contacts (API-Connected) =====

// Settings page (extends Pages object)
Pages.settings = function () {
    return `<div class="flex-1 flex flex-col overflow-hidden">
        <div class="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button>
            <span class="text-sm font-bold dot-matrix text-slate-200">SETTINGS</span>
        </div>
        <div class="flex-1 flex overflow-hidden">
            <div class="w-48 border-r border-white/5 p-3 flex flex-col gap-1 flex-shrink-0">
                <button class="tab-btn active text-xs text-left px-3 py-2 rounded-lg" data-tab="tab-general">General</button>
                <button class="tab-btn text-xs text-left px-3 py-2 rounded-lg" data-tab="tab-notifications">Notifications</button>
                <button class="tab-btn text-xs text-left px-3 py-2 rounded-lg" data-tab="tab-appearance">Appearance</button>
                <button class="tab-btn text-xs text-left px-3 py-2 rounded-lg" data-tab="tab-privacy">Privacy & Security</button>
                <button class="tab-btn text-xs text-left px-3 py-2 rounded-lg" data-tab="tab-mail">Mail Settings</button>
            </div>
            <div class="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div id="tab-general" class="tab-panel flex flex-col gap-4 max-w-2xl">
                    <h3 class="text-sm font-bold dot-matrix text-slate-300 mb-2">GENERAL</h3>
                    ${this._settingsRow('Language', 'Select display language', '<select class="form-select-custom"><option>English</option><option>Hindi</option><option>Spanish</option></select>')}
                    ${this._settingsRow('Timezone', 'Auto-detect timezone', '<select class="form-select-custom"><option>Asia/Kolkata (IST)</option><option>America/New_York (EST)</option><option>Europe/London (GMT)</option></select>')}
                    ${this._settingsRow('Undo Send', 'Delay before sending', '<select class="form-select-custom"><option>5 seconds</option><option>10 seconds</option><option>30 seconds</option></select>')}
                    ${this._settingsRow('Conversation View', 'Group emails by thread', '<div class="toggle-switch active"></div>')}
                </div>
                <div id="tab-notifications" class="tab-panel flex flex-col gap-4 max-w-2xl" style="display:none;">
                    <h3 class="text-sm font-bold dot-matrix text-slate-300 mb-2">NOTIFICATIONS</h3>
                    ${this._settingsRow('Desktop Notifications', 'Browser push notifications for new emails', '<div class="toggle-switch active"></div>')}
                    ${this._settingsRow('Sound', 'Play sound on new email', '<div class="toggle-switch"></div>')}
                    ${this._settingsRow('Email Digest', 'Daily summary email', '<select class="form-select-custom"><option>Off</option><option>Daily</option><option>Weekly</option></select>')}
                </div>
                <div id="tab-appearance" class="tab-panel flex flex-col gap-4 max-w-2xl" style="display:none;">
                    <h3 class="text-sm font-bold dot-matrix text-slate-300 mb-2">APPEARANCE</h3>
                    ${this._settingsRow('Theme', 'Choose your look', '<select class="form-select-custom"><option>Dark</option><option>Light</option><option>System</option></select>')}
                    ${this._settingsRow('Density', 'Email list spacing', '<select class="form-select-custom"><option>Default</option><option>Comfortable</option><option>Compact</option></select>')}
                    ${this._settingsRow('Reading Pane', 'Position of the reading pane', '<select class="form-select-custom"><option>Right</option><option>Bottom</option><option>Off</option></select>')}
                </div>
                <div id="tab-privacy" class="tab-panel flex flex-col gap-4 max-w-2xl" style="display:none;">
                    <h3 class="text-sm font-bold dot-matrix text-slate-300 mb-2">PRIVACY & SECURITY</h3>
                    ${this._settingsRow('Block external images', 'Prevents tracking pixels', '<div class="toggle-switch active"></div>')}
                    ${this._settingsRow('Read receipts', 'Send read receipts when you open emails', '<div class="toggle-switch"></div>')}
                    ${this._settingsRow('Phishing Protection', 'AI-powered phishing detection', '<div class="toggle-switch active"></div>')}
                    ${this._settingsRow('2FA Authentication', 'Two-factor authentication', '<button class="text-xs px-3 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors" onclick="setup2FA()">Setup 2FA</button>')}
                </div>
                <div id="tab-mail" class="tab-panel flex flex-col gap-4 max-w-2xl" style="display:none;">
                    <h3 class="text-sm font-bold dot-matrix text-slate-300 mb-2">MAIL SETTINGS</h3>
                    <div class="settings-card">
                        <h4 class="text-xs font-bold text-slate-300 mb-3">Connected Mail Accounts</h4>
                        <div id="mail-accounts-list" class="flex flex-col gap-2"></div>
                        <button class="mt-3 text-xs px-3 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1" onclick="showAddAccountForm()">
                            <span class="material-symbols-outlined text-sm">add</span> Add Account
                        </button>
                    </div>
                    <div id="add-account-form" class="settings-card" style="display:none;">
                        <h4 class="text-xs font-bold text-slate-300 mb-3">Add Mail Account</h4>
                        <div class="flex flex-col gap-3">
                            <input type="text" id="acc-label" class="compose-input" placeholder="Account label (e.g. Work)" />
                            <input type="email" id="acc-email" class="compose-input" placeholder="Email address" />
                            <div class="flex gap-3"><input type="text" id="acc-imap-host" class="compose-input flex-1" placeholder="IMAP Host" /><input type="number" id="acc-imap-port" class="compose-input w-24" placeholder="Port" value="993" /></div>
                            <div class="flex gap-3"><input type="text" id="acc-smtp-host" class="compose-input flex-1" placeholder="SMTP Host" /><input type="number" id="acc-smtp-port" class="compose-input w-24" placeholder="Port" value="465" /></div>
                            <input type="text" id="acc-username" class="compose-input" placeholder="Username / Email" />
                            <input type="password" id="acc-password" class="compose-input" placeholder="Password / App Password" />
                            <div class="flex gap-2">
                                <button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold hover:bg-primary/80" onclick="addAccount()">Connect Account</button>
                                <button class="px-4 py-1.5 rounded bg-white/5 text-slate-400 text-xs hover:bg-white/10" onclick="document.getElementById('add-account-form').style.display='none'">Cancel</button>
                            </div>
                        </div>
                    </div>
                    ${this._settingsRow('Signature', 'Default email signature', '<textarea class="compose-input resize-none h-16 w-48 text-xs" placeholder="Your email signature"></textarea>')}
                    ${this._settingsRow('Auto-Reply', 'Vacation responder', '<button class="text-xs px-3 py-1 rounded bg-white/5 text-slate-300 hover:bg-white/10 transition-colors" onclick="Router.navigate(\'settings\')">Configure</button>')}
                </div>
            </div>
        </div>
    </div>`;
};

Pages._settingsRow = function (title, desc, control) {
    return `<div class="settings-card flex items-center justify-between">
        <div><p class="text-sm text-slate-200">${title}</p><p class="text-xs text-slate-500">${desc}</p></div>
        <div class="flex-shrink-0">${control}</div>
    </div>`;
};

// Account page
Pages.account = function (user, accounts) {
    if (!user) return '<div class="flex-1 flex items-center justify-center text-slate-500">Loading...</div>';
    const initial = (user.name || 'U').charAt(0).toUpperCase();
    const storageUsed = formatBytes(user.storage_used || 0);
    const storageLimit = formatBytes(user.storage_limit || 15737418240);
    const storagePercent = user.storage_limit ? Math.round((user.storage_used || 0) / user.storage_limit * 100) : 0;

    // Deduplicate accounts by email
    const uniqueAccounts = Object.values((accounts || []).reduce((map, a) => {
        if (!map[a.email] || (a.last_sync && (!map[a.email].last_sync || a.last_sync > map[a.email].last_sync))) map[a.email] = a;
        return map;
    }, {}));

    // Detect provider from email/host
    function getProvider(acc) {
        const e = (acc.email || '').toLowerCase();
        const h = (acc.imap_host || '').toLowerCase();
        if (e.includes('gmail') || h.includes('google')) return 'gmail';
        if (h.includes('hostinger')) return 'hostinger';
        if (h.includes('outlook') || h.includes('office365') || e.includes('outlook') || e.includes('hotmail') || e.includes('live.com')) return 'outlook';
        if (h.includes('godaddy') || h.includes('secureserver')) return 'godaddy';
        if (e.includes('yahoo') || h.includes('yahoo')) return 'yahoo';
        return 'custom';
    }

    const providerLogos = {
        gmail: '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>',
        outlook: '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 0 1-.588.236h-8.178V10.1l2.467 1.542a.345.345 0 0 0 .382 0l6.155-3.85V7.387zm0-1.39L15.847 9.84 24 4.387c0-.34-.22-.59-.66-.59H14.996V6h.003z"/><path fill="#0078D4" d="M0 3.449v17.103c0 .46.354.832.79.832h8.91V3.449H.79a.81.81 0 0 0-.79.832z"/><ellipse cx="5.4" cy="12" rx="2.7" ry="3.3" fill="#fff"/></svg>',
        hostinger: '<svg width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#6730E3"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="14" font-weight="bold">H</text></svg>',
        godaddy: '<svg width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#1BDBDB"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="12" font-weight="bold">GD</text></svg>',
        yahoo: '<svg width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#6001D2"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Y!</text></svg>',
        custom: '<svg width="20" height="20" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#475569"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="11" font-weight="bold">⚙</text></svg>'
    };

    const providerNames = { gmail: 'Gmail', outlook: 'Outlook', hostinger: 'Hostinger', godaddy: 'GoDaddy', yahoo: 'Yahoo', custom: 'Custom' };
    const providerColors = { gmail: 'border-red-500/30 bg-red-500/5', outlook: 'border-blue-500/30 bg-blue-500/5', hostinger: 'border-purple-500/30 bg-purple-500/5', godaddy: 'border-teal-500/30 bg-teal-500/5', yahoo: 'border-violet-500/30 bg-violet-500/5', custom: 'border-slate-500/30 bg-slate-500/5' };

    // Account cards with provider logos and status
    const accountCards = uniqueAccounts.map(a => {
        const prov = getProvider(a);
        const logo = providerLogos[prov] || providerLogos.custom;
        const provName = providerNames[prov] || 'Custom';
        const isActive = a.sync_enabled !== 0;
        const statusColor = isActive ? (a.last_sync ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-red-400';
        const statusText = isActive ? (a.last_sync ? 'Active · Syncing' : 'Active · Waiting') : 'Disabled';
        const syncAgo = a.last_sync ? getTimeAgo(new Date(a.last_sync + (a.last_sync.includes('Z') ? '' : 'Z'))) : 'Never';
        return `<div class="flex items-center justify-between py-3 px-4 border border-white/5 rounded-xl mb-2 group hover:border-white/10 transition-all ${providerColors[prov]}">
            <div class="flex items-center gap-3">
                <div class="relative">${logo}<span class="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ${statusColor} ring-2 ring-[#0d0d0d]"></span></div>
                <div>
                    <p class="text-sm text-slate-200 font-medium">${a.email}</p>
                    <p class="text-[10px] text-slate-500 font-mono">${provName} · ${a.label || 'Default'} · ${statusText}</p>
                    <p class="text-[10px] text-slate-600 font-mono">Last sync: ${syncAgo}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <label class="relative inline-flex items-center cursor-pointer" title="${isActive ? 'Disable sync' : 'Enable sync'}">
                    <input type="checkbox" class="sr-only peer" ${isActive ? 'checked' : ''} onchange="toggleAccountSync('${a.id}')"/>
                    <div class="w-9 h-5 rounded-full bg-white/10 peer-checked:bg-emerald-500/30 peer-focus:ring-2 peer-focus:ring-primary/20 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-slate-400 after:peer-checked:bg-emerald-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                </label>
                ${a.is_primary ? '<span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary">PRIMARY</span>' : `<button class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-500 hover:bg-white/10" onclick="setPrimaryAccount('${a.id}')">Set Primary</button>`}
                <button class="toolbar-btn opacity-0 group-hover:opacity-100" title="Edit" onclick="editAccount('${a.id}')"><span class="material-symbols-outlined text-sm text-blue-400">edit</span></button>
                <button class="toolbar-btn opacity-0 group-hover:opacity-100" title="Unlink" onclick="unlinkAccount('${a.id}','${a.email}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">link_off</span></button>
            </div>
        </div>`;
    }).join('') || '<p class="text-xs text-slate-500 py-4 text-center">No connected accounts. Add one below!</p>';

    // Provider buttons for add account form
    const providerButtons = ['gmail', 'outlook', 'hostinger', 'godaddy', 'yahoo', 'custom'].map(p => 
        `<button class="provider-btn flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-primary/30 transition-all cursor-pointer text-center" onclick="selectProvider('${p}')" data-provider="${p}">
            ${providerLogos[p]}
            <span class="text-[10px] text-slate-400 font-mono">${providerNames[p]}</span>
        </button>`
    ).join('');

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div class="max-w-2xl mx-auto flex flex-col gap-6">
            <div class="flex items-center gap-3 mb-2"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">MY ACCOUNT</span></div>

            <div class="settings-card flex items-center gap-4">
                <div class="size-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-2xl font-bold text-white">${initial}</div>
                <div class="flex-1"><h3 class="text-lg font-bold text-slate-100">${user.name}</h3><p class="text-sm text-slate-400">${user.email}</p><p class="text-xs text-slate-500 font-mono">Joined ${new Date(user.created_at).toLocaleDateString()}</p></div>
                <button class="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 text-xs hover:bg-white/10 flex items-center gap-1" onclick="editProfile()"><span class="material-symbols-outlined text-sm">edit</span> Edit Profile</button>
            </div>

            <!-- PROFILE INFO (view mode) -->
            <div class="settings-card" id="profile-view">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="text-xs font-bold dot-matrix text-slate-400">PERSONAL INFO</h4>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div><p class="text-[10px] text-slate-500 font-mono">NAME</p><p class="text-sm text-slate-200">${user.name}</p></div>
                    <div><p class="text-[10px] text-slate-500 font-mono">DISPLAY NAME</p><p class="text-sm text-slate-200">${user.display_name || '-'}</p></div>
                    <div><p class="text-[10px] text-slate-500 font-mono">PHONE</p><p class="text-sm text-slate-200">${user.phone || '-'}</p></div>
                    <div><p class="text-[10px] text-slate-500 font-mono">LOCATION</p><p class="text-sm text-slate-200">${user.location || '-'}</p></div>
                </div>
            </div>

            <!-- PROFILE EDIT (hidden by default) -->
            <div class="settings-card" id="profile-edit" style="display:none;">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="text-xs font-bold dot-matrix text-slate-400">EDIT PROFILE</h4>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">NAME</label><input type="text" id="edit-name" class="compose-input" value="${(user.name || '').replace(/"/g,'&quot;')}" /></div>
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">DISPLAY NAME</label><input type="text" id="edit-display-name" class="compose-input" value="${(user.display_name || '').replace(/"/g,'&quot;')}" /></div>
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">PHONE</label><input type="text" id="edit-phone" class="compose-input" value="${(user.phone || '').replace(/"/g,'&quot;')}" /></div>
                    <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">LOCATION</label><input type="text" id="edit-location" class="compose-input" value="${(user.location || '').replace(/"/g,'&quot;')}" /></div>
                </div>
                <div class="flex gap-2 mt-4">
                    <button class="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80" onclick="saveProfile()">Save Changes</button>
                    <button class="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10" onclick="editProfile(false)">Cancel</button>
                </div>
            </div>

            <div class="settings-card">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-xs font-bold dot-matrix text-slate-400">CONNECTED ACCOUNTS</h4>
                    <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showAddAccountForm()"><span class="material-symbols-outlined text-sm">add</span> Add Account</button>
                </div>
                ${accountCards}
            </div>

            <!-- ADD ACCOUNT FORM -->
            <div class="settings-card" id="add-account-form" style="display:none;">
                <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-4">ADD MAIL ACCOUNT</h4>
                
                <p class="text-[10px] text-slate-500 font-mono mb-2">SELECT PROVIDER</p>
                <div class="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">${providerButtons}</div>

                <div class="flex flex-col gap-3">
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">LABEL</label><input type="text" id="acc-label" class="compose-input" placeholder="e.g. Work, Personal" value="Primary" /></div>
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">DISPLAY NAME (From name)</label><input type="text" id="acc-display-name" class="compose-input" placeholder="e.g. John Smith" /></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">EMAIL</label><input type="email" id="acc-email" class="compose-input" placeholder="you@provider.com" /></div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">USERNAME</label><input type="text" id="acc-username" class="compose-input" placeholder="Usually your email" /></div>
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">PASSWORD / APP PASSWORD</label><input type="password" id="acc-password" class="compose-input" placeholder="Password or App Password" /></div>
                    </div>

                    <!-- Custom fields (hidden for preset providers) -->
                    <div id="acc-custom-fields" style="display:none;" class="flex flex-col gap-3 pt-2 border-t border-white/5">
                        <p class="text-[10px] text-amber-400/70 font-mono">⚠ CUSTOM — Enter your mail server details manually</p>
                        <div>
                            <label class="text-[10px] text-slate-500 font-mono mb-1 block">INCOMING PROTOCOL</label>
                            <select id="acc-protocol" class="compose-input" onchange="if(window._selectedProvider) selectProvider(window._selectedProvider)">
                                <option value="imap">IMAP (recommended)</option>
                                <option value="pop3">POP3</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">IMAP HOST</label><input type="text" id="acc-imap-host" class="compose-input" placeholder="imap.provider.com" /></div>
                            <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">IMAP PORT</label><input type="number" id="acc-imap-port" class="compose-input" placeholder="993" value="993" /></div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">POP3 HOST</label><input type="text" id="acc-pop3-host" class="compose-input" placeholder="pop.provider.com" /></div>
                            <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">POP3 PORT</label><input type="number" id="acc-pop3-port" class="compose-input" placeholder="995" value="995" /></div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">SMTP HOST</label><input type="text" id="acc-smtp-host" class="compose-input" placeholder="smtp.provider.com" /></div>
                            <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">SMTP PORT</label><input type="number" id="acc-smtp-port" class="compose-input" placeholder="465" value="465" /></div>
                        </div>
                    </div>

                    <!-- Provider info (shown for presets) -->
                    <div id="acc-provider-info" style="display:none;" class="flex flex-col gap-2">
                        <div class="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                            <p class="text-[10px] text-emerald-400/70 font-mono mb-1">✓ <span id="acc-provider-name">Provider</span> settings auto-configured</p>
                            <p class="text-[10px] text-slate-600 font-mono">Incoming: <span id="acc-preview-imap">-</span> | SMTP: <span id="acc-preview-smtp">-</span></p>
                        </div>
                        <div>
                            <label class="text-[10px] text-slate-500 font-mono mb-1 block">INCOMING PROTOCOL</label>
                            <select id="acc-protocol-preset" class="compose-input" onchange="if(window._selectedProvider) selectProvider(window._selectedProvider)">
                                <option value="imap">IMAP (recommended)</option>
                                <option value="pop3">POP3</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex flex-wrap gap-2 mt-2">
                        <button class="px-5 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 transition-all flex items-center gap-1" onclick="addAccount()"><span class="material-symbols-outlined text-sm">link</span> Connect Account</button>
                        <button class="px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-bold hover:bg-emerald-600/30 transition-all flex items-center gap-1" onclick="testConnection()"><span class="material-symbols-outlined text-sm">science</span> Test Connection</button>
                        <button class="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10" onclick="document.getElementById('add-account-form').style.display='none'">Cancel</button>
                    </div>
                    <div id="test-results" style="display:none;" class="mt-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs font-mono"></div>
                </div>
            </div>

            <div class="settings-card">
                <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">SECURITY</h4>
                <div class="flex items-center justify-between mb-3"><div><p class="text-sm text-slate-200">Password</p><p class="text-xs text-slate-500">Change your account password</p></div><button class="text-xs px-3 py-1 rounded bg-white/5 text-slate-300 hover:bg-white/10">Change</button></div>
                <div class="flex items-center justify-between"><div><p class="text-sm text-slate-200">Two-Factor Auth</p><p class="text-xs text-slate-500">${user.totp_enabled ? 'Enabled' : 'Not enabled'}</p></div><span class="text-xs font-mono ${user.totp_enabled ? 'text-emerald-400' : 'text-slate-500'}">${user.totp_enabled ? '✓ ON' : '✗ OFF'}</span></div>
            </div>

            <div class="settings-card">
                <h4 class="text-xs font-bold dot-matrix text-slate-400 mb-3">STORAGE</h4>
                <div class="flex items-center justify-between mb-2"><span class="text-sm text-slate-200">${storageUsed} of ${storageLimit}</span><span class="text-xs font-mono text-slate-500">${storagePercent}%</span></div>
                <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all" style="width:${storagePercent}%"></div></div>
            </div>

            <div class="settings-card border-accent-red/20">
                <h4 class="text-xs font-bold text-accent-red/70 mb-3">DANGER ZONE</h4>
                <button class="text-xs px-3 py-1.5 rounded bg-accent-red/10 text-accent-red hover:bg-accent-red/20 transition-colors" onclick="if(confirm('Are you sure? This will delete your account.'))alert('Contact admin.')">Delete Account</button>
            </div>
        </div>

        <!-- EDIT ACCOUNT MODAL -->
        <div id="edit-account-modal" class="modal-overlay" style="display:none;">
            <div class="modal-content settings-card max-w-md mx-auto mt-24">
                <h4 class="text-sm font-bold text-slate-200 mb-4">Edit Account</h4>
                <input type="hidden" id="edit-acc-id" />
                <div class="flex flex-col gap-3">
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">LABEL</label><input type="text" id="edit-acc-label" class="compose-input" /></div>
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">DISPLAY NAME (From name)</label><input type="text" id="edit-acc-display-name" class="compose-input" placeholder="Name shown when sending" /></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">EMAIL</label><input type="email" id="edit-acc-email" class="compose-input" /></div>
                    <div>
                        <label class="text-[10px] text-slate-500 font-mono mb-1 block">INCOMING PROTOCOL</label>
                        <select id="edit-acc-protocol" class="compose-input">
                            <option value="imap">IMAP</option>
                            <option value="pop3">POP3</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">IMAP HOST</label><input type="text" id="edit-acc-imap-host" class="compose-input" /></div>
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">IMAP PORT</label><input type="number" id="edit-acc-imap-port" class="compose-input" /></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">POP3 HOST</label><input type="text" id="edit-acc-pop3-host" class="compose-input" /></div>
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">POP3 PORT</label><input type="number" id="edit-acc-pop3-port" class="compose-input" /></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">SMTP HOST</label><input type="text" id="edit-acc-smtp-host" class="compose-input" /></div>
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">SMTP PORT</label><input type="number" id="edit-acc-smtp-port" class="compose-input" /></div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">USERNAME</label><input type="text" id="edit-acc-username" class="compose-input" /></div>
                        <div><label class="text-[10px] text-slate-500 font-mono mb-1 block">NEW PASSWORD</label><input type="password" id="edit-acc-password" class="compose-input" placeholder="Leave blank to keep" /></div>
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button class="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80" onclick="saveEditedAccount()">Save Changes</button>
                        <button class="px-4 py-2 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10" onclick="hideModal('edit-account-modal')">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};

// Contacts page
Pages.contacts = function (contacts) {
    const contactCards = (contacts || []).map(c => {
        const init = (c.name || '?').charAt(0).toUpperCase();
        return `<div class="settings-card flex items-center gap-4">
            <div class="size-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">${init}</div>
            <div class="flex-1 min-w-0"><p class="text-sm font-medium text-slate-200 truncate">${c.name}</p><p class="text-xs text-slate-400 truncate">${c.email}</p>${c.phone ? `<p class="text-[10px] text-slate-500">${c.phone}</p>` : ''}</div>
            <div class="flex gap-1">
                <button class="toolbar-btn" title="Email" onclick="Router.navigate('compose')"><span class="material-symbols-outlined text-sm">mail</span></button>
                <button class="toolbar-btn" title="Delete" onclick="deleteContact('${c.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
            </div>
        </div>`;
    }).join('') || '<div class="flex flex-col items-center py-12 text-slate-500"><span class="material-symbols-outlined text-4xl mb-3">contacts</span><p class="text-sm">No contacts yet</p></div>';

    return `<div class="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div class="max-w-2xl mx-auto">
            <div class="flex items-center justify-between mb-6"><div class="flex items-center gap-3"><button class="toolbar-btn" data-action="back"><span class="material-symbols-outlined text-sm">arrow_back</span></button><span class="text-sm font-bold dot-matrix text-slate-200">CONTACTS</span></div>
                <button class="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/80 flex items-center gap-1" onclick="showAddContact()"><span class="material-symbols-outlined text-sm">person_add</span> Add</button>
            </div>
            <div id="add-contact-form" class="settings-card mb-4" style="display:none;">
                <div class="flex gap-3 mb-3"><input type="text" id="contact-name" class="compose-input flex-1" placeholder="Name" /><input type="email" id="contact-email" class="compose-input flex-1" placeholder="Email" /></div>
                <div class="flex gap-3"><input type="text" id="contact-phone" class="compose-input flex-1" placeholder="Phone (optional)" /><button class="px-4 py-1.5 rounded bg-primary text-white text-xs font-bold" onclick="addNewContact()">Save</button></div>
            </div>
            <div class="flex flex-col gap-3">${contactCards}</div>
        </div>
    </div>`;
};

// Helper functions accessible from HTML onclick handlers
function formatBytes(b) {
    if (!b || b === 0) return '0 B';
    const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showAddAccountForm() { 
    document.getElementById('add-account-form').style.display = ''; 
    // Reset provider selection
    document.querySelectorAll('.provider-btn').forEach(b => b.classList.remove('border-primary', 'bg-primary/10'));
    document.getElementById('acc-custom-fields').style.display = 'none';
    document.getElementById('acc-provider-info').style.display = 'none';
    window._selectedProvider = null;
}

// Provider SMTP/IMAP/POP3 presets
const MAIL_PROVIDERS = {
    gmail: { name: 'Gmail', imap: 'imap.gmail.com', imapPort: 993, pop3: 'pop.gmail.com', pop3Port: 995, smtp: 'smtp.gmail.com', smtpPort: 465, note: 'Use an App Password (not your Google password). Enable 2FA first at myaccount.google.com' },
    outlook: { name: 'Outlook / Hotmail', imap: 'outlook.office365.com', imapPort: 993, pop3: 'outlook.office365.com', pop3Port: 995, smtp: 'smtp.office365.com', smtpPort: 587, note: 'Use your Microsoft account password or app password' },
    hostinger: { name: 'Hostinger', imap: 'imap.hostinger.com', imapPort: 993, pop3: 'pop.hostinger.com', pop3Port: 995, smtp: 'smtp.hostinger.com', smtpPort: 465, note: 'Use your Hostinger email password' },
    godaddy: { name: 'GoDaddy', imap: 'imap.secureserver.net', imapPort: 993, pop3: 'pop.secureserver.net', pop3Port: 995, smtp: 'smtpout.secureserver.net', smtpPort: 465, note: 'Use your GoDaddy Workspace email password' },
    yahoo: { name: 'Yahoo', imap: 'imap.mail.yahoo.com', imapPort: 993, pop3: 'pop.mail.yahoo.com', pop3Port: 995, smtp: 'smtp.mail.yahoo.com', smtpPort: 465, note: 'Generate an App Password at login.yahoo.com' }
};

function selectProvider(provider) {
    window._selectedProvider = provider;
    // Highlight selected button
    document.querySelectorAll('.provider-btn').forEach(b => {
        b.classList.remove('border-primary', 'bg-primary/10');
        if (b.dataset.provider === provider) b.classList.add('border-primary', 'bg-primary/10');
    });

    const customFields = document.getElementById('acc-custom-fields');
    const providerInfo = document.getElementById('acc-provider-info');

    if (provider === 'custom') {
        customFields.style.display = '';
        providerInfo.style.display = 'none';
    } else {
        customFields.style.display = 'none';
        providerInfo.style.display = '';
        const p = MAIL_PROVIDERS[provider];
        document.getElementById('acc-provider-name').textContent = p.name;
        const proto = document.getElementById('acc-protocol-preset')?.value || 'imap';
        const inHost = proto === 'pop3' ? p.pop3 : p.imap;
        const inPort = proto === 'pop3' ? p.pop3Port : p.imapPort;
        document.getElementById('acc-preview-imap').textContent = `${inHost}:${inPort} (${proto.toUpperCase()})`;
        document.getElementById('acc-preview-smtp').textContent = `${p.smtp}:${p.smtpPort}`;
        // Auto-fill hidden fields
        document.getElementById('acc-imap-host').value = p.imap;
        document.getElementById('acc-imap-port').value = p.imapPort;
        document.getElementById('acc-smtp-host').value = p.smtp;
        document.getElementById('acc-smtp-port').value = p.smtpPort;
    }

    // Auto-fill username from email
    const emailEl = document.getElementById('acc-email');
    const usernameEl = document.getElementById('acc-username');
    if (emailEl.value && !usernameEl.value) usernameEl.value = emailEl.value;
    emailEl.addEventListener('input', () => { usernameEl.value = emailEl.value; }, { once: true });
}

async function addAccount() {
    const provider = window._selectedProvider;
    if (!provider) { alert('Please select a mail provider first'); return; }

    let imapHost, imapPort, smtpHost, smtpPort, pop3Host, pop3Port;
    const protoEl = provider !== 'custom' ? document.getElementById('acc-protocol-preset') : document.getElementById('acc-protocol');
    const incomingProtocol = protoEl?.value || 'imap';
    if (provider !== 'custom') {
        const p = MAIL_PROVIDERS[provider];
        imapHost = p.imap;
        imapPort = p.imapPort;
        smtpHost = p.smtp;
        smtpPort = p.smtpPort;
        pop3Host = p.pop3;
        pop3Port = p.pop3Port;
    } else {
        imapHost = document.getElementById('acc-imap-host').value;
        imapPort = parseInt(document.getElementById('acc-imap-port').value);
        smtpHost = document.getElementById('acc-smtp-host').value;
        smtpPort = parseInt(document.getElementById('acc-smtp-port').value);
        pop3Host = document.getElementById('acc-pop3-host')?.value || '';
        pop3Port = parseInt(document.getElementById('acc-pop3-port')?.value) || 995;
    }

    const email = document.getElementById('acc-email').value;
    const username = document.getElementById('acc-username').value || email;
    const password = document.getElementById('acc-password').value;

    if (!email || !password) { alert('Email and password are required'); return; }
    if (provider === 'custom' && incomingProtocol === 'imap' && !imapHost) { alert('Please fill in IMAP host'); return; }
    if (provider === 'custom' && incomingProtocol === 'pop3' && !pop3Host) { alert('Please fill in POP3 host'); return; }
    if (provider === 'custom' && !smtpHost) { alert('Please fill in SMTP host'); return; }

    const data = {
        label: document.getElementById('acc-label').value || provider,
        displayName: document.getElementById('acc-display-name').value || null,
        email, username, password,
        imapHost, imapPort: imapPort || 993,
        smtpHost, smtpPort: smtpPort || 465,
        pop3Host: pop3Host || null, pop3Port: pop3Port || 995,
        incomingProtocol,
        isPrimary: true
    };

    try {
        const btn = document.querySelector('#add-account-form button[onclick="addAccount()"]');
        if (btn) { btn.textContent = 'Connecting...'; btn.disabled = true; }
        const res = await Api.addMailAccount(data);
        if (res.id || res.success) { 
            alert('✅ Account connected! Email sync starting...'); 
            Router.handleRoute(); 
        } else { 
            alert('❌ ' + (res.error || 'Failed to connect')); 
        }
        if (btn) { btn.innerHTML = '<span class="material-symbols-outlined text-sm">link</span> Connect Account'; btn.disabled = false; }
    } catch (e) { alert('❌ Error: ' + e.message); }
}

async function testConnection() {
    const provider = window._selectedProvider;
    if (!provider) { alert('Please select a mail provider first'); return; }

    let imapHost, imapPort, smtpHost, smtpPort, pop3Host, pop3Port;
    const protoEl = provider !== 'custom' ? document.getElementById('acc-protocol-preset') : document.getElementById('acc-protocol');
    const incomingProtocol = protoEl?.value || 'imap';

    if (provider !== 'custom') {
        const p = MAIL_PROVIDERS[provider];
        imapHost = p.imap; imapPort = p.imapPort;
        smtpHost = p.smtp; smtpPort = p.smtpPort;
        pop3Host = p.pop3; pop3Port = p.pop3Port;
    } else {
        imapHost = document.getElementById('acc-imap-host').value;
        imapPort = parseInt(document.getElementById('acc-imap-port').value);
        smtpHost = document.getElementById('acc-smtp-host').value;
        smtpPort = parseInt(document.getElementById('acc-smtp-port').value);
        pop3Host = document.getElementById('acc-pop3-host')?.value || '';
        pop3Port = parseInt(document.getElementById('acc-pop3-port')?.value) || 995;
    }

    const email = document.getElementById('acc-email').value;
    const username = document.getElementById('acc-username').value || email;
    const password = document.getElementById('acc-password').value;

    if (!email || !password) { alert('Enter email and password first'); return; }

    const resultsEl = document.getElementById('test-results');
    resultsEl.style.display = '';
    resultsEl.innerHTML = '<span class="text-amber-400 animate-pulse">⏳ Testing connections... please wait (up to 30s)</span>';

    try {
        const data = { smtpHost, smtpPort, imapHost, imapPort, pop3Host: pop3Host || null, pop3Port, username, password };
        const res = await Api.post('/accounts/test-connection', data);

        let html = '<div class="flex flex-col gap-1">';
        // SMTP
        html += `<div>${res.smtp?.ok ? '✅' : '❌'} <strong>SMTP</strong> (${smtpHost || 'not configured'}): ${res.smtp?.ok ? '<span class="text-emerald-400">' + (res.smtp.message || 'OK') + '</span>' : '<span class="text-red-400">' + (res.smtp?.error || 'Failed') + '</span>'}</div>`;
        // IMAP
        if (imapHost) {
            html += `<div>${res.imap?.ok ? '✅' : '❌'} <strong>IMAP</strong> (${imapHost}): ${res.imap?.ok ? '<span class="text-emerald-400">' + (res.imap.message || 'OK') + '</span>' : '<span class="text-red-400">' + (res.imap?.error || 'Failed') + '</span>'}</div>`;
        }
        // POP3
        if (pop3Host) {
            html += `<div>${res.pop3?.ok ? '✅' : '❌'} <strong>POP3</strong> (${pop3Host}): ${res.pop3?.ok ? '<span class="text-emerald-400">' + (res.pop3.message || 'OK') + '</span>' : '<span class="text-red-400">' + (res.pop3?.error || 'Failed') + '</span>'}</div>`;
        }
        html += '</div>';
        resultsEl.innerHTML = html;
    } catch (e) {
        resultsEl.innerHTML = `<span class="text-red-400">❌ Test failed: ${e.message}</span>`;
    }
}

async function cleanupMismatchedEmails() {
    if (!confirm('This will remove emails from your inbox that were incorrectly synced to the wrong account. Continue?')) return;
    showToast('Cleaning up mismatched emails...', 'loading', 0);
    try {
        const res = await Api.post('/accounts/cleanup', {});
        showToast(`✅ Cleanup complete: ${res.removed || 0} mismatched emails removed`, 'success');
        Router.handleRoute();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function toggleAccountSync(accId) {
    try {
        showToast('Toggling sync...', 'loading', 0);
        await Api.put(`/accounts/${accId}/toggle-sync`);
        showToast('✅ Sync updated', 'success');
        Router.handleRoute();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function setPrimaryAccount(accId) {
    try {
        showToast('Setting primary...', 'loading', 0);
        await Api.put(`/accounts/${accId}/primary`);
        showToast('✅ Primary account updated', 'success');
        Router.handleRoute();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ========= PROFILE EDITING =========
function editProfile(show = true) {
    const viewEl = document.getElementById('profile-view');
    const editEl = document.getElementById('profile-edit');
    if (viewEl) viewEl.style.display = show ? 'none' : '';
    if (editEl) editEl.style.display = show ? '' : 'none';
}

async function saveProfile() {
    const data = {
        name: document.getElementById('edit-name')?.value,
        displayName: document.getElementById('edit-display-name')?.value,
        phone: document.getElementById('edit-phone')?.value,
        location: document.getElementById('edit-location')?.value
    };
    if (!data.name) { showToast('Name is required', 'error'); return; }
    showToast('Saving profile...', 'loading', 0);
    try {
        await Api.updateProfile(data);
        // Update localStorage user too
        const user = Api.user();
        user.name = data.name;
        user.display_name = data.displayName;
        user.phone = data.phone;
        user.location = data.location;
        localStorage.setItem('nm_user', JSON.stringify(user));
        showToast('✅ Profile updated!', 'success');
        Router.handleRoute();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

// ========= ACCOUNT EDITING =========
async function editAccount(accId) {
    try {
        const r = await Api.getMailAccounts();
        const acc = (r.accounts || []).find(a => a.id === accId);
        if (!acc) { showToast('Account not found', 'error'); return; }
        document.getElementById('edit-acc-id').value = accId;
        document.getElementById('edit-acc-label').value = acc.label || '';
        document.getElementById('edit-acc-display-name').value = acc.display_name || '';
        document.getElementById('edit-acc-email').value = acc.email || '';
        document.getElementById('edit-acc-protocol').value = acc.incoming_protocol || 'imap';
        document.getElementById('edit-acc-imap-host').value = acc.imap_host || '';
        document.getElementById('edit-acc-imap-port').value = acc.imap_port || 993;
        document.getElementById('edit-acc-pop3-host').value = acc.pop3_host || '';
        document.getElementById('edit-acc-pop3-port').value = acc.pop3_port || 995;
        document.getElementById('edit-acc-smtp-host').value = acc.smtp_host || '';
        document.getElementById('edit-acc-smtp-port').value = acc.smtp_port || 465;
        document.getElementById('edit-acc-username').value = acc.username || '';
        document.getElementById('edit-acc-password').value = '';
        showModal('edit-account-modal');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function saveEditedAccount() {
    const accId = document.getElementById('edit-acc-id').value;
    const data = {
        label: document.getElementById('edit-acc-label').value,
        display_name: document.getElementById('edit-acc-display-name').value || null,
        email: document.getElementById('edit-acc-email').value,
        incoming_protocol: document.getElementById('edit-acc-protocol').value,
        imap_host: document.getElementById('edit-acc-imap-host').value,
        imap_port: parseInt(document.getElementById('edit-acc-imap-port').value),
        pop3_host: document.getElementById('edit-acc-pop3-host').value || null,
        pop3_port: parseInt(document.getElementById('edit-acc-pop3-port').value) || 995,
        smtp_host: document.getElementById('edit-acc-smtp-host').value,
        smtp_port: parseInt(document.getElementById('edit-acc-smtp-port').value),
        username: document.getElementById('edit-acc-username').value
    };
    const pw = document.getElementById('edit-acc-password').value;
    if (pw) data.password = pw;
    showToast('Saving account...', 'loading', 0);
    try {
        await Api.updateAccount(accId, data);
        showToast('✅ Account updated!', 'success');
        hideModal('edit-account-modal');
        Router.handleRoute();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

async function unlinkAccount(accId, email) {
    if (!confirm(`Unlink ${email}? This will remove synced emails for this account.`)) return;
    showToast('Removing account...', 'loading', 0);
    try {
        await Api.del(`/accounts/${accId}`);
        showToast('✅ Account removed', 'success');
        Router.handleRoute();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
}

function showAddContact() { document.getElementById('add-contact-form').style.display = ''; }

async function addNewContact() {
    const data = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        phone: document.getElementById('contact-phone').value
    };
    if (!data.name || !data.email) { alert('Name and email required'); return; }
    await Api.addContact(data);
    Router.handleRoute();
}

async function deleteContact(id) {
    if (!confirm('Delete this contact?')) return;
    await Api.deleteContact(id);
    Router.handleRoute();
}

async function saveDraft() {
    const data = {
        to: document.getElementById('compose-to')?.value || '',
        subject: document.getElementById('compose-subject')?.value || '',
        bodyText: document.getElementById('compose-body')?.value || ''
    };
    await Api.saveDraft(data);
    alert('Draft saved!');
}

async function setup2FA() {
    try {
        const res = await Api.post('/auth/2fa/setup');
        if (res.qrCode) {
            const code = prompt('Scan the QR code with your authenticator app, then enter the 6-digit code.\n\nSecret: ' + res.secret);
            if (code) {
                const verifyRes = await Api.post('/auth/2fa/verify', { code });
                alert(verifyRes.message || verifyRes.error);
            }
        }
    } catch (e) { alert('Error setting up 2FA: ' + e.message); }
}

async function loadMailAccounts() {
    try {
        const data = await Api.getMailAccounts();
        const list = document.getElementById('mail-accounts-list');
        if (!list) return;
        list.innerHTML = (data.accounts || []).map(a => `<div class="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5">
            <div class="flex items-center gap-2"><span class="material-symbols-outlined text-sm text-primary">mail</span><span class="text-xs text-slate-300">${a.email}</span></div>
            <span class="text-[10px] font-mono ${a.last_sync ? 'text-emerald-400' : 'text-yellow-400'}">${a.last_sync ? 'Synced' : 'Pending'}</span>
        </div>`).join('') || '<p class="text-xs text-slate-500">No accounts connected yet</p>';
    } catch (e) { }
}

async function unlinkAccount(id, email) {
    if (!confirm(`Unlink account "${email}"? This will remove the mail connection. Your emails will remain.`)) return;
    try {
        await Api.deleteMailAccount(id);
        alert('Account unlinked successfully.');
        Router.handleRoute();
    } catch (e) { alert('Error: ' + e.message); }
}

async function editAccountLabel(id, currentLabel) {
    const newLabel = prompt('Enter new label for this account:', currentLabel);
    if (!newLabel || newLabel === currentLabel) return;
    try {
        const token = localStorage.getItem('nm_token');
        const res = await fetch(`${window.location.origin}/api/accounts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ label: newLabel })
        });
        if (res.ok) { alert('Label updated!'); Router.handleRoute(); }
        else { const d = await res.json(); alert(d.error || 'Failed'); }
    } catch (e) { alert('Error: ' + e.message); }
}

// Auto-load mail accounts when settings page opens
const origSettings = Pages.settings;
const settingsProxy = Pages.settings;
