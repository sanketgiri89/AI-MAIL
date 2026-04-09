// ===== Eclatrecon AI Mail - Auth Routes (Supabase) =====
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/initDb');
const { authMiddleware } = require('../middleware/auth');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../services/platformEmail');
const crypto = require('crypto');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, displayName } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const passwordHash = await bcrypt.hash(password, 12);
        const userId = uuidv4();

        await supabase.from('users').insert({
            id: userId, email, password_hash: passwordHash, name, display_name: displayName || name
        });

        // Create default folders
        const defaultFolders = [
            { name: 'Inbox', type: 'inbox', icon: 'inbox', sort_order: 0 },
            { name: 'Sent', type: 'sent', icon: 'send', sort_order: 1 },
            { name: 'Drafts', type: 'drafts', icon: 'drafts', sort_order: 2 },
            { name: 'Spam', type: 'spam', icon: 'report', sort_order: 3 },
            { name: 'Trash', type: 'trash', icon: 'delete', sort_order: 4 }
        ];
        await supabase.from('folders').insert(defaultFolders.map(f => ({
            id: uuidv4(), user_id: userId, ...f
        })));

        // Create default labels
        const defaultLabels = [
            { name: 'High Priority', color: '#ff3b30' },
            { name: 'Newsletters', color: '#3b82f6' },
            { name: 'Work', color: '#10b981' }
        ];
        await supabase.from('labels').insert(defaultLabels.map(l => ({
            id: uuidv4(), user_id: userId, ...l
        })));

        const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: userId, action: 'signup', details: 'Account created' });

        // Send welcome email (non-blocking)
        sendWelcomeEmail(email, name).catch(e => console.error('Welcome email error:', e.message));

        res.status(201).json({ token, user: { id: userId, email, name, displayName: displayName || name, is_admin: false } });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password, totpCode } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        // Check 2FA
        if (user.totp_enabled) {
            if (!totpCode) return res.status(200).json({ requires2FA: true });
            const verified = speakeasy.totp.verify({ secret: user.totp_secret, encoding: 'base32', token: totpCode });
            if (!verified) return res.status(401).json({ error: 'Invalid 2FA code' });
        }

        const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

        // Save session
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('sessions').insert({
            id: sessionId, user_id: user.id, token, device: req.headers['user-agent'] || 'Unknown', expires_at: expiresAt
        });

        await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: user.id, action: 'login', details: 'User logged in' });

        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, displayName: user.display_name, avatar: user.avatar, is_admin: user.is_admin || false }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Always return success to prevent email enumeration
        const { data: user } = await supabase.from('users').select('id, name, email').eq('email', email).single();
        if (!user) return res.json({ message: 'If the email exists, a reset link has been sent.' });

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

        // Delete old tokens for this user
        await supabase.from('password_resets').delete().eq('user_id', user.id);

        // Save token
        await supabase.from('password_resets').insert({
            id: uuidv4(), user_id: user.id, token: resetToken, expires_at: expiresAt
        });

        // Send email
        await sendPasswordResetEmail(user.email, resetToken, user.name);
        await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: user.id, action: 'password_reset_requested', details: 'Reset email sent' });

        res.json({ message: 'If the email exists, a reset link has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.json({ message: 'If the email exists, a reset link has been sent.' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
        if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be 6+ characters' });

        const { data: reset } = await supabase.from('password_resets').select('*').eq('token', token).single();
        if (!reset) return res.status(400).json({ error: 'Invalid or expired reset link' });
        if (new Date(reset.expires_at) < new Date()) {
            await supabase.from('password_resets').delete().eq('id', reset.id);
            return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await supabase.from('users').update({ password_hash: passwordHash, updated_at: new Date().toISOString() }).eq('id', reset.user_id);

        // Delete used token
        await supabase.from('password_resets').delete().eq('id', reset.id);
        // Revoke all sessions for security
        await supabase.from('sessions').delete().eq('user_id', reset.user_id);

        await supabase.from('audit_logs').insert({ id: uuidv4(), user_id: reset.user_id, action: 'password_reset', details: 'Password reset completed' });

        res.json({ message: 'Password reset successfully. Please log in with your new password.' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
    const { data: user } = await supabase.from('users')
        .select('id, email, name, display_name, avatar, phone, location, job_title, timezone, language, theme, totp_enabled, storage_used, storage_limit, is_admin, created_at')
        .eq('id', req.userId).single();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
});

// PUT /api/auth/profile
router.put('/profile', authMiddleware, async (req, res) => {
    const { name, displayName, phone, location, jobTitle, timezone, language, theme } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (displayName) updates.display_name = displayName;
    if (phone) updates.phone = phone;
    if (location) updates.location = location;
    if (jobTitle) updates.job_title = jobTitle;
    if (timezone) updates.timezone = timezone;
    if (language) updates.language = language;
    if (theme) updates.theme = theme;
    updates.updated_at = new Date().toISOString();
    await supabase.from('users').update(updates).eq('id', req.userId);
    res.json({ message: 'Profile updated' });
});

// PUT /api/auth/password
router.put('/password', authMiddleware, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.userId).single();
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is wrong' });
    const newHash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password_hash: newHash, updated_at: new Date().toISOString() }).eq('id', req.userId);
    res.json({ message: 'Password updated' });
});

// POST /api/auth/2fa/setup
router.post('/2fa/setup', authMiddleware, async (req, res) => {
    const secret = speakeasy.generateSecret({ name: 'Eclatrecon AI Mail', issuer: 'EclatreconAIMail' });
    await supabase.from('users').update({ totp_secret: secret.base32 }).eq('id', req.userId);
    QRCode.toDataURL(secret.otpauth_url, (err, qr) => {
        res.json({ secret: secret.base32, qrCode: qr });
    });
});

// POST /api/auth/2fa/verify
router.post('/2fa/verify', authMiddleware, async (req, res) => {
    const { code } = req.body;
    const { data: user } = await supabase.from('users').select('totp_secret').eq('id', req.userId).single();
    const verified = speakeasy.totp.verify({ secret: user.totp_secret, encoding: 'base32', token: code });
    if (verified) {
        await supabase.from('users').update({ totp_enabled: true }).eq('id', req.userId);
        res.json({ message: '2FA enabled' });
    } else {
        res.status(400).json({ error: 'Invalid code' });
    }
});

// GET /api/auth/sessions
router.get('/sessions', authMiddleware, async (req, res) => {
    const { data: sessions } = await supabase.from('sessions')
        .select('id, device, ip_address, created_at, expires_at')
        .eq('user_id', req.userId).order('created_at', { ascending: false });
    res.json({ sessions: sessions || [] });
});

// DELETE /api/auth/sessions/:id
router.delete('/sessions/:id', authMiddleware, async (req, res) => {
    await supabase.from('sessions').delete().eq('id', req.params.id).eq('user_id', req.userId);
    res.json({ message: 'Session revoked' });
});

module.exports = router;
