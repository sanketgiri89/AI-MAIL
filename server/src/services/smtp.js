// ===== Eclatrecon AI Mail - SMTP Service =====
const nodemailer = require('nodemailer');

async function sendEmail({ host, port, user, pass, encryption, from, to, cc, bcc, subject, text, html, inReplyTo, attachments = [] }) {
    const transportConfig = {
        host,
        port: parseInt(port),
        secure: encryption === 'SSL' || parseInt(port) === 465,
        auth: { user, pass }
    };

    if (encryption === 'TLS') {
        transportConfig.tls = { rejectUnauthorized: false };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
        from, to, subject,
        text: text || '',
        html: html || text || '',
        // Minimal headers for personal emails — no bulk indicators
        headers: {
            'X-Mailer': 'Eclatrecon AI Mail 1.0',
            'MIME-Version': '1.0'
        },
        priority: 'normal'
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;
    if (inReplyTo) {
        mailOptions.inReplyTo = inReplyTo;
        mailOptions.references = inReplyTo;
    }
    if (attachments.length > 0) {
        mailOptions.attachments = attachments.map(a => ({
            filename: a.filename,
            path: a.path
        }));
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent: ${result.messageId}`);
    return result;
}

async function verifySmtp({ host, port, user, pass, encryption }) {
    try {
        const transporter = nodemailer.createTransport({
            host, port: parseInt(port),
            secure: encryption === 'SSL' || parseInt(port) === 465,
            auth: { user, pass },
            tls: { rejectUnauthorized: false }
        });
        await transporter.verify();
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = { sendEmail, verifySmtp };
