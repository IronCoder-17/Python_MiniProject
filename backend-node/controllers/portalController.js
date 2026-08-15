// controllers/portalController.js — Phase 5: Customer Portal
const pool = require('../config/db');
const fs   = require('fs');

function normalizeMobile(m) { return (m || '').replace(/\D/g, '').slice(-10); }

async function ownsRecord(mobile, entityType, entityId) {
  const table = entityType === 'lead' ? 'leads' : 'inquiries';
  const [[row]] = await pool.query(
    `SELECT id, mobile_number FROM ${table} WHERE id=?`, [entityId]
  );
  return row && normalizeMobile(row.mobile_number) === mobile;
}

// GET /api/portal/me — every lead/inquiry tied to this mobile number
exports.myRecords = async (req, res) => {
  const mobile = req.customer.mobile;
  const [leads] = await pool.query(
    `SELECT l.*, u.name AS assigned_to_name, u.email AS assigned_to_email, 'lead' AS entity_type
     FROM leads l LEFT JOIN users u ON u.id = l.assigned_to
     WHERE l.mobile_number LIKE ? ORDER BY l.created_at DESC`,
    [`%${mobile}`]
  );
  const [inquiries] = await pool.query(
    `SELECT i.*, p.title AS property_title, p.city AS property_city, p.hero_image, p.brochure_url,
        u.name AS assigned_to_name, u.email AS assigned_to_email, 'inquiry' AS entity_type
     FROM inquiries i
     LEFT JOIN properties p ON p.id = i.property_id
     LEFT JOIN users u ON u.id = i.assigned_to
     WHERE i.mobile_number LIKE ? ORDER BY i.created_at DESC`,
    [`%${mobile}`]
  );
  res.json({ data: [...leads, ...inquiries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) });
};

// GET /api/portal/:entityType/:id — detail + site visits (must belong to this customer)
exports.getRecord = async (req, res) => {
  const { entityType, id } = req.params;
  if (!(await ownsRecord(req.customer.mobile, entityType, id))) return res.status(403).json({ error: 'Not your record' });

  const table = entityType === 'lead' ? 'leads' : 'inquiries';
  const selectExtra = entityType === 'inquiry' ? `, p.title AS property_title, p.city AS property_city, p.hero_image, p.brochure_url, p.price_label` : '';
  const joinExtra = entityType === 'inquiry' ? 'LEFT JOIN properties p ON p.id = i.property_id' : '';
  const alias = entityType === 'inquiry' ? 'i' : 'l';

  const [[record]] = await pool.query(
    `SELECT ${alias}.*, u.name AS assigned_to_name, u.email AS assigned_to_email ${selectExtra}
     FROM ${table} ${alias} LEFT JOIN users u ON u.id = ${alias}.assigned_to ${joinExtra}
     WHERE ${alias}.id=?`,
    [id]
  );

  const [visits] = await pool.query(
    `SELECT v.*, u.name AS executive_name FROM crm_site_visits v LEFT JOIN users u ON u.id=v.executive_id
     WHERE v.entity_type=? AND v.entity_id=? ORDER BY v.visit_date DESC`,
    [entityType, id]
  );

  res.json({ record, visits });
};

// GET /api/portal/:entityType/:id/messages
exports.listMessages = async (req, res) => {
  const { entityType, id } = req.params;
  if (!(await ownsRecord(req.customer.mobile, entityType, id))) return res.status(403).json({ error: 'Not your record' });
  const [rows] = await pool.query(
    `SELECT * FROM customer_messages WHERE entity_type=? AND entity_id=? ORDER BY created_at ASC`,
    [entityType, id]
  );
  await pool.query(`UPDATE customer_messages SET is_read=1 WHERE entity_type=? AND entity_id=? AND sender='admin'`, [entityType, id]);
  res.json({ data: rows });
};

// POST /api/portal/:entityType/:id/messages  { message }
exports.sendMessage = async (req, res) => {
  const { entityType, id } = req.params;
  if (!(await ownsRecord(req.customer.mobile, entityType, id))) return res.status(403).json({ error: 'Not your record' });
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

  const table = entityType === 'lead' ? 'leads' : 'inquiries';
  const [[rec]] = await pool.query(`SELECT full_name FROM ${table} WHERE id=?`, [id]);

  const [result] = await pool.query(
    `INSERT INTO customer_messages (entity_type, entity_id, sender, sender_name, message) VALUES (?,?,?,?,?)`,
    [entityType, id, 'customer', rec?.full_name || 'Customer', message.trim()]
  );
  await pool.query(
    `INSERT INTO crm_activity (entity_type, entity_id, activity_type, description) VALUES (?,?,?,?)`,
    [entityType, id, 'Customer Message', message.trim().slice(0, 120)]
  );
  res.status(201).json({ id: result.insertId, message: 'Sent' });
};

// GET /api/portal/:entityType/:id/documents
exports.listDocuments = async (req, res) => {
  const { entityType, id } = req.params;
  if (!(await ownsRecord(req.customer.mobile, entityType, id))) return res.status(403).json({ error: 'Not your record' });
  const [rows] = await pool.query(
    `SELECT id, doc_type, file_url, uploaded_by_customer, created_at FROM crm_documents
     WHERE entity_type=? AND entity_id=? ORDER BY created_at DESC`,
    [entityType, id]
  );
  res.json({ data: rows });
};

// POST /api/portal/:entityType/:id/documents  (multipart, field "file")
exports.uploadDocument = async (req, res) => {
  const { entityType, id } = req.params;
  if (!(await ownsRecord(req.customer.mobile, entityType, id))) return res.status(403).json({ error: 'Not your record' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const DOC_TYPES = ['PAN','Aadhaar','Passport','Income Proof','Booking Form','Agreement','Payment Receipt','Other'];
  const doc_type = DOC_TYPES.includes(req.body.doc_type) ? req.body.doc_type : 'Other';
  const fileUrl = `/uploads/documents/${req.file.filename}`;

  const [result] = await pool.query(
    `INSERT INTO crm_documents (entity_type, entity_id, doc_type, file_url, uploaded_by, uploaded_by_customer) VALUES (?,?,?,?,NULL,1)`,
    [entityType, id, doc_type, fileUrl]
  );
  await pool.query(
    `INSERT INTO crm_activity (entity_type, entity_id, activity_type, description) VALUES (?,?,?,?)`,
    [entityType, id, 'Document Uploaded', `${doc_type} (by customer)`]
  );
  res.status(201).json({ id: result.insertId, file_url: fileUrl, message: 'Document uploaded' });
};
