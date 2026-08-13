// controllers/documentsController.js — Phase 3: Customer Documents
const pool = require('../config/db');
const fs   = require('fs');
const path = require('path');

const DOC_TYPES = ['PAN','Aadhaar','Passport','Income Proof','Booking Form','Agreement','Payment Receipt','Other'];

// GET /api/crm/:entityType/:id/documents
exports.list = async (req, res) => {
  const { entityType, id } = req.params;
  const [rows] = await pool.query(
    `SELECT d.*, u.name AS uploaded_by_name FROM crm_documents d
     JOIN users u ON u.id = d.uploaded_by
     WHERE d.entity_type=? AND d.entity_id=? ORDER BY d.created_at DESC`,
    [entityType, id]
  );
  res.json({ data: rows });
};

// POST /api/crm/:entityType/:id/documents  (multipart/form-data, field name "file")
exports.upload = async (req, res) => {
  const { entityType, id } = req.params;
  const { doc_type } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!DOC_TYPES.includes(doc_type)) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: `doc_type must be one of: ${DOC_TYPES.join(', ')}` });
  }

  const fileUrl = `/uploads/documents/${req.file.filename}`;
  const [result] = await pool.query(
    `INSERT INTO crm_documents (entity_type, entity_id, doc_type, file_url, uploaded_by) VALUES (?,?,?,?,?)`,
    [entityType, id, doc_type, fileUrl, req.user.id]
  );
  await pool.query(
    `INSERT INTO crm_activity (entity_type, entity_id, activity_type, description, admin_id) VALUES (?,?,?,?,?)`,
    [entityType, id, 'Document Uploaded', doc_type, req.user.id]
  );
  res.status(201).json({ id: result.insertId, file_url: fileUrl, message: 'Document uploaded' });
};

// DELETE /api/crm/documents/:docId
exports.remove = async (req, res) => {
  const [[doc]] = await pool.query('SELECT * FROM crm_documents WHERE id=?', [req.params.docId]);
  if (!doc) return res.status(404).json({ error: 'Not found' });

  await pool.query('DELETE FROM crm_documents WHERE id=?', [req.params.docId]);
  const filePath = path.join(__dirname, '..', doc.file_url.replace(/^\//, ''));
  fs.unlink(filePath, () => {}); // best-effort; ignore if already missing
  res.json({ message: 'Document deleted' });
};
