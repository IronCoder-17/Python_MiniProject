// utils/mailer.js — SMTP transport for the CRM "Send Email" feature.
// Reads SMTP_* from .env. If not configured, isConfigured() returns false
// and callers should fall back to a client-side mailto: link instead.
const nodemailer = require('nodemailer');

let transporter = null;

function isConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getTransporter() {
  if (!isConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, text }) {
  const t = getTransporter();
  if (!t) {
    const err = new Error('SMTP is not configured on the server (see .env.example)');
    err.status = 501;
    throw err;
  }
  const fromName  = process.env.SMTP_FROM_NAME  || 'Iconic Estates India';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  await t.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text,
  });
}

module.exports = { isConfigured, sendMail };
