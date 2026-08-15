// controllers/inquiriesController.js
const pool = require('../config/db');
const { notify } = require('./notificationsController');

// POST /api/inquiries — public
exports.createInquiry = async (req, res) => {
  const { property_id, full_name, mobile_number, email, inquiry_type, preferred_date, message } = req.body;
  if (!property_id || !full_name || !mobile_number)
    return res.status(400).json({ error: 'property_id, full_name and mobile_number required' });

  const [result] = await pool.query(
    `INSERT INTO inquiries (property_id, full_name, mobile_number, email, inquiry_type, preferred_date, message)
     VALUES (?,?,?,?,?,?,?)`,
    [property_id, full_name, mobile_number, email,
     inquiry_type || 'Contact Owner', preferred_date || null, message]
  );
  await pool.query(
    `INSERT INTO crm_activity (entity_type, entity_id, activity_type, description) VALUES ('inquiry', ?, 'Created', ?)`,
    [result.insertId, inquiry_type || 'Contact Owner']
  );
  await notify('New Inquiry', 'New Inquiry', `${full_name} · ${inquiry_type || 'Contact Owner'}`, 'inquiry', result.insertId);
  res.status(201).json({ id: result.insertId, message: 'Inquiry submitted successfully.' });
};

// GET /api/inquiries — admin. Supports advanced filters (Phase 3):
// status, city, inquiry_type, assigned_to ('unassigned' or user id),
// date_from, date_to, followup_pending=true, site_visit=true
exports.listInquiries = async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page  || '1'));
  const limit  = Math.min(100, parseInt(req.query.limit || '25'));
  const offset = (page - 1) * limit;

  const { status, city, inquiry_type, assigned_to, date_from, date_to, followup_pending, site_visit } = req.query;

  const conds = [];
  const params = [];
  if (status)        { conds.push('i.status = ?');       params.push(status); }
  if (city)           { conds.push('p.city = ?');          params.push(city); }
  if (inquiry_type)   { conds.push('i.inquiry_type = ?');  params.push(inquiry_type); }
  if (assigned_to === 'unassigned') { conds.push('i.assigned_to IS NULL'); }
  else if (assigned_to) { conds.push('i.assigned_to = ?'); params.push(assigned_to); }
  if (date_from)       { conds.push('DATE(i.created_at) >= ?'); params.push(date_from); }
  if (date_to)         { conds.push('DATE(i.created_at) <= ?'); params.push(date_to); }
  if (followup_pending === 'true') {
    conds.push(`EXISTS (SELECT 1 FROM crm_followups f WHERE f.entity_type='inquiry' AND f.entity_id=i.id AND f.status='Pending')`);
  }
  if (site_visit === 'true') {
    conds.push(`EXISTS (SELECT 1 FROM crm_site_visits v WHERE v.entity_type='inquiry' AND v.entity_id=i.id)`);
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT i.*, p.title AS property_title, p.city, u.name AS assigned_to_name
     FROM inquiries i
     LEFT JOIN properties p ON p.id = i.property_id
     LEFT JOIN users u ON u.id = i.assigned_to
     ${where} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM inquiries i LEFT JOIN properties p ON p.id = i.property_id ${where}`, params
  );
  res.json({ data: rows, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
};

// PUT /api/inquiries/:id/status — admin
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['New','Contacted','Qualified','Site Visit Scheduled','Visited','Negotiation','Booking','Payment','Completed','Closed','Lost','Spam'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  await pool.query('UPDATE inquiries SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ message: 'Status updated' });
};