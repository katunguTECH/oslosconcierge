const axios = require('axios');

// ---- Email via Brevo HTTP API (works on Render free tier) ----
async function sendEmailCode(to, code) {
  const url = 'https://api.brevo.com/v3/smtp/email';
  const headers = {
    'api-key': process.env.BREVO_SMS_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const htmlContent = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0B0B0F;color:#fff;padding:32px;border-radius:12px;">
      <h1 style="color:#D4AF37;font-size:22px;margin:0 0 8px;">Oslo's Concierge</h1>
      <p style="color:#aaa;font-size:13px;margin:0 0 24px;">Email verification</p>
      <p>Use this code to verify your email:</p>
      <div style="background:#16161C;border:1px solid #26262E;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
        <span style="font-size:32px;letter-spacing:8px;color:#D4AF37;font-weight:700;">${code}</span>
      </div>
      <p style="color:#888;font-size:13px;">This code expires in 15 minutes. If you didn't request it, ignore this email.</p>
    </div>
  `;

  const body = {
    sender: { name: "Oslo's Concierge", email: process.env.BREVO_SMTP_USER },
    to: [{ email: to }],
    subject: `Your Oslo verification code: ${code}`,
    htmlContent,
  };

  await axios.post(url, body, { headers });
}

// ---- SMS via Brevo HTTP API ----
async function sendSmsCode(to, code) {
  const url = 'https://api.brevo.com/v3/transactionalSMS/send';
  const headers = {
    'api-key': process.env.BREVO_SMS_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const body = {
    sender: 'OsloConcierge',
    recipient: to,
    content: `Oslo's Concierge verification code: ${code}. Expires in 15 minutes.`,
    type: 'transactional',
  };

  await axios.post(url, body, { headers });
}

module.exports = { sendEmailCode, sendSmsCode };
