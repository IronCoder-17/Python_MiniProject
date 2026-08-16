// controllers/siteVisitsController.js — Phase 3: Site Visit Management
const pool = require('../config/db');

function assertEntity(type) {
  if (!['lead', 'inquiry'].includes(type)) {
    const err = new Error("entity_type must be 'lead' or 'inquiry'");
    err.status = 400;
    throw err;
  }
}

async function logActivity(entity_type, entity_id, activity_type, description, admin_id) {
  await pool.query(
    `INSERT INTO crm_activity (entity_type, entity_id, activity_type, description, admin_id) VALUES (?,?,?,?,?)`,
    [entity_type, entity_id, activity_type, description || null, admin_id || null]
  );
}

// GET /api/crm/:entityType/:id/site-visits
exports.list = async (req, res) => {
  const { entityType, id } = req.params;
  assertEntity(entityType);
  const [rows] = await pool.query(
    `SELECT v.*, u.name AS executive_name, p.title AS property_title
     FROM crm_site_visits v
     LEFT JOIN users u ON u.id = v.executive_id
     LEFT JOIN properties p ON p.id = v.property_id
     WHERE v.entity_type=? AND v.entity_id=? ORDER BY v.visit_date DESC, v.visit_time DESC`,
    [entityType, id]
  );
  res.json({ data: rows });
};

// POST /api/crm/:entityType/:id/site-visits
exports.create = async (req, res) => {
  const { entityType, id } = req.params;
  assertEntity(entityType);
  const { property_id, visit_date, visit_time, driver_name, driver_phone, pickup_address, executive_id, vehicle_number, notes } = req.body;
  if (!visit_date) return res.status(400).json({ error: 'visit_date is required' });

  const [result] = await pool.query(
    `INSERT INTO crm_site_visits
     (entity_type, entity_id, property_id, visit_date, visit_time, driver_name, driver_phone, pickup_address, executive_id, vehicle_number, notes, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [entityType, id, property_id || null, visit_date, visit_time || null, driver_name || null, driver_phone || null,
     pickup_address || null, executive_id || null, vehicle_number || null, notes || null, req.user.id]
  );

  // Keep the leads/inquiries.status in sync — a visit being scheduled moves them along the funnel
  const table = entityType === 'lead' ? 'leads' : 'inquiries';
  await pool.query(
    `UPDATE ${table} SET status='Site Visit Scheduled' WHERE id=? AND status IN ('New','Contacted','Qualified')`,
    [id]
  );

  await logActivity(entityType, id, 'Site Visit Booked', `${visit_date}${visit_time ? ' ' + visit_time : ''}`, req.user.id);
  res.status(201).json({ id: result.insertId, message: 'Site visit scheduled' });
};

// PUT /api/crm/site-visits/:visitId
exports.update = async (req, res) => {
  const { visitId } = req.params;
  const fields = ['visit_date','visit_time','driver_name','driver_phone','pickup_address','executive_id','vehicle_number','visit_status','notes','property_id'];
  const sets = [], vals = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { sets.push(`${f}=?`); vals.push(req.body[f]); }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  vals.push(visitId);
  await pool.query(`UPDATE crm_site_visits SET ${sets.join(', ')} WHERE id=?`, vals);

  if (req.body.visit_status) {
    const [[visit]] = await pool.query('SELECT entity_type, entity_id FROM crm_site_visits WHERE id=?', [visitId]);
    if (visit) {
      await logActivity(visit.entity_type, visit.entity_id, 'Site Visit ' + req.body.visit_status, null, req.user.id);
      if (req.body.visit_status === 'Completed') {
        const table = visit.entity_type === 'lead' ? 'leads' : 'inquiries';
        await pool.query(`UPDATE ${table} SET status='Visited' WHERE id=? AND status='Site Visit Scheduled'`, [visit.entity_id]);
      }
    }
  }
  res.json({ message: 'Site visit updated' });
};

// DELETE /api/crm/site-visits/:visitId
exports.remove = async (req, res) => {
  await pool.query('DELETE FROM crm_site_visits WHERE id=?', [req.params.visitId]);
  res.json({ message: 'Site visit removed' });
};

// GET /api/crm/site-visits/today — ops dashboard: who's visiting today
exports.today = async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT v.*, u.name AS executive_name, p.title AS property_title,
        CASE WHEN v.entity_type='lead' THEN l.full_name ELSE i.full_name END AS customer_name,
        CASE WHEN v.entity_type='lead' THEN l.mobile_number ELSE i.mobile_number END AS mobile_number
     FROM crm_site_visits v
     LEFT JOIN users u ON u.id = v.executive_id
     LEFT JOIN properties p ON p.id = v.property_id
     LEFT JOIN leads l ON v.entity_type='lead' AND l.id = v.entity_id
     LEFT JOIN inquiries i ON v.entity_type='inquiry' AND i.id = v.entity_id
     WHERE v.visit_date = CURDATE() AND v.visit_status NOT IN ('Cancelled')
     ORDER BY v.visit_time ASC`
  );
  res.json({ data: rows });
};
