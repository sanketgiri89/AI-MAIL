// ===== Eclatrecon AI Mail - Admin Panel JavaScript =====
const API = window.location.origin + '/api';
const token = localStorage.getItem('nm_token');
if (!token) window.location.href = '/login';
const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

// ===== Helpers =====
function formatBytes(b) {
    if (!b || b === 0) return '0 B';
    const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
function showModal(id) { document.getElementById(id).classList.add('active'); }
function hideModal(id) { document.getElementById(id).classList.remove('active'); }
function logout() { localStorage.removeItem('nm_token'); localStorage.removeItem('nm_user'); window.location.href = '/login'; }

async function apiFetch(url, opts = {}) {
    const res = await fetch(`${API}${url}`, { headers, ...opts });
    if (res.status === 403) { alert('Admin access required'); return null; }
    return res.json();
}

// ===== Tab Navigation =====
document.querySelectorAll('.admin-nav').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-nav').forEach(b => { b.classList.remove('active', 'bg-white/5', 'text-slate-100', 'border-l-2', 'border-primary'); b.classList.add('text-slate-400'); });
        btn.classList.add('active', 'bg-white/5', 'text-slate-100', 'border-l-2', 'border-primary'); btn.classList.remove('text-slate-400');
        document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
        document.getElementById('tab-' + btn.dataset.tab).style.display = '';
        const loaders = { dashboard: loadStats, users: loadUsers, emails: loadEmails, accounts: loadAccounts, sessions: loadSessions, storage: loadStorage, logs: loadLogs, security: loadSecurity, domains: loadDomains, health: loadHealth, subscriptions: loadSubscriptions, campaigns: loadCampaigns, logins: loadLoginHistory, settings: loadSettings };
        if (loaders[btn.dataset.tab]) loaders[btn.dataset.tab]();
    });
});

// ===== DASHBOARD =====
async function loadStats() {
    const data = await apiFetch('/admin/stats');
    if (!data) return;
    const s = data.stats;
    document.getElementById('stat-users').textContent = s.totalUsers;
    document.getElementById('stat-emails').textContent = s.totalEmails;
    document.getElementById('stat-active').textContent = s.activeToday;
    document.getElementById('stat-spam').textContent = s.spamBlocked;
    document.getElementById('stat-sent').textContent = s.emailsSentToday;
    document.getElementById('stat-recv').textContent = s.emailsReceivedToday;
    document.getElementById('stat-accounts').textContent = s.totalAccounts;
    document.getElementById('stat-contacts').textContent = s.totalContacts;
    document.getElementById('stat-sessions').textContent = s.activeSessions;
    document.getElementById('stat-attachments').textContent = s.totalAttachments;
    document.getElementById('count-users').textContent = s.totalUsers;
    document.getElementById('count-emails').textContent = s.totalEmails;
}

// ===== USERS =====
async function loadUsers() {
    const data = await apiFetch('/admin/users');
    if (!data) return;
    document.getElementById('users-tbody').innerHTML = data.users.map(u => `
        <tr class="border-b border-white/5">
            <td class="py-3 px-4"><div class="flex items-center gap-3"><div class="size-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xs font-bold text-primary">${(u.name || '?').charAt(0).toUpperCase()}</div><span class="text-slate-200">${u.name}</span></div></td>
            <td class="py-3 px-4 text-slate-400 font-mono text-xs">${u.email}</td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer ${u.is_admin ? 'bg-primary/10 text-primary' : 'bg-white/5 text-slate-500'}" onclick="toggleAdmin('${u.id}')" title="Click to toggle">${u.is_admin ? 'ADMIN' : 'USER'}</span></td>
            <td class="py-3 px-4"><span class="text-[10px] font-mono ${u.totp_enabled ? 'text-emerald-400' : 'text-slate-500'}">${u.totp_enabled ? '✓ ON' : '✗ OFF'}</span>${u.totp_enabled ? `<button class="ml-1 text-[10px] text-accent-red/60 hover:text-accent-red" onclick="disable2FA('${u.id}')">disable</button>` : ''}</td>
            <td class="py-3 px-4 text-xs text-slate-400 font-mono">${u.email_count || 0}</td>
            <td class="py-3 px-4 text-xs text-slate-400 font-mono">${formatBytes(u.storage_used)} / ${formatBytes(u.storage_limit)}</td>
            <td class="py-3 px-4 text-xs text-slate-500">${new Date(u.created_at).toLocaleDateString()}</td>
            <td class="py-3 px-4"><div class="flex gap-1">
                <button class="toolbar-btn" title="Edit" onclick="editUser('${u.id}','${(u.name||'').replace(/'/g,"\\'")}','${(u.phone||'').replace(/'/g,"\\'")}','${(u.location||'').replace(/'/g,"\\'")}',${u.storage_limit})"><span class="material-symbols-outlined text-sm">edit</span></button>
                <button class="toolbar-btn" title="Reset Password" onclick="resetPassword('${u.id}')"><span class="material-symbols-outlined text-sm">lock_reset</span></button>
                <button class="toolbar-btn" title="View Sessions" onclick="viewUserSessions('${u.id}')"><span class="material-symbols-outlined text-sm">devices</span></button>
                <button class="toolbar-btn" title="Delete" onclick="deleteUser('${u.id}','${u.email}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
            </div></td>
        </tr>`).join('') || '<tr><td colspan="8" class="py-6 text-center text-slate-500">No users found</td></tr>';
}

async function createUser(e) {
    e.preventDefault();
    const body = { name: document.getElementById('new-user-name').value, email: document.getElementById('new-user-email').value, password: document.getElementById('new-user-pass').value, isAdmin: document.getElementById('new-user-admin').checked, storageLimit: parseInt(document.getElementById('new-user-storage').value) };
    const res = await fetch(`${API}/admin/users`, { method: 'POST', headers, body: JSON.stringify(body) });
    const d = await res.json();
    if (res.ok) { hideModal('create-user-modal'); loadUsers(); loadStats(); alert('User created!'); } else { alert(d.error); }
}

function editUser(id, name, phone, location, storageLimit) {
    document.getElementById('edit-user-id').value = id;
    document.getElementById('edit-user-name').value = name;
    document.getElementById('edit-user-phone').value = phone;
    document.getElementById('edit-user-location').value = location;
    document.getElementById('edit-user-storage').value = storageLimit;
    document.getElementById('edit-user-password').value = '';
    showModal('edit-user-modal');
}

async function saveUser(e) {
    e.preventDefault();
    const id = document.getElementById('edit-user-id').value;
    const body = { name: document.getElementById('edit-user-name').value, phone: document.getElementById('edit-user-phone').value, location: document.getElementById('edit-user-location').value, storageLimit: parseInt(document.getElementById('edit-user-storage').value) };
    await fetch(`${API}/admin/users/${id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    // If password field is filled, reset password too
    const newPass = document.getElementById('edit-user-password').value;
    if (newPass && newPass.length >= 6) {
        await fetch(`${API}/admin/users/${id}/reset-password`, { method: 'PUT', headers, body: JSON.stringify({ newPassword: newPass }) });
    } else if (newPass && newPass.length > 0 && newPass.length < 6) {
        alert('Password must be 6+ characters. User info saved but password NOT changed.');
        hideModal('edit-user-modal'); loadUsers(); return;
    }
    hideModal('edit-user-modal'); loadUsers(); alert(newPass && newPass.length >= 6 ? 'User & password updated!' : 'User updated!');
}

async function deleteUser(id, email) { if (!confirm(`Delete user ${email}? All their data will be removed.`)) return; await fetch(`${API}/admin/users/${id}`, { method: 'DELETE', headers }); loadUsers(); loadStats(); }
async function resetPassword(id) { const p = prompt('Enter new password (min 6 chars):'); if (!p || p.length < 6) { if (p) alert('Password must be 6+ chars'); return; } await fetch(`${API}/admin/users/${id}/reset-password`, { method: 'PUT', headers, body: JSON.stringify({ newPassword: p }) }); alert('Password reset!'); }
async function toggleAdmin(id) { if (!confirm('Toggle admin role?')) return; await fetch(`${API}/admin/users/${id}/toggle-admin`, { method: 'PUT', headers }); loadUsers(); }
async function disable2FA(id) { if (!confirm('Disable 2FA for this user?')) return; await fetch(`${API}/admin/users/${id}/disable-2fa`, { method: 'PUT', headers }); loadUsers(); }
function viewUserSessions(userId) { document.querySelector('[data-tab="sessions"]').click(); }
async function suspendUser(id) { if (!confirm('Suspend this user? All their sessions will be revoked.')) return; const r = await fetch(`${API}/admin/users/${id}/suspend`, { method: 'PUT', headers }); const d = await r.json(); alert(d.message || d.error); hideModal('edit-user-modal'); loadUsers(); }

// ===== EMAILS =====
let emailPage = 1;
async function loadEmails(page = 1) {
    emailPage = page;
    const search = document.getElementById('email-search')?.value || '';
    const folder = document.getElementById('email-folder-filter')?.value || '';
    const data = await apiFetch(`/admin/emails?page=${page}&limit=30&search=${encodeURIComponent(search)}&folder=${folder}`);
    if (!data) return;
    document.getElementById('emails-tbody').innerHTML = data.emails.map(e => `
        <tr class="border-b border-white/5">
            <td class="py-2 px-4 text-xs text-slate-400">${e.owner_email || '?'}</td>
            <td class="py-2 px-4 text-xs text-slate-300">${e.from_name || e.from_address || '?'}</td>
            <td class="py-2 px-4 text-sm text-slate-200 max-w-xs truncate">${e.subject || '(no subject)'}</td>
            <td class="py-2 px-4"><span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">${e.folder_type}</span></td>
            <td class="py-2 px-4 text-xs text-slate-500">${e.received_at ? new Date(e.received_at).toLocaleString() : ''}</td>
            <td class="py-2 px-4"><button class="toolbar-btn" title="Delete" onclick="deleteEmail('${e.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button></td>
        </tr>`).join('') || '<tr><td colspan="6" class="py-6 text-center text-slate-500">No emails found</td></tr>';
    const totalPages = Math.ceil(data.total / 30);
    document.getElementById('emails-pagination').innerHTML = `<span>Page ${data.page} of ${totalPages} (${data.total} total)</span><div class="flex gap-2">${data.page > 1 ? `<button class="btn-secondary text-xs" onclick="loadEmails(${data.page - 1})">← Prev</button>` : ''}${data.page < totalPages ? `<button class="btn-secondary text-xs" onclick="loadEmails(${data.page + 1})">Next →</button>` : ''}</div>`;
}
async function deleteEmail(id) { if (!confirm('Delete this email?')) return; await fetch(`${API}/admin/emails/${id}`, { method: 'DELETE', headers }); loadEmails(emailPage); }

// ===== ACCOUNTS =====
async function loadAccounts() {
    const data = await apiFetch('/admin/accounts');
    if (!data) return;
    document.getElementById('accounts-tbody').innerHTML = data.accounts.map(a => `
        <tr class="border-b border-white/5">
            <td class="py-2 px-4 text-xs text-slate-400">${a.owner_email || '?'}</td>
            <td class="py-2 px-4 text-xs text-slate-300 font-mono">${a.email}</td>
            <td class="py-2 px-4 text-xs text-slate-400">${a.label || '-'}</td>
            <td class="py-2 px-4 text-[10px] font-mono text-slate-500">${a.imap_host || '-'}:${a.imap_port || ''}</td>
            <td class="py-2 px-4 text-[10px] font-mono text-slate-500">${a.smtp_host || '-'}:${a.smtp_port || ''}</td>
            <td class="py-2 px-4 text-xs ${a.last_sync ? 'text-emerald-400' : 'text-slate-500'}">${a.last_sync ? new Date(a.last_sync).toLocaleString() : 'Never'}</td>
            <td class="py-2 px-4"><button class="toolbar-btn" title="Remove" onclick="removeAccount('${a.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button></td>
        </tr>`).join('') || '<tr><td colspan="7" class="py-6 text-center text-slate-500">No mail accounts</td></tr>';
}
async function removeAccount(id) { if (!confirm('Remove this mail account?')) return; await fetch(`${API}/admin/accounts/${id}`, { method: 'DELETE', headers }); loadAccounts(); }

// ===== SESSIONS =====
async function loadSessions() {
    const data = await apiFetch('/admin/sessions');
    if (!data) return;
    document.getElementById('sessions-tbody').innerHTML = data.sessions.map(s => `
        <tr class="border-b border-white/5">
            <td class="py-2 px-4 text-xs text-slate-300">${s.user_email || s.user_name || '?'}</td>
            <td class="py-2 px-4 text-xs text-slate-400">${s.device || 'Unknown'}</td>
            <td class="py-2 px-4 text-[10px] font-mono text-slate-500">${s.ip_address || '-'}</td>
            <td class="py-2 px-4 text-xs text-slate-500">${new Date(s.created_at).toLocaleString()}</td>
            <td class="py-2 px-4 text-xs text-slate-500">${s.expires_at ? new Date(s.expires_at).toLocaleString() : '-'}</td>
            <td class="py-2 px-4"><button class="toolbar-btn" title="Revoke" onclick="revokeSession('${s.id}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">block</span></button></td>
        </tr>`).join('') || '<tr><td colspan="6" class="py-6 text-center text-slate-500">No active sessions</td></tr>';
}
async function revokeSession(id) { await fetch(`${API}/admin/sessions/${id}`, { method: 'DELETE', headers }); loadSessions(); }

// ===== STORAGE =====
async function loadStorage() {
    const data = await apiFetch('/admin/storage');
    if (!data) return;
    document.getElementById('storage-total').textContent = formatBytes(data.totalStorage);
    document.getElementById('storage-db').textContent = formatBytes(data.dbSize);
    document.getElementById('storage-uploads').textContent = formatBytes(data.uploadsSize);
    document.getElementById('storage-tbody').innerHTML = data.users.map(u => {
        const pct = u.storage_limit ? Math.round(u.storage_used / u.storage_limit * 100) : 0;
        const color = pct > 90 ? 'bg-accent-red' : pct > 70 ? 'bg-yellow-400' : 'bg-emerald-400';
        return `<tr class="border-b border-white/5">
            <td class="py-2 px-4 text-xs text-slate-300">${u.name} <span class="text-slate-500">(${u.email})</span></td>
            <td class="py-2 px-4 text-xs font-mono text-slate-400">${formatBytes(u.storage_used)}</td>
            <td class="py-2 px-4 text-xs font-mono text-slate-400">${formatBytes(u.storage_limit)}</td>
            <td class="py-2 px-4"><div class="flex items-center gap-2"><div class="health-bar flex-1"><div class="health-bar-fill ${color}" style="width:${pct}%"></div></div><span class="text-[10px] font-mono text-slate-500">${pct}%</span></div></td>
            <td class="py-2 px-4 text-xs font-mono text-slate-500">${u.email_count || 0}</td>
            <td class="py-2 px-4 text-xs font-mono text-slate-500">${u.attachment_count || 0}</td>
            <td class="py-2 px-4"><select class="form-select-custom text-[10px]" onchange="updateStorage('${u.id}',this.value)"><option ${u.storage_limit == 5368709120 ? 'selected' : ''} value="5368709120">5 GB</option><option ${u.storage_limit == 10737418240 ? 'selected' : ''} value="10737418240">10 GB</option><option ${u.storage_limit == 15737418240 ? 'selected' : ''} value="15737418240">15 GB</option><option ${u.storage_limit == 53687091200 ? 'selected' : ''} value="53687091200">50 GB</option></select></td>
        </tr>`;
    }).join('') || '<tr><td colspan="7" class="py-6 text-center text-slate-500">No users</td></tr>';
}
async function updateStorage(userId, limit) { await fetch(`${API}/admin/storage/${userId}`, { method: 'PUT', headers, body: JSON.stringify({ storageLimit: parseInt(limit) }) }); }

// ===== LOGS =====
async function loadLogs() {
    const action = document.getElementById('log-action-filter')?.value || '';
    const data = await apiFetch(`/admin/logs?limit=200&action=${encodeURIComponent(action)}`);
    if (!data) return;
    document.getElementById('logs-tbody').innerHTML = data.logs.map(l => `
        <tr class="border-b border-white/5">
            <td class="py-2 px-4 text-xs text-slate-500 font-mono">${new Date(l.created_at).toLocaleString()}</td>
            <td class="py-2 px-4 text-xs text-slate-400">${l.user_email || 'System'}</td>
            <td class="py-2 px-4"><span class="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">${l.action}</span></td>
            <td class="py-2 px-4 text-xs text-slate-500 max-w-md truncate">${l.details || ''}</td>
        </tr>`).join('') || '<tr><td colspan="4" class="py-6 text-center text-slate-500">No logs</td></tr>';
}
async function clearLogs() { if (!confirm('Clear ALL audit logs?')) return; await fetch(`${API}/admin/logs/clear`, { method: 'DELETE', headers }); loadLogs(); }

// ===== SECURITY =====
async function loadSecurity() {
    const data = await apiFetch('/admin/blocked-senders');
    if (!data) return;
    document.getElementById('blocked-list').innerHTML = data.blocked.map(b => `
        <div class="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5">
            <div><span class="text-xs text-slate-300">${b.email}</span><span class="text-[10px] text-slate-500 ml-2">${b.reason}</span></div>
            <span class="text-[10px] font-mono text-slate-500">${new Date(b.created_at).toLocaleDateString()}</span>
        </div>`).join('') || '<p class="text-xs text-slate-500">No blocked senders</p>';
}
async function blockSender() {
    const email = document.getElementById('block-email').value; const reason = document.getElementById('block-reason').value;
    if (!email) return; await fetch(`${API}/admin/block-sender`, { method: 'POST', headers, body: JSON.stringify({ email, reason }) });
    document.getElementById('block-email').value = ''; document.getElementById('block-reason').value = ''; loadSecurity(); alert(`Blocked: ${email}`);
}

// ===== BROADCAST =====
async function sendBroadcast() {
    const subject = document.getElementById('broadcast-subject').value; const message = document.getElementById('broadcast-message').value;
    if (!subject || !message) { alert('Subject and message required'); return; }
    if (!confirm('Send this message to ALL users?')) return;
    const res = await fetch(`${API}/admin/broadcast`, { method: 'POST', headers, body: JSON.stringify({ subject, message }) });
    const d = await res.json(); alert(d.message || d.error);
    document.getElementById('broadcast-subject').value = ''; document.getElementById('broadcast-message').value = '';
}

// ===== DOMAINS =====
async function loadDomains() {
    const data = await apiFetch('/admin/domains');
    if (!data) return;
    document.getElementById('domains-list').innerHTML = data.domains.map(d => `
        <div class="flex items-center justify-between mb-2"><div><h4 class="text-sm font-bold text-slate-200">${d.domain}</h4><p class="text-[10px] text-slate-500 font-mono">Status: ${d.status}</p></div>
        <div class="flex gap-3">
            <span class="text-[10px] font-mono ${d.mx ? 'text-emerald-400' : 'text-slate-500'}">MX ${d.mx ? '✓' : '✗'}</span>
            <span class="text-[10px] font-mono ${d.spf ? 'text-emerald-400' : 'text-slate-500'}">SPF ${d.spf ? '✓' : '✗'}</span>
            <span class="text-[10px] font-mono ${d.dkim ? 'text-emerald-400' : 'text-slate-500'}">DKIM ${d.dkim ? '✓' : '✗'}</span>
            <span class="text-[10px] font-mono ${d.dmarc ? 'text-emerald-400' : 'text-slate-500'}">DMARC ${d.dmarc ? '✓' : '✗'}</span>
        </div></div>`).join('');
    document.getElementById('dns-tbody').innerHTML = data.dnsRecords.map(r => {
        const color = r.status === 'active' ? 'text-emerald-400' : r.status === 'pending' ? 'text-yellow-400' : 'text-slate-500';
        return `<tr class="border-b border-white/5">
            <td class="py-2 px-3"><span class="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-primary">${r.type}</span></td>
            <td class="py-2 px-3 text-xs font-mono text-slate-400">${r.host}</td>
            <td class="py-2 px-3 text-xs font-mono text-slate-500 max-w-xs truncate">${r.value}</td>
            <td class="py-2 px-3 text-[10px] font-mono ${color}">${r.status}</td>
        </tr>`;
    }).join('');
}

// ===== HEALTH =====
async function loadHealth() {
    const data = await apiFetch('/admin/health');
    if (!data) return;
    const memPct = Math.round(data.memory.heapUsed / data.memory.heapTotal * 100);
    const sysPct = Math.round((data.system.totalMem - data.system.freeMem) / data.system.totalMem * 100);
    const memColor = memPct > 85 ? 'bg-accent-red' : memPct > 60 ? 'bg-yellow-400' : 'bg-emerald-400';
    const sysColor = sysPct > 85 ? 'bg-accent-red' : sysPct > 60 ? 'bg-yellow-400' : 'bg-emerald-400';
    document.getElementById('health-content').innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="settings-card"><p class="text-xs text-slate-500 font-mono mb-1">UPTIME</p><p class="text-2xl font-bold text-emerald-400">${data.server.uptimeStr}</p><p class="text-[10px] text-slate-500 mt-1">Node ${data.server.nodeVersion}</p></div>
            <div class="settings-card"><p class="text-xs text-slate-500 font-mono mb-1">PLATFORM</p><p class="text-lg font-bold text-slate-200">${data.server.platform} (${data.server.arch})</p><p class="text-[10px] text-slate-500 mt-1">${data.server.hostname}</p></div>
            <div class="settings-card"><p class="text-xs text-slate-500 font-mono mb-1">DATABASE</p><p class="text-lg font-bold text-blue-400">Supabase (PostgreSQL)</p><p class="text-[10px] text-slate-500 mt-1">Port ${data.env.port} · ${data.env.nodeEnv}</p></div>
        </div>
        <div class="settings-card"><h4 class="text-sm font-bold text-slate-300 dot-matrix mb-4">MEMORY</h4>
            <div class="mb-3"><div class="flex justify-between text-xs text-slate-400 mb-1"><span>Heap (Node.js)</span><span>${formatBytes(data.memory.heapUsed)} / ${formatBytes(data.memory.heapTotal)}</span></div><div class="health-bar"><div class="health-bar-fill ${memColor}" style="width:${memPct}%"></div></div></div>
            <div><div class="flex justify-between text-xs text-slate-400 mb-1"><span>System RAM</span><span>${formatBytes(data.system.totalMem - data.system.freeMem)} / ${formatBytes(data.system.totalMem)}</span></div><div class="health-bar"><div class="health-bar-fill ${sysColor}" style="width:${sysPct}%"></div></div></div>
            <div class="grid grid-cols-3 gap-4 mt-4"><div><p class="text-[10px] text-slate-500 font-mono">RSS</p><p class="text-sm font-bold text-slate-300">${formatBytes(data.memory.rss)}</p></div><div><p class="text-[10px] text-slate-500 font-mono">EXTERNAL</p><p class="text-sm font-bold text-slate-300">${formatBytes(data.memory.external)}</p></div><div><p class="text-[10px] text-slate-500 font-mono">CPUs</p><p class="text-sm font-bold text-slate-300">${data.system.cpus}</p></div></div>
        </div>
        <div class="settings-card"><h4 class="text-sm font-bold text-slate-300 dot-matrix mb-4">DATABASE TABLES</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">${Object.entries(data.database.tables).map(([t, c]) =>
        `<div class="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-white/5"><span class="text-xs text-slate-400">${t}</span><span class="text-xs font-mono font-bold text-slate-200">${c}</span></div>`
    ).join('')}</div>
        </div>`;
}

// ===== SUBSCRIPTIONS & PLANS =====
let allPlans = [];
async function loadSubscriptions() {
    const [plansData, subsData] = await Promise.all([apiFetch('/admin/plans'), apiFetch('/admin/subscriptions')]);
    if (!plansData || !subsData) return;
    allPlans = plansData.plans;
    const planColors = ['from-slate-500/20 to-slate-600/10 border-slate-500/20', 'from-primary/20 to-primary/10 border-primary/30', 'from-purple-500/20 to-purple-600/10 border-purple-500/20'];
    document.getElementById('plans-grid').innerHTML = plansData.plans.length ? plansData.plans.map((p, i) => `
        <div class="settings-card bg-gradient-to-br ${planColors[i] || planColors[0]} border">
            <div class="flex items-center justify-between mb-2"><h4 class="text-sm font-bold text-slate-200">${p.name}</h4><span class="text-lg font-bold text-primary">$${p.price_monthly}/mo</span></div>
            <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                <div>📦 ${p.max_storage_mb || 0} MB</div><div>📧 ${p.max_emails_per_day || 0}/day</div>
                <div>🔑 ${p.max_api_calls_per_hour || 0}/hr API</div><div>👤 ${p.max_accounts || 0} accounts</div>
            </div>
        </div>`).join('') : '<div class="col-span-3 settings-card text-center text-sm text-slate-500 py-8">No plans configured yet. Create plans in the Supabase dashboard.</div>';
    document.getElementById('subs-tbody').innerHTML = subsData.subscriptions.map(s => `
        <tr class="border-b border-white/5">
            <td class="py-2 px-4 text-xs text-slate-300">${s.users?.name || '?'} <span class="text-slate-500">(${s.users?.email || '?'})</span></td>
            <td class="py-2 px-4"><span class="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">${s.plans?.name || '?'}</span></td>
            <td class="py-2 px-4 text-xs font-mono text-slate-400">$${s.plans?.price_monthly || 0}/mo</td>
            <td class="py-2 px-4"><span class="text-[10px] font-mono ${s.status === 'active' ? 'text-emerald-400' : 'text-yellow-400'}">${s.status}</span></td>
            <td class="py-2 px-4">${allPlans.length ? `<select class="form-select-custom text-[10px]" onchange="changePlan('${s.user_id}',this.value)">${allPlans.map(p => `<option value="${p.id}" ${p.id === s.plan_id ? 'selected' : ''}>${p.name}</option>`).join('')}</select>` : '-'}</td>
        </tr>`).join('') || '<tr><td colspan="5" class="py-6 text-center text-slate-500">No subscriptions</td></tr>';
}
async function changePlan(userId, planId) { await fetch(`${API}/admin/subscriptions/${userId}/plan`, { method: 'PUT', headers, body: JSON.stringify({ planId }) }); alert('Plan updated!'); }

// ===== CAMPAIGNS =====
async function loadCampaigns() {
    const data = await apiFetch('/admin/campaigns');
    if (!data) return;
    const s = data.stats;
    document.getElementById('campaign-stats').innerHTML = `
        <div class="stat-card settings-card flex flex-col gap-2"><div class="flex items-center justify-between"><span class="material-symbols-outlined text-primary text-2xl">rocket_launch</span><span class="text-2xl font-bold">${s.totalCampaigns}</span></div><p class="text-xs text-slate-500">Total Campaigns</p></div>
        <div class="stat-card settings-card flex flex-col gap-2"><div class="flex items-center justify-between"><span class="material-symbols-outlined text-emerald-400 text-2xl">play_circle</span><span class="text-2xl font-bold">${s.activeCampaigns}</span></div><p class="text-xs text-slate-500">Active Sending</p></div>
        <div class="stat-card settings-card flex flex-col gap-2"><div class="flex items-center justify-between"><span class="material-symbols-outlined text-blue-400 text-2xl">group</span><span class="text-2xl font-bold">${s.totalSubscribers}</span></div><p class="text-xs text-slate-500">Total Subscribers</p></div>
        <div class="stat-card settings-card flex flex-col gap-2"><div class="flex items-center justify-between"><span class="material-symbols-outlined text-purple-400 text-2xl">list</span><span class="text-2xl font-bold">${s.totalLists}</span></div><p class="text-xs text-slate-500">Subscriber Lists</p></div>`;
    const statusColors = { draft: 'text-slate-400 bg-white/5', sending: 'text-emerald-400 bg-emerald-400/10', completed: 'text-blue-400 bg-blue-400/10', paused: 'text-yellow-400 bg-yellow-400/10', failed: 'text-accent-red bg-accent-red/10' };
    document.getElementById('campaigns-tbody').innerHTML = data.campaigns.map(c => `
        <tr class="border-b border-white/5">
            <td class="py-2 px-4 text-xs text-slate-400">${c.users?.name || '?'}</td>
            <td class="py-2 px-4 text-sm text-slate-200">${c.name}</td>
            <td class="py-2 px-4"><span class="text-[10px] font-mono px-2 py-0.5 rounded ${statusColors[c.status] || 'text-slate-400 bg-white/5'}">${c.status}</span></td>
            <td class="py-2 px-4 text-xs font-mono text-slate-400">${c.sent_count || 0}/${c.total_recipients || 0}</td>
            <td class="py-2 px-4 text-xs font-mono text-emerald-400">${c.open_count || 0}</td>
            <td class="py-2 px-4 text-xs font-mono text-blue-400">${c.click_count || 0}</td>
            <td class="py-2 px-4 text-xs text-slate-500">${new Date(c.created_at).toLocaleDateString()}</td>
            <td class="py-2 px-4"><div class="flex gap-1">
                ${c.status === 'sending' ? `<button class="toolbar-btn" title="Pause" onclick="pauseCampaign('${c.id}')"><span class="material-symbols-outlined text-sm text-yellow-400">pause</span></button>` : ''}
                <button class="toolbar-btn" title="Delete" onclick="deleteCampaign('${c.id}','${(c.name||'').replace(/'/g,"\\'")}')"><span class="material-symbols-outlined text-sm" style="color:rgba(255,59,48,0.7)">delete</span></button>
            </div></td>
        </tr>`).join('') || '<tr><td colspan="8" class="py-6 text-center text-slate-500">No campaigns</td></tr>';
}
async function pauseCampaign(id) { await fetch(`${API}/admin/campaigns/${id}/pause`, { method: 'PUT', headers }); loadCampaigns(); }
async function deleteCampaign(id, name) { if (!confirm(`Delete campaign "${name}"?`)) return; await fetch(`${API}/admin/campaigns/${id}`, { method: 'DELETE', headers }); loadCampaigns(); }

// ===== LOGIN HISTORY =====
async function loadLoginHistory() {
    const status = document.getElementById('login-status-filter')?.value || '';
    const data = await apiFetch(`/admin/login-history?limit=100&status=${status}`);
    if (!data) return;
    document.getElementById('logins-tbody').innerHTML = data.history.map(h => `
        <tr class="border-b border-white/5">
            <td class="py-2 px-4 text-xs text-slate-300">${h.users?.name || '?'} <span class="text-slate-500">(${h.users?.email || '?'})</span></td>
            <td class="py-2 px-4 text-[10px] font-mono text-slate-500">${h.ip_address || '-'}</td>
            <td class="py-2 px-4 text-xs text-slate-400">${h.device || (h.user_agent ? h.user_agent.substring(0, 40) : '-')}</td>
            <td class="py-2 px-4 text-xs text-slate-500">${h.location || '-'}</td>
            <td class="py-2 px-4"><span class="text-[10px] font-mono px-2 py-0.5 rounded ${h.status === 'success' ? 'text-emerald-400 bg-emerald-400/10' : 'text-accent-red bg-accent-red/10'}">${h.status}</span></td>
            <td class="py-2 px-4 text-xs text-slate-500 font-mono">${new Date(h.created_at).toLocaleString()}</td>
        </tr>`).join('') || '<tr><td colspan="6" class="py-6 text-center text-slate-500">No login history</td></tr>';
}

// ===== SYSTEM SETTINGS =====
async function loadSettings() {
    const data = await apiFetch('/admin/settings');
    if (!data) return;
    const s = data.settings;
    document.getElementById('set-platform-name').value = s.platformName || '';
    document.getElementById('set-maintenance').checked = s.maintenanceMode;
    document.getElementById('set-registration').checked = s.registrationEnabled;
    document.getElementById('set-smtp-rate').value = s.smtpRateLimit;
    document.getElementById('set-session-timeout').value = s.sessionTimeout;
}
async function saveSettings() {
    const body = {
        platformName: document.getElementById('set-platform-name').value,
        maintenanceMode: document.getElementById('set-maintenance').checked,
        registrationEnabled: document.getElementById('set-registration').checked,
        smtpRateLimit: parseInt(document.getElementById('set-smtp-rate').value),
        sessionTimeout: parseInt(document.getElementById('set-session-timeout').value)
    };
    const res = await fetch(`${API}/admin/settings`, { method: 'PUT', headers, body: JSON.stringify(body) });
    const d = await res.json();
    alert(d.message || 'Settings saved!');
}

// ===== INIT =====
async function init() {
    const res = await fetch(`${API}/admin/stats`, { headers });
    if (res.status === 403) {
        const br = await fetch(`${API}/admin/bootstrap`, { method: 'POST', headers });
        const bd = await br.json();
        if (br.ok) { alert('You have been made admin! ' + bd.message); loadStats(); }
        else { alert('Admin access denied: ' + (bd.error || 'Contact admin')); }
    } else {
        const data = await res.json();
        const s = data.stats;
        document.getElementById('stat-users').textContent = s.totalUsers;
        document.getElementById('stat-emails').textContent = s.totalEmails;
        document.getElementById('stat-active').textContent = s.activeToday;
        document.getElementById('stat-spam').textContent = s.spamBlocked;
        document.getElementById('stat-sent').textContent = s.emailsSentToday;
        document.getElementById('stat-recv').textContent = s.emailsReceivedToday;
        document.getElementById('stat-accounts').textContent = s.totalAccounts;
        document.getElementById('stat-contacts').textContent = s.totalContacts;
        document.getElementById('stat-sessions').textContent = s.activeSessions;
        document.getElementById('stat-attachments').textContent = s.totalAttachments;
        document.getElementById('count-users').textContent = s.totalUsers;
        document.getElementById('count-emails').textContent = s.totalEmails;
    }
}
init();
