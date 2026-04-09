// ===== Eclatrecon AI Mail - SPA Router (API-Connected) =====
const Router = {
    init() {
        if (!Api.requireAuth()) return;
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    navigate(page, id) {
        window.location.hash = id ? `/${page}/${id}` : `/${page}`;
    },

    async handleRoute() {
        const hash = window.location.hash.slice(1) || '/inbox';
        const parts = hash.split('/').filter(Boolean);
        const page = parts[0] || 'inbox';
        const id = parts[1];

        this.setActiveLink(page);
        await this.renderPage(page, id);
        this.bindEvents();
        // Fire these in background (non-blocking)
        this.updateCounts();
        if (typeof loadSidebarMailboxes === 'function' && (!window._mbCacheTime || Date.now() - window._mbCacheTime > 30000)) {
            window._mbCacheTime = Date.now();
            loadSidebarMailboxes();
        }
    },

    setActiveLink(page) {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const linkPage = link.dataset.page;
            const isActive = linkPage === page;
            link.classList.toggle('bg-white/5', isActive);
            link.classList.toggle('text-slate-100', isActive);
            link.classList.toggle('border-l-2', isActive);
            link.classList.toggle('border-primary', isActive);
            link.classList.toggle('text-slate-400', !isActive);
        });
    },

    async renderPage(page, id) {
        const mainContent = document.getElementById('main-content');
        const rightSidebar = document.getElementById('right-sidebar');

        // Close mobile sidebar
        const sidebar = document.getElementById('left-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');

        switch (page) {
            case 'inbox': case 'starred': case 'sent': case 'drafts': case 'spam': case 'trash':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                let emailFolder = page === 'starred' ? 'inbox&starred=true' : page;
                if (window._selectedMailbox && window._selectedMailbox !== 'all') emailFolder += `&account_id=${window._selectedMailbox}`;
                const emailData = await Api.getEmails(emailFolder);
                mainContent.innerHTML = Pages.emailList(page, emailData.emails || []);
                rightSidebar.innerHTML = Pages.aiSidebar();
                rightSidebar.style.display = '';
                // Load sync status
                loadSyncStatus();
                // Auto-sync on first inbox load
                if (page === 'inbox' && !window._hasAutoSynced) {
                    window._hasAutoSynced = true;
                    syncInbox(true); // silent auto-sync
                }
                break;
            case 'email':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const detail = await Api.getEmail(id);
                mainContent.innerHTML = Pages.emailDetail(detail.email, detail.thread);
                rightSidebar.innerHTML = Pages.aiSidebar();
                rightSidebar.style.display = '';
                break;
            case 'compose':
                mainContent.innerHTML = Pages.compose();
                rightSidebar.style.display = 'none';
                break;
            case 'settings':
                mainContent.innerHTML = Pages.settings();
                rightSidebar.style.display = 'none';
                break;
            case 'account':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const meData = await Api.getMe();
                const accountsData = await Api.getMailAccounts();
                mainContent.innerHTML = Pages.account(meData.user, accountsData.accounts || []);
                rightSidebar.style.display = 'none';
                break;
            case 'contacts':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const contactsData = await Api.getContacts();
                mainContent.innerHTML = Pages.contacts(contactsData.contacts || []);
                rightSidebar.style.display = 'none';
                break;

            // ===== PRODUCTIVITY =====
            case 'calendar':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const calData = await Api.getCalendarEvents();
                mainContent.innerHTML = Pages.calendar(calData.events || []);
                rightSidebar.style.display = 'none';
                break;
            case 'tasks':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const tasksData = await Api.getTasks();
                mainContent.innerHTML = Pages.tasks(tasksData.tasks || []);
                rightSidebar.style.display = 'none';
                break;
            case 'notes':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const notesData = await Api.getNotes();
                mainContent.innerHTML = Pages.notes(notesData.notes || []);
                rightSidebar.style.display = 'none';
                break;
            case 'reminders':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const remData = await Api.getReminders();
                mainContent.innerHTML = Pages.reminders(remData.reminders || []);
                rightSidebar.style.display = 'none';
                break;

            // ===== FEATURES =====
            case 'signatures':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const sigData = await Api.getSignatures();
                mainContent.innerHTML = Pages.signatures(sigData.signatures || []);
                rightSidebar.style.display = 'none';
                break;
            case 'templates':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const tplData = await Api.getTemplates();
                mainContent.innerHTML = Pages.templates(tplData.templates || []);
                rightSidebar.style.display = 'none';
                break;
            case 'scheduled':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const schedData = await Api.getScheduledEmails();
                mainContent.innerHTML = Pages.scheduled(schedData.scheduledEmails || []);
                rightSidebar.style.display = 'none';
                break;
            case 'forwarding':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const fwdData = await Api.getForwardingRules();
                mainContent.innerHTML = Pages.forwarding(fwdData.rules || []);
                rightSidebar.style.display = 'none';
                break;

            // ===== TOOLS =====
            case 'analytics':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const anData = await Api.getAnalyticsDashboard();
                mainContent.innerHTML = Pages.analytics(anData);
                rightSidebar.style.display = 'none';
                break;
            case 'security':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const [dlpData, ipData, gdprData] = await Promise.all([Api.getDlpRules(), Api.getIpWhitelist(), Api.getGdprRequests()]);
                mainContent.innerHTML = Pages.security(dlpData.rules || [], ipData.ips || [], gdprData.requests || []);
                rightSidebar.style.display = 'none';
                break;
            case 'billing':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const [plansData, subData, usData] = await Promise.all([Api.getPlans(), Api.getSubscription(), Api.getUsage()]);
                mainContent.innerHTML = Pages.billing(plansData.plans || [], subData.subscription || null, usData);
                rightSidebar.style.display = 'none';
                break;
            case 'integrations':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const intData = await Api.getIntegrationStatus();
                mainContent.innerHTML = Pages.integrations(intData);
                rightSidebar.style.display = 'none';
                break;

            // ===== TEAM =====
            case 'team':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const [teamMembersData, sharedMbData, delegData, accountsForTeam] = await Promise.all([
                    Api.getTeamMembers(), Api.getSharedMailboxes(), Api.getDelegations(), Api.getMailAccounts()
                ]);
                mainContent.innerHTML = Pages.team(teamMembersData.members || [], sharedMbData.mailboxes || [], delegData, accountsForTeam.accounts || []);
                rightSidebar.style.display = 'none';
                break;

            case 'backup':
                mainContent.innerHTML = Pages.backup();
                rightSidebar.style.display = 'none';
                break;

            // ===== DEVELOPER =====
            case 'api-keys':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const keysData = await Api.getApiKeys();
                mainContent.innerHTML = Pages.apiKeys(keysData.keys || []);
                rightSidebar.style.display = 'none';
                break;
            case 'webhooks':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const hooksData = await Api.getWebhooks();
                mainContent.innerHTML = Pages.webhooks(hooksData.webhooks || []);
                rightSidebar.style.display = 'none';
                break;

            // ===== LEAD SCRAPER =====
            case 'lead-scraper':
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const [apifyStats, apifyJobs, apifyLeads, apifyActors, apifySettings, subLists] = await Promise.all([
                    Api.getApifyStats(), Api.getScrapeJobs(), Api.getScrapedLeads('has_email=1&limit=50'),
                    Api.getApifyActors(), Api.getApifySettings(),
                    Api.get('/campaigns/lists')
                ]);
                mainContent.innerHTML = Pages.leadScraper(apifyStats, apifyJobs.jobs || [], apifyLeads.leads || [], apifyActors.actors || [], apifySettings.settings || {}, subLists.lists || []);
                rightSidebar.style.display = 'none';
                break;

            default:
                mainContent.innerHTML = '<div class="flex-1 flex items-center justify-center"><span class="material-symbols-outlined text-4xl text-slate-600 animate-spin">progress_activity</span></div>';
                const defData = await Api.getEmails('inbox');
                mainContent.innerHTML = Pages.emailList('inbox', defData.emails || []);
                rightSidebar.innerHTML = Pages.aiSidebar();
                rightSidebar.style.display = '';
        }
    },

    async updateCounts() {
        try {
            const data = await Api.getCounts();
            const counts = data.counts || {};
            // Update inbox count badge
            const inboxLink = document.querySelector('[data-page="inbox"] .ml-auto');
            if (inboxLink && counts.inbox) inboxLink.textContent = counts.inbox.unread || 0;
            const draftsLink = document.querySelector('[data-page="drafts"] .ml-auto');
            if (draftsLink && counts.drafts) draftsLink.textContent = counts.drafts.total || 0;
        } catch (e) { }
    },

    bindEvents() {
        // Email clicks
        document.querySelectorAll('[data-email-id]').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('[data-action]')) return;
                this.navigate('email', el.dataset.emailId);
            });
        });

        // Back buttons
        document.querySelectorAll('[data-action="back"]').forEach(btn => {
            btn.addEventListener('click', () => window.history.back());
        });

        // Delete email
        document.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const emailId = btn.closest('[data-email-id]')?.dataset.emailId || btn.dataset.emailId;
                if (emailId) { await Api.deleteEmail(emailId); this.handleRoute(); }
            });
        });

        // Archive (move to trash)
        document.querySelectorAll('[data-action="archive"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const emailId = btn.closest('[data-email-id]')?.dataset.emailId || btn.dataset.emailId;
                if (emailId) { await Api.moveEmail(emailId, 'trash'); this.handleRoute(); }
            });
        });

        // Star toggle
        document.querySelectorAll('[data-action="star"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const emailId = btn.closest('[data-email-id]')?.dataset.emailId || btn.dataset.emailId;
                if (emailId) {
                    await Api.starEmail(emailId);
                    this.handleRoute();
                }
            });
        });

        // Send email
        const sendBtn = document.querySelector('[data-action="send"]');
        if (sendBtn) {
            sendBtn.addEventListener('click', async () => {
                const to = document.getElementById('compose-to')?.value;
                const cc = document.getElementById('compose-cc')?.value;
                const bcc = document.getElementById('compose-bcc')?.value;
                const subject = document.getElementById('compose-subject')?.value;
                const richBody = document.getElementById('compose-body-rich');
                const bodyText = richBody ? richBody.innerText : (document.getElementById('compose-body')?.value || '');
                const bodyHtml = richBody ? richBody.innerHTML : `<div style="white-space:pre-wrap">${bodyText}</div>`;
                const inReplyTo = document.getElementById('compose-in-reply-to')?.value || undefined;
                const accountId = document.getElementById('compose-from')?.value || undefined;
                if (!to || !subject) { showToast('To and Subject are required', 'error'); return; }

                // Collect files from file input
                const fileInput = document.getElementById('compose-attachment');
                const files = fileInput ? Array.from(fileInput.files) : [];
                // Read receipt toggle
                const trackRead = document.getElementById('track-read-receipt')?.checked ? '1' : '0';

                sendBtn.textContent = 'Sending...';
                sendBtn.disabled = true;
                showToast('Sending email...', 'loading', 0);
                try {
                    await Api.sendEmail({ to, cc, bcc, subject, bodyText, bodyHtml, inReplyTo, accountId, trackRead }, files);
                    showToast('✅ Email sent successfully!', 'success');
                    this.navigate('sent');
                } catch (err) {
                    showToast('❌ Send failed: ' + err.message, 'error');
                    sendBtn.textContent = 'Send';
                    sendBtn.disabled = false;
                }
            });
        }

        // Toggle switches
        document.querySelectorAll('.toggle-switch').forEach(sw => {
            sw.addEventListener('click', () => sw.classList.toggle('active'));
        });

        // Settings tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
                const tabId = btn.dataset.tab;
                if (tabId) document.getElementById(tabId).style.display = '';
            });
        });

        // Reply
        document.querySelectorAll('[data-action="reply"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const emailId = btn.dataset.emailId;
                if (!emailId) return;
                const data = await Api.getEmail(emailId);
                const em = data.email;
                const date = em.received_at ? new Date(em.received_at).toLocaleString() : '';
                window._composeContext = {
                    mode: 'reply',
                    to: em.from_address,
                    cc: '',
                    subject: em.subject?.startsWith('Re:') ? em.subject : `Re: ${em.subject || ''}`,
                    inReplyTo: em.message_id || '',
                    body: `\n\n--- On ${date}, ${em.from_name || em.from_address} wrote ---\n${em.body_text || ''}`
                };
                Router.navigate('compose');
            });
        });

        // Reply All
        document.querySelectorAll('[data-action="reply-all"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const emailId = btn.dataset.emailId;
                if (!emailId) return;
                const data = await Api.getEmail(emailId);
                const em = data.email;
                const user = Api.user();
                const date = em.received_at ? new Date(em.received_at).toLocaleString() : '';
                // CC = original To + CC minus current user
                const allRecipients = [em.to_addresses, em.cc_addresses].filter(Boolean).join(', ');
                const ccList = allRecipients.split(',').map(e => e.trim()).filter(e => e && e !== user.email).join(', ');
                window._composeContext = {
                    mode: 'replyAll',
                    to: em.from_address,
                    cc: ccList,
                    subject: em.subject?.startsWith('Re:') ? em.subject : `Re: ${em.subject || ''}`,
                    inReplyTo: em.message_id || '',
                    body: `\n\n--- On ${date}, ${em.from_name || em.from_address} wrote ---\n${em.body_text || ''}`
                };
                Router.navigate('compose');
            });
        });

        // Forward
        document.querySelectorAll('[data-action="forward"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const emailId = btn.dataset.emailId;
                if (!emailId) return;
                const data = await Api.getEmail(emailId);
                const em = data.email;
                const date = em.received_at ? new Date(em.received_at).toLocaleString() : '';
                window._composeContext = {
                    mode: 'forward',
                    to: '',
                    cc: '',
                    subject: em.subject?.startsWith('Fwd:') ? em.subject : `Fwd: ${em.subject || ''}`,
                    inReplyTo: '',
                    body: `\n\n---------- Forwarded message ----------\nFrom: ${em.from_name || ''} <${em.from_address}>\nDate: ${date}\nSubject: ${em.subject}\nTo: ${em.to_addresses}\n\n${em.body_text || ''}`
                };
                Router.navigate('compose');
            });
        });
    }
};

// Utility helpers for modals
function showModal(id) { const el = document.getElementById(id); if (el) el.style.display = ''; }
function hideModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

// Sync helpers
async function syncInbox(silent = false) {
    const icon = document.getElementById('sync-icon');
    const btn = document.getElementById('sync-btn');
    if (icon) icon.classList.add('animate-spin');
    if (btn) btn.disabled = true;
    try {
        const result = await Api.syncEmails();
        if (!silent) {
            const msg = result.synced > 0 ? `✅ Synced ${result.synced} new emails` : '✅ Already up to date';
            // Show inline status instead of alert
            const syncTime = document.getElementById('last-sync-time');
            if (syncTime) syncTime.textContent = msg;
            setTimeout(() => loadSyncStatus(), 3000);
        }
        if (result.synced > 0) {
            Router.handleRoute(); // Refresh email list
        } else {
            loadSyncStatus();
        }
    } catch (e) {
        if (!silent) {
            const syncTime = document.getElementById('last-sync-time');
            if (syncTime) syncTime.textContent = '❌ Sync failed';
        }
        console.error('Sync error:', e);
    } finally {
        if (icon) icon.classList.remove('animate-spin');
        if (btn) btn.disabled = false;
    }
}

// Filter emails by tab (All, Unread, Starred)
function filterEmails(filter) {
    // Update tab active states
    document.querySelectorAll('.email-filter-tab').forEach(tab => {
        tab.classList.remove('active', 'bg-primary/15', 'text-primary', 'border', 'border-primary/30', 'font-semibold');
        tab.classList.add('text-slate-400', 'font-medium');
    });
    const activeTab = event?.target;
    if (activeTab) {
        activeTab.classList.add('active', 'bg-primary/15', 'text-primary', 'border', 'border-primary/30', 'font-semibold');
        activeTab.classList.remove('text-slate-400', 'font-medium');
    }

    // Filter email rows
    const rows = document.querySelectorAll('.email-row');
    rows.forEach(row => {
        if (filter === 'all') {
            row.style.display = '';
        } else if (filter === 'unread') {
            // Unread emails have the bg-white/[0.03] class
            row.style.display = row.classList.toString().includes('bg-white') ? '' : 'none';
        } else if (filter === 'starred') {
            // Starred emails contain a star icon
            row.style.display = row.querySelector('[style*="FILL"]') ? '' : 'none';
        }
    });
}
async function loadSyncStatus() {
    try {
        const status = await Api.getSyncStatus();
        const el = document.getElementById('last-sync-time');
        if (el && status.lastSync) {
            const ago = getTimeAgo(new Date(status.lastSync + 'Z'));
            el.textContent = `Synced ${ago}`;
        } else if (el) {
            el.textContent = 'Not synced';
        }
    } catch (e) {}
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

// ===== MULTI-SELECT EMAIL FUNCTIONS =====
function toggleSelectAllEmails(el) {
    const checked = el.checked;
    document.querySelectorAll('.email-select-cb').forEach(cb => { cb.checked = checked; });
    updateBulkBar();
}

function updateBulkBar() {
    const checked = document.querySelectorAll('.email-select-cb:checked');
    const bar = document.getElementById('bulk-action-bar');
    const count = document.getElementById('bulk-count');
    if (bar) {
        if (checked.length > 0) {
            bar.classList.remove('hidden');
            bar.classList.add('flex');
        } else {
            bar.classList.add('hidden');
            bar.classList.remove('flex');
        }
    }
    if (count) count.textContent = `${checked.length} selected`;
}

function deselectAllEmails() {
    document.querySelectorAll('.email-select-cb').forEach(cb => { cb.checked = false; });
    const selAll = document.getElementById('select-all-emails');
    if (selAll) selAll.checked = false;
    updateBulkBar();
}

async function bulkDeleteSelected() {
    const ids = Array.from(document.querySelectorAll('.email-select-cb:checked')).map(cb => cb.dataset.emailCb);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} email(s)?`)) return;
    try {
        await Api.post('/emails/bulk-delete', { ids });
        showToast(`🗑️ ${ids.length} email(s) deleted`, 'success');
        Router.handleRoute();
    } catch (err) {
        showToast('Delete failed: ' + err.message, 'error');
    }
}
