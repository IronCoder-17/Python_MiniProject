// controllers/templatesController.js
// Phase 2: manageable WhatsApp & Email templates, and real email sending.
const pool = require('../config/db');
const mailer = require('../utils/mailer');

const TABLES = { lead: 'leads', inquiry: 'inquiries' };

// Fill {name}, {property}, {city}, {budget}, {executive_name} placeholders
function renderTemplate(str, record, executiveName) {
  if (!str) return str;
  return str
    .replace(/{name}/g,          record.full_name || '')
    .replace(/{property}/g,      record.property_title || record.property_type || 'the property')
    .replace(/{city}/g,          record.city || record.property_city || '')
    .replace(/{budget}/g,        record.budget || '')
    .replace(/{executive_name}/g, executiveName || 'Our Team');
}

// ── WhatsApp Templates CRUD ──────────────────────────────────
exports.listWhatsappTemplates = async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM whatsapp_templates WHERE is_active=1 ORDER BY sort_order ASC, id ASC');
  res.json({ data: rows });
};

exports.createWhatsappTemplate = async (req, res) => {
  const { name, message, sort_order } = req.body;
  if (!name || !message) return res.status(400).json({ error: 'name and message are required' });
  const [result] = await pool.query(
    'INSERT INTO whatsapp_templates (name, message, sort_order) VALUES (?,?,?)',
    [name, message, sort_order || 0]
  );
  res.status(201).json({ id: result.insertId, message: 'Template created' });
};

exports.updateWhatsappTemplate = async (req, res) => {
  const { name, message, sort_order, is_active } = req.body;
  await pool.query(
    'UPDATE whatsapp_templates SET name=COALESCE(?,name), message=COALESCE(?,message), sort_order=COALESCE(?,sort_order), is_active=COALESCE(?,is_active) WHERE id=?',
    [name, message, sort_order, is_active, req.params.id]
  );
  res.json({ message: 'Template updated' });
};

exports.deleteWhatsappTemplate = async (req, res) => {
  await pool.query('UPDATE whatsapp_templates SET is_active=0 WHERE id=?', [req.params.id]);
  res.json({ message: 'Template removed' });
};

// ── Email Templates CRUD ─────────────────────────────────────
exports.listEmailTemplates = async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM email_templates WHERE is_active=1 ORDER BY sort_order ASC, id ASC');
  res.json({ data: rows });
};

exports.createEmailTemplate = async (req, res) => {
  const { name, subject, body, sort_order } = req.body;
  if (!name || !subject || !body) return res.status(400).json({ error: 'name, subject and body are required' });
  const [result] = await pool.query(
    'INSERT INTO email_templates (name, subject, body, sort_order) VALUES (?,?,?,?)',
    [name, subject, body, sort_order || 0]
  );
  res.status(201).json({ id: result.insertId, message: 'Template created' });
};

exports.updateEmailTemplate = async (req, res) => {
  const { name, subject, body, sort_order, is_active } = req.body;
  await pool.query(
    'UPDATE email_templates SET name=COALESCE(?,name), subject=COALESCE(?,subject), body=COALESCE(?,body), sort_order=COALESCE(?,sort_order), is_active=COALESCE(?,is_active) WHERE id=?',
    [name, subject, body, sort_order, is_active, req.params.id]
  );
  res.json({ message: 'Template updated' });
};

exports.deleteEmailTemplate = async (req, res) => {
  await pool.query('UPDATE email_templates SET is_active=0 WHERE id=?', [req.params.id]);
  res.json({ message: 'Template removed' });
};

// ── SMTP status (for the frontend to know whether to try real send or fall back to mailto:) ──
exports.emailStatus = async (_req, res) => {
  res.json({ configured: mailer.isConfigured() });
};

// ── Send an actual email through SMTP, rendering a template against a lead/inquiry ──
// POST /api/templates/send-email/:entityType/:id
exports.sendEmail = async (req, res) => {
  const { entityType, id } = req.params;
  const table = TABLES[entityType];
  if (!table) return res.status(400).json({ error: "entity_type must be 'lead' or 'inquiry'" });

  const { template_id, subject: customSubject, body: customBody } = req.body;

  const selectExtra = entityType === 'inquiry'
    ? `, i.property_id, p.title AS property_title, p.city AS property_city`
    : '';
  const joinExtra = entityType === 'inquiry' ? 'LEFT JOIN properties p ON p.id = i.property_id' : '';
  const alias = entityType === 'inquiry' ? 'i' : 'l';

  const [[record]] = await pool.query(
    `SELECT ${alias}.* ${selectExtra} FROM ${table} ${alias} ${joinExtra} WHERE ${alias}.id=?`,
    [id]
  );
  if (!record) return res.status(404).json({ error: 'Not found' });
  if (!record.email) return res.status(400).json({ error: 'This customer has no email on file' });

  let subject = customSubject;
  let body = customBody;
  if (template_id) {
    const [[tpl]] = await pool.query('SELECT * FROM email_templates WHERE id=?', [template_id]);
    if (!tpl) return res.status(404).json({ error: 'Template not found' });
    subject = tpl.subject;
    body = tpl.body;
  }
  if (!subject || !body) return res.status(400).json({ error: 'subject and body (or template_id) are required' });

  subject = renderTemplate(subject, record, req.user.name);
  body    = renderTemplate(body, record, req.user.name);

  await mailer.sendMail({ to: record.email, subject, text: body });

  await pool.query(`UPDATE ${table} SET last_contact_date = NOW() WHERE id=?`, [id]);
  await pool.query(
    `INSERT INTO crm_activity (entity_type, entity_id, activity_type, description, admin_id) VALUES (?,?,?,?,?)`,
    [entityType, id, 'Emailed', subject, req.user.id]
  );

  res.json({ message: 'Email sent', subject, body });
};
