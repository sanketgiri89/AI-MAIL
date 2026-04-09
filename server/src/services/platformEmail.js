// ===== Platform Email Service (Hostinger SMTP) =====
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    transporter = nodemailer.createTransport({
        host: process.env.PLATFORM_SMTP_HOST || 'smtp.hostinger.com',
        port: parseInt(process.env.PLATFORM_SMTP_PORT || '465'),
        secure: true,
        auth: {
            user: process.env.PLATFORM_SMTP_USER,
            pass: process.env.PLATFORM_SMTP_PASS
        }
    });
    return transporter;
}

async function sendPasswordResetEmail(toEmail, resetToken, userName) {
    const baseUrl = process.env.APP_DOMAIN || process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetLink = `${baseUrl}/forgot-password?token=${resetToken}`;
    const t = getTransporter();

    await t.sendMail({
        from: process.env.PLATFORM_SMTP_FROM || '"Eclatrecon AI Mail" <ceo@llmx.in>',
        to: toEmail,
        subject: 'Reset Your Password — Eclatrecon AI Mail',
        text: `Hi ${userName || 'there'},\n\nYou requested a password reset.\n\nClick this link to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.\n\n— Eclatrecon AI Mail`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0f;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellspacing="0" cellpadding="0" style="background:#111118;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#ec5b13 0%,#ff8a50 100%);padding:30px 40px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:1px;">ECLATRECON AI MAIL</h1>
</td></tr>
<tr><td style="padding:40px;">
<h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Password Reset</h2>
<p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 24px;">Hi <strong style="color:#ccc">${userName || 'there'}</strong>, we received a request to reset your password.</p>
<a href="${resetLink}" style="display:inline-block;background:#ec5b13;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.5px;">Reset Password</a>
<p style="color:#555;font-size:12px;margin-top:24px;line-height:1.5;">This link expires in <strong>1 hour</strong>.<br>If you didn't request this, you can safely ignore this email.</p>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
<p style="color:#444;font-size:11px;margin:0;">© ${new Date().getFullYear()} Eclatrecon AI Mail · llmx.in</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
    });
}

async function sendWelcomeEmail(toEmail, userName) {
    const t = getTransporter();
    await t.sendMail({
        from: process.env.PLATFORM_SMTP_FROM || '"Eclatrecon AI Mail" <ceo@llmx.in>',
        to: toEmail,
        subject: 'Welcome to Eclatrecon AI Mail 🚀',
        text: `Hi ${userName},\n\nWelcome to Eclatrecon AI Mail! Your account has been created.\n\nGet started by connecting your email account in Settings.\n\n— Eclatrecon AI Mail`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,sans-serif;">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0f;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellspacing="0" cellpadding="0" style="background:#111118;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
<tr><td style="background:linear-gradient(135deg,#ec5b13 0%,#ff8a50 100%);padding:24px 40px;text-align:center;">
<h1 style="color:#fff;margin:0;font-size:20px;">Welcome to ECLATRECON AI MAIL 🚀</h1>
</td></tr>
<tr><td style="padding:36px 40px;">
<p style="color:#ccc;font-size:15px;line-height:1.7;margin:0 0 20px;">Hi <strong>${userName}</strong>,</p>
<p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 20px;">Your account is ready! Connect your email account in Settings to get started.</p>
<a href="${process.env.APP_DOMAIN || 'https://llmx.in'}/app" style="display:inline-block;background:#ec5b13;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Open App</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
    });
}

module.exports = { sendPasswordResetEmail, sendWelcomeEmail, getTransporter };
