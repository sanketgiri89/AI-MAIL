// ===== Eclatrecon AI Mail - Frontend API Client =====
const API_BASE = window.location.origin + '/api';

const Api = {
    token: () => localStorage.getItem('nm_token'),
    user: () => JSON.parse(localStorage.getItem('nm_user') || '{}'),

    // ===== CACHE =====
    _cache: {},
    _cacheTTL: 10000, // 10 second default cache

    _cacheGet(key) {
        const entry = this._cache[key];
        if (entry && Date.now() - entry.time < (entry.ttl || this._cacheTTL)) return entry.data;
        return null;
    },
    _cacheSet(key, data, ttl) {
        this._cache[key] = { data, time: Date.now(), ttl: ttl || this._cacheTTL };
    },
    _cacheClear() { this._cache = {}; },

    headers() {
        const h = { 'Content-Type': 'application/json' };
        if (this.token()) h['Authorization'] = `Bearer ${this.token()}`;
        return h;
    },

    requireAuth() {
        if (!this.token()) { window.location.href = '/login'; return false; }
        return true;
    },

    async get(path) {
        // Check cache first
        const cached = this._cacheGet(path);
        if (cached) return cached;
        const res = await fetch(`${API_BASE}${path}`, { headers: this.headers() });
        if (res.status === 401) { localStorage.removeItem('nm_token'); window.location.href = '/login'; }
        const data = await res.json();
        this._cacheSet(path, data);
        return data;
    },

    async post(path, body) {
        this._cacheClear(); // Invalidate cache on mutations
        const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
        if (res.status === 401) { localStorage.removeItem('nm_token'); window.location.href = '/login'; }
        return res.json();
    },

    async put(path, body) {
        this._cacheClear();
        const res = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) });
        return res.json();
    },

    async del(path) {
        this._cacheClear();
        const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: this.headers() });
        return res.json();
    },

    // ===== CORE EMAIL =====
    async getEmails(folder = 'inbox') { return this.get(`/emails?folder=${folder}`); },
    async getEmail(id) { return this.get(`/emails/${id}`); },
    async getCounts() { return this.get('/emails/counts'); },

    // Send email with FormData (supports file attachments)
    async sendEmail(data, files) {
        this._cacheClear();
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
        if (files && files.length) { for (const f of files) fd.append('attachments', f); }
        const h = {}; if (this.token()) h['Authorization'] = `Bearer ${this.token()}`;
        const res = await fetch(`${API_BASE}/emails/send`, { method: 'POST', headers: h, body: fd });
        if (res.status === 401) { localStorage.removeItem('nm_token'); window.location.href = '/login'; }
        return res.json();
    },

    async saveDraft(data) { return this.post('/emails/draft', data); },
    async starEmail(id) { return this.put(`/emails/${id}/star`); },
    async moveEmail(id, folder) { return this.put(`/emails/${id}/move`, { folder }); },
    async deleteEmail(id) { return this.del(`/emails/${id}`); },
    async searchEmails(query) { return this.post('/emails/search', { query }); },
    async syncEmails() { return this.post('/emails/sync', {}); },
    async getSyncStatus() { return this.get('/emails/sync-status'); },

    // ===== SIGNATURES =====
    async getSignatures() { return this.get('/signatures'); },

    // ===== SCHEDULE =====
    async scheduleEmail(data) { return this.post('/scheduled', data); },

    // ===== AI COMPOSE =====
    async aiCompose(prompt) { return this.post('/ai/compose', { prompt }); },

    // ===== CORE MANAGE =====
    async getContacts() { return this.get('/contacts'); },
    async addContact(data) { return this.post('/contacts', data); },
    async deleteContact(id) { return this.del(`/contacts/${id}`); },
    async getLabels() { return this.get('/labels'); },
    async getFolders() { return this.get('/folders'); },
    async getMe() { return this.get('/auth/me'); },
    async updateProfile(data) { return this.put('/auth/profile', data); },
    async updateAccount(id, data) { return this.put(`/accounts/${id}`, data); },
    async addMailAccount(data) { return this.post('/accounts', data); },
    async getMailAccounts() { return this.get('/accounts'); },

    // ===== TEAM =====
    async getTeamMembers() { return this.get('/teams/members'); },
    async inviteTeamMember(d) { return this.post('/teams/invite', d); },
    async updateTeamMember(id, d) { return this.put(`/teams/members/${id}`, d); },
    async removeTeamMember(id) { return this.del(`/teams/members/${id}`); },

    // ===== SHARED MAILBOXES =====
    async getSharedMailboxes() { return this.get('/teams/shared-mailboxes'); },
    async createSharedMailbox(d) { return this.post('/teams/shared-mailboxes', d); },
    async deleteSharedMailbox(id) { return this.del(`/teams/shared-mailboxes/${id}`); },
    async getMailboxMembers(id) { return this.get(`/teams/shared-mailboxes/${id}/members`); },
    async addMailboxMember(mbId, d) { return this.post(`/teams/shared-mailboxes/${mbId}/members`, d); },
    async removeMailboxMember(mbId, userId) { return this.del(`/teams/shared-mailboxes/${mbId}/members/${userId}`); },

    // ===== DELEGATION =====
    async getDelegations() { return this.get('/teams/delegations'); },
    async createDelegation(d) { return this.post('/teams/delegations', d); },
    async deleteDelegation(id) { return this.del(`/teams/delegations/${id}`); },

    // ===== FEATURES =====
    async getSignatures() { return this.get('/signatures'); },
    async addSignature(d) { return this.post('/signatures', d); },
    async deleteSignature(id) { return this.del(`/signatures/${id}`); },
    async getTemplates() { return this.get('/templates'); },
    async addTemplate(d) { return this.post('/templates', d); },
    async deleteTemplate(id) { return this.del(`/templates/${id}`); },
    async getScheduledEmails() { return this.get('/scheduled'); },
    async deleteScheduledEmail(id) { return this.del(`/scheduled/${id}`); },
    async getForwardingRules() { return this.get('/forwarding'); },
    async addForwardingRule(d) { return this.post('/forwarding', d); },
    async deleteForwardingRule(id) { return this.del(`/forwarding/${id}`); },
    async getLoginHistory() { return this.get('/login-history'); },
    async getContactGroups() { return this.get('/contact-groups'); },

    // ===== PRODUCTIVITY =====
    async getCalendarEvents() { return this.get('/calendar'); },
    async addCalendarEvent(d) { return this.post('/calendar', d); },
    async deleteCalendarEvent(id) { return this.del(`/calendar/${id}`); },
    async getTasks() { return this.get('/tasks'); },
    async addTask(d) { return this.post('/tasks', d); },
    async updateTask(id, d) { return this.put(`/tasks/${id}`, d); },
    async deleteTask(id) { return this.del(`/tasks/${id}`); },
    async getNotes() { return this.get('/notes'); },
    async addNote(d) { return this.post('/notes', d); },
    async deleteNote(id) { return this.del(`/notes/${id}`); },
    async getReminders() { return this.get('/reminders'); },
    async addReminder(d) { return this.post('/reminders', d); },
    async deleteReminder(id) { return this.del(`/reminders/${id}`); },

    // ===== TEAMS =====
    async getSendFrom() { return this.get('/teams/send-from'); },
    async getSharedMailboxes() { return this.get('/teams/shared-mailboxes'); },
    async createSharedMailbox(d) { return this.post('/teams/shared-mailboxes', d); },
    async deleteSharedMailbox(id) { return this.del(`/teams/shared-mailboxes/${id}`); },
    async getMailboxMembers(id) { return this.get(`/teams/shared-mailboxes/${id}/members`); },
    async addMailboxMember(id, d) { return this.post(`/teams/shared-mailboxes/${id}/members`, d); },
    async removeMailboxMember(mbId, userId) { return this.del(`/teams/shared-mailboxes/${mbId}/members/${userId}`); },
    async getDelegations() { return this.get('/teams/delegations'); },
    async createDelegation(d) { return this.post('/teams/delegations', d); },
    async deleteDelegation(id) { return this.del(`/teams/delegations/${id}`); },
    async getTeamMembers() { return this.get('/teams/members'); },
    async inviteTeamMember(d) { return this.post('/teams/invite', d); },

    // ===== SECURITY =====
    async getDlpRules() { return this.get('/security/dlp-rules'); },
    async addDlpRule(d) { return this.post('/security/dlp-rules', d); },
    async deleteDlpRule(id) { return this.del(`/security/dlp-rules/${id}`); },
    async getIpWhitelist() { return this.get('/security/ip-whitelist'); },
    async addIpWhitelist(d) { return this.post('/security/ip-whitelist', d); },
    async deleteIpWhitelist(id) { return this.del(`/security/ip-whitelist/${id}`); },
    async getAuditTrail() { return this.get('/security/audit-trail'); },
    async getGdprRequests() { return this.get('/security/gdpr/requests'); },
    async phishingCheck(urls) { return this.post('/security/phishing-check', { urls }); },

    // ===== ANALYTICS =====
    async getAnalyticsDashboard(days = 30) { return this.get(`/analytics/dashboard?days=${days}`); },
    async getSlaTracking() { return this.get('/analytics/sla'); },
    async getAttachmentAnalytics() { return this.get('/analytics/attachments'); },

    // ===== BILLING =====
    async getPlans() { return this.get('/billing/plans'); },
    async getSubscription() { return this.get('/billing/subscription'); },
    async getUsage() { return this.get('/billing/usage'); },
    async subscribePlan(planId) { return this.post('/billing/subscribe', { planId }); },

    // ===== DATA MANAGEMENT =====
    async createBackup() { return this.post('/data/backup'); },
    async retentionCleanup(d) { return this.post('/data/retention/cleanup', d); },

    // ===== INTEGRATIONS =====
    async getIntegrationStatus() { return this.get('/integrations/status'); },

    // ===== API KEYS =====
    async getApiKeys() { return this.get('/developer/keys'); },
    async createApiKey(d) { return this.post('/developer/keys', d); },
    async deleteApiKey(id) { return this.del(`/developer/keys/${id}`); },

    // ===== WEBHOOKS =====
    async getWebhooks() { return this.get('/developer/webhooks'); },
    async createWebhook(d) { return this.post('/developer/webhooks', d); },
    async deleteWebhook(id) { return this.del(`/developer/webhooks/${id}`); },
    async toggleWebhook(id) { return this.put(`/developer/webhooks/${id}/toggle`); },
    async getWebhookLogs(id) { return this.get(`/developer/webhooks/${id}/logs`); },

    // ===== n8n =====
    async n8nTrigger(opts) { return this.get(`/integrations/n8n/trigger${opts ? '?'+new URLSearchParams(opts) : ''}`); },
    async n8nSendEmail(d) { return this.post('/integrations/n8n/send', d); },
    async notifySlack(d) { return this.post('/integrations/notify/slack', d); },
    async notifyDiscord(d) { return this.post('/integrations/notify/discord', d); },

    // ===== MAIL ACCOUNTS =====
    async deleteMailAccount(id) { return this.del(`/accounts/${id}`); },

    // ===== APIFY LEAD SCRAPER =====
    async getApifySettings() { return this.get('/apify/settings'); },
    async saveApifySettings(d) { return this.post('/apify/settings', d); },
    async getApifyActors() { return this.get('/apify/actors'); },
    async startScrape(d) { return this.post('/apify/scrape', d); },
    async getScrapeJobs() { return this.get('/apify/jobs'); },
    async getScrapeJob(id) { return this.get(`/apify/jobs/${id}`); },
    async deleteScrapeJob(id) { return this.del(`/apify/jobs/${id}`); },
    async refreshScrapeJob(id) { return this.post(`/apify/jobs/${id}/refresh`); },
    async getScrapedLeads(q='') { return this.get(`/apify/leads${q ? '?'+q : ''}`); },
    async deleteScrapedLead(id) { return this.del(`/apify/leads/${id}`); },
    async importLeads(d) { return this.post('/apify/import', d); },
    async quickCampaign(d) { return this.post('/apify/quick-campaign', d); },
    async getApifyStats() { return this.get('/apify/stats'); },
};
