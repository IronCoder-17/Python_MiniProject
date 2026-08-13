// controllers/crmController.js
// Phase 1 CRM: unified customer detail, notes, follow-ups, assignment, activity timeline.
const pool = require('../config/db');

const TABLES = { lead: 'leads', inquiry: 'inquiries' };

function assertEntity(type) {
  if (!TABLES[type]) {
    const err = new Error("entity_type must be 'lead' or 'inquiry'");
    err.status = 400;
    throw err;
  }
  return TABLES[type];
}

async function logActivity({ entity_type, entity_id, activity_type, description, admin_id }) {
  await pool.query(
    `INSERT INTO crm_activity (entity_type, entity_id, activity_type, description, admin_id)
     VALUES (?,?,?,?,?)`,
    [entity_type, entity_id, activity_type, description || null, admin_id || null]
  );
}

// ── Customer Detail Panel ──────────────────────────────────────
// GET /api/crm/:entityType/:id
exports.getCustomerDetail = async (req, res) => {
  const { entityType, id } = req.params;
  const table = assertEntity(entityType);

  const selectExtra = entityType === 'inquiry'
    ? `, i.property_id, p.title AS property_title, p.city AS property_city, p.hero_image AS property_image`
    : '';
  const joinExtra = entityType === 'inquiry'
    ? `LEFT JOIN properties p ON p.id = i.property_id`
    : '';
  const alias = entityType === 'inquiry' ? 'i' : 'l';

  const [[record]] = await pool.query(
    `SELECT ${alias}.*, u.name AS assigned_to_name ${selectExtra}
     FROM ${table} ${alias}
     LEFT JOIN users u ON u.id = ${alias}.assigned_to
     ${joinExtra}
     WHERE ${alias}.id = ?`,
    [id]
  );
  if (!record) return res.status(404).json({ error: 'Not found' });

  const [notes] = await pool.query(
    `SELECT n.*, u.name AS admin_name FROM crm_notes n
     JOIN users u ON u.id = n.admin_id
     WHERE n.entity_type=? AND n.entity_id=? ORDER BY n.created_at DESC`,
    [entityType, id]
  );

  const [followups] = await pool.query(
    `SELECT f.*, u.name AS created_by_name FROM crm_followups f
     JOIN users u ON u.id = f.created_by
     WHERE f.entity_type=? AND f.entity_id=? ORDER BY f.due_date ASC`,
    [entityType, id]
  );

  const [activity] = await pool.query(
    `SELECT a.*, u.name AS admin_name FROM crm_activity a
     LEFT JOIN users u ON u.id = a.admin_id
     WHERE a.entity_type=? AND a.entity_id=? ORDER BY a.created_at DESC`,
    [entityType, id]
  );

  res.json({ record, notes, followups, activity });
};

// ── Internal Notes ─────────────────────────────────────────────
// POST /api/crm/:entityType/:id/notes
exports.addNote = async (req, res) => {
  const { entityType, id } = req.params;
  assertEntity(entityType);
  const { note } = req.body;
  if (!note || !note.trim()) return res.status(400).json({ error: 'Note text is required' });

  const [result] = await pool.query(
    `INSERT INTO crm_notes (entity_type, entity_id, admin_id, note) VALUES (?,?,?,?)`,
    [entityType, id, req.user.id, note.trim()]
  );
  await logActivity({ entity_type: entityType, entity_id: id, activity_type: 'Note Added', description: note.trim().slice(0, 120), admin_id: req.user.id });
  res.status(201).json({ id: result.insertId, message: 'Note added' });
};

// DELETE /api/crm/notes/:noteId
exports.deleteNote = async (req, res) => {
  await pool.query('DELETE FROM crm_notes WHERE id=?', [req.params.noteId]);
  res.json({ message: 'Note deleted' });
};

// ── Follow-up Scheduler ─────────────────────────────────────────
// POST /api/crm/:entityType/:id/followups
exports.addFollowup = async (req, res) => {
  const { entityType, id } = req.params;
  assertEntity(entityType);
  const { type, due_date, notes } = req.body;
  const validTypes = ['Call', 'Meeting', 'Site Visit', 'Reminder'];
  if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid follow-up type' });
  if (!due_date) return res.status(400).json({ error: 'due_date is required' });

  const [result] = await pool.query(
    `INSERT INTO crm_followups (entity_type, entity_id, type, due_date, notes, created_by)
     VALUES (?,?,?,?,?,?)`,
    [entityType, id, type, due_date, notes || null, req.user.id]
  );
  await logActivity({ entity_type: entityType, entity_id: id, activity_type: `${type} Scheduled`, description: `Due ${due_date}`, admin_id: req.user.id });
  res.status(201).json({ id: result.insertId, message: 'Follow-up scheduled' });
};

// PUT /api/crm/followups/:followupId
exports.updateFollowup = async (req, res) => {
  const { status } = req.body;
  const valid = ['Pending', 'Completed', 'Missed', 'Cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  await pool.query('UPDATE crm_followups SET status=? WHERE id=?', [status, req.params.followupId]);
  res.json({ message: 'Follow-up updated' });
};

// GET /api/crm/followups/dashboard — Today / Tomorrow / Missed, across leads + inquiries
exports.followupsDashboard = async (req, res) => {
  const baseSelect = (extraWhere, params) => pool.query(
    `SELECT f.*, u.name AS created_by_name,
        CASE WHEN f.entity_type='lead' THEN l.full_name ELSE i.full_name END AS customer_name,
        CASE WHEN f.entity_type='lead' THEN l.mobile_number ELSE i.mobile_number END AS mobile_number
     FROM crm_followups f
     JOIN users u ON u.id = f.created_by
     LEFT JOIN leads l ON f.entity_type='lead' AND l.id = f.entity_id
     LEFT JOIN inquiries i ON f.entity_type='inquiry' AND i.id = f.entity_id
     WHERE f.status='Pending' AND ${extraWhere}
     ORDER BY f.due_date ASC`,
    params
  );

  const [[today]]     = await baseSelect('DATE(f.due_date) = CURDATE()', []);
  const [[tomorrow]]  = await baseSelect('DATE(f.due_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)', []);
  const [[missed]]    = await baseSelect('f.due_date < NOW() AND DATE(f.due_date) <> CURDATE()', []);

  res.json({
    today:    Array.isArray(today) ? today : [today].filter(Boolean),
    tomorrow: Array.isArray(tomorrow) ? tomorrow : [tomorrow].filter(Boolean),
    missed:   Array.isArray(missed) ? missed : [missed].filter(Boolean),
  });
};

// ── Lead Assignment ─────────────────────────────────────────────
// PUT /api/crm/:entityType/:id/assign
exports.assign = async (req, res) => {
  const { entityType, id } = req.params;
  const table = assertEntity(entityType);
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });

  const [[current]] = await pool.query(`SELECT assigned_to FROM ${table} WHERE id=?`, [id]);
  if (!current) return res.status(404).json({ error: 'Not found' });

  const assignment_status = current.assigned_to ? 'Reassigned' : 'Assigned';
  await pool.query(
    `UPDATE ${table} SET assigned_to=?, assignment_status=? WHERE id=?`,
    [user_id, assignment_status, id]
  );

  const [[exec]] = await pool.query('SELECT name FROM users WHERE id=?', [user_id]);
  await logActivity({ entity_type: entityType, entity_id: id, activity_type: assignment_status, description: `Assigned to ${exec?.name || 'executive'}`, admin_id: req.user.id });
  res.json({ message: `Lead ${assignment_status.toLowerCase()}` });
};

// GET /api/crm/executives — list of assignable users (admins/agents)
exports.listExecutives = async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, email, role FROM users WHERE is_active=1 ORDER BY name ASC`
  );
  res.json({ data: rows });
};

// ── Contact logging (Call / WhatsApp / Email buttons) ───────────
// POST /api/crm/:entityType/:id/contact
exports.logContact = async (req, res) => {
  const { entityType, id } = req.params;
  const table = assertEntity(entityType);
  const { channel } = req.body; // 'Call' | 'WhatsApp' | 'Email' | 'Location Shared' | 'Brochure Sent'
  const labels = {
    Call: 'Called', WhatsApp: 'WhatsApp Sent', Email: 'Emailed',
    'Location Shared': 'Location Shared', 'Brochure Sent': 'Brochure Sent',
  };
  const activity_type = labels[channel] || channel || 'Contacted';

  await pool.query(`UPDATE ${table} SET last_contact_date = NOW() WHERE id=?`, [id]);
  await logActivity({ entity_type: entityType, entity_id: id, activity_type, admin_id: req.user.id });
  res.json({ message: 'Contact logged' });
};

// ── Status change (shared, richer flow) with activity logging ───
// PUT /api/crm/:entityType/:id/status
exports.updateStatus = async (req, res) => {
  const { entityType, id } = req.params;
  const table = assertEntity(entityType);
  const { status } = req.body;
  const valid = ['New','Contacted','Qualified','Site Visit Scheduled','Visited','Negotiation','Booking','Payment','Completed','Closed','Lost'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  await pool.query(`UPDATE ${table} SET status=? WHERE id=?`, [status, id]);
  await logActivity({ entity_type: entityType, entity_id: id, activity_type: 'Status Changed', description: `→ ${status}`, admin_id: req.user.id });
  res.json({ message: 'Status updated' });
};

// ── Lead score update ────────────────────────────────────────────
// PUT /api/crm/:entityType/:id/score
exports.updateScore = async (req, res) => {
  const { entityType, id } = req.params;
  const table = assertEntity(entityType);
  const { lead_score } = req.body;
  const score = parseInt(lead_score);
  if (isNaN(score) || score < 0 || score > 100) return res.status(400).json({ error: 'lead_score must be 0-100' });

  await pool.query(`UPDATE ${table} SET lead_score=? WHERE id=?`, [score, id]);
  res.json({ message: 'Lead score updated' });
};
