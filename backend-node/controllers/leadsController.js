// controllers/leadsController.js
const pool = require('../config/db');
const { notify } = require('./notificationsController');

// POST /api/leads — public, create a lead from homepage form
exports.createLead = async (req, res) => {
  const { full_name, mobile_number, email, city, budget, property_type, message, source_page } = req.body;
  if (!full_name || !mobile_number)
    return res.status(400).json({ error: 'full_name and mobile_number are required' });

  const [result] = await pool.query(
    `INSERT INTO leads (full_name, mobile_number, email, city, budget, property_type, message, source_page)
     VALUES (?,?,?,?,?,?,?,?)`,
    [full_name, mobile_number, email, city, budget, property_type, message, source_page || 'website']
  );
  await pool.query(
    `INSERT INTO crm_activity (entity_type, entity_id, activity_type, description) VALUES ('lead', ?, 'Created', ?)`,
    [result.insertId, `Source: ${source_page || 'website'}`]
  );
  await notify('New Lead', 'New Lead', `${full_name} · ${city || 'Unknown city'}`, 'lead', result.insertId);
  res.status(201).json({ id: result.insertId, message: 'Thank you! Our team will contact you shortly.' });
};

// GET /api/leads — admin only. Supports advanced filters (Phase 3):
// status, city, property_type, assigned_to ('unassigned' or a user id), source_page,
// date_from, date_to (created_at range), followup_pending=true, site_visit=true
exports.listLeads = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page  || '1'));
  const limit = Math.min(100, parseInt(req.query.limit || '25'));
  const offset = (page - 1) * limit;

  const { status, city, property_type, assigned_to, source_page, date_from, date_to, followup_pending, site_visit } = req.query;

  const conds = [];
  const params = [];
  if (status)         { conds.push('l.status = ?');        params.push(status); }
  if (city)            { conds.push('l.city = ?');           params.push(city); }
  if (property_type)   { conds.push('l.property_type = ?');  params.push(property_type); }
  if (source_page)     { conds.push('l.source_page = ?');    params.push(source_page); }
  if (assigned_to === 'unassigned') { conds.push('l.assigned_to IS NULL'); }
  else if (assigned_to) { conds.push('l.assigned_to = ?');   params.push(assigned_to); }
  if (date_from)        { conds.push('DATE(l.created_at) >= ?'); params.push(date_from); }
  if (date_to)          { conds.push('DATE(l.created_at) <= ?'); params.push(date_to); }
  if (followup_pending === 'true') {
    conds.push(`EXISTS (SELECT 1 FROM crm_followups f WHERE f.entity_type='lead' AND f.entity_id=l.id AND f.status='Pending')`);
  }
  if (site_visit === 'true') {
    conds.push(`EXISTS (SELECT 1 FROM crm_site_visits v WHERE v.entity_type='lead' AND v.entity_id=l.id)`);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT l.*, u.name AS assigned_to_name FROM leads l
     LEFT JOIN users u ON u.id = l.assigned_to
     ${where} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM leads l ${where}`, params
  );

  // Today's count
  const [[{ today }]] = await pool.query(
    "SELECT COUNT(*) AS today FROM leads WHERE DATE(created_at) = CURDATE()"
  );

  res.json({ data: rows, meta: { total, today, page, limit, pages: Math.ceil(total / limit) } });
};

// GET /api/leads/dashboard — admin summary card counts
exports.dashboardSummary = async (req, res) => {
  const [[props]]  = await pool.query('SELECT COUNT(*) AS c FROM properties');
  const [[leads]]  = await pool.query('SELECT COUNT(*) AS c FROM leads');
  const [[today]]  = await pool.query("SELECT COUNT(*) AS c FROM leads WHERE DATE(created_at)=CURDATE()");
  const [[inqs]]   = await pool.query('SELECT COUNT(*) AS c FROM inquiries');
  const [[newL]]   = await pool.query("SELECT COUNT(*) AS c FROM leads WHERE status='New'");

  // Real 7-day lead trend (was previously hardcoded on the frontend)
  const [trendRows] = await pool.query(
    `SELECT DATE(created_at) AS day, COUNT(*) AS c
     FROM leads
     WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at)`
  );
  const trendMap = Object.fromEntries(trendRows.map(r => [
    new Date(r.day).toISOString().slice(0, 10), r.c,
  ]));
  const weekly_trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    weekly_trend.push({
      label: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      leads: trendMap[key] || 0,
    });
  }

  // Month-over-month lead growth
  const [[thisMonth]] = await pool.query(
    "SELECT COUNT(*) AS c FROM leads WHERE YEAR(created_at)=YEAR(CURDATE()) AND MONTH(created_at)=MONTH(CURDATE())"
  );
  const [[lastMonth]] = await pool.query(
    "SELECT COUNT(*) AS c FROM leads WHERE YEAR(created_at)=YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(created_at)=MONTH(CURDATE() - INTERVAL 1 MONTH)"
  );
  const monthly_growth_pct = lastMonth.c > 0
    ? Math.round(((thisMonth.c - lastMonth.c) / lastMonth.c) * 1000) / 10
    : (thisMonth.c > 0 ? 100 : 0);

  // Property mix by possession status (real breakdown, no fake "sold" bucket
  // since the schema has no sold/rented concept yet)
  const [statusRows] = await pool.query(
    `SELECT possession_status, COUNT(*) AS c FROM properties GROUP BY possession_status`
  );

  res.json({
    total_properties:  props.c,
    total_leads:       leads.c,
    todays_leads:      today.c,
    total_inquiries:   inqs.c,
    new_leads:         newL.c,
    weekly_trend,
    monthly_growth_pct,
    property_status_breakdown: statusRows,
  });
};

// PUT /api/leads/:id/status — admin
exports.updateLeadStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['New','Contacted','Qualified','Site Visit Scheduled','Visited','Negotiation','Booking','Payment','Completed','Closed','Lost','Spam'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  await pool.query('UPDATE leads SET status = ? WHERE id = ?', [status, req.params.id]);
  if (status === 'Completed') {
    const [[lead]] = await pool.query('SELECT full_name FROM leads WHERE id = ?', [req.params.id]);
    if (lead) await notify('Booking Completed', 'Booking Completed', lead.full_name, 'lead', req.params.id);
  }
  res.json({ message: 'Status updated' });
};

// GET /api/leads/export — CSV download (admin)
exports.exportCSV = async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
  if (!rows.length) return res.status(404).json({ error: 'No leads to export' });

  const headers = Object.keys(rows[0]).join(',');
  const csvRows = rows.map(r =>
    Object.values(r).map(v => (v === null ? '' : `"${String(v).replace(/"/g, '""')}"`)).join(',')
  );
  const csv = [headers, ...csvRows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leads_export.csv"');
  res.send(csv);
};