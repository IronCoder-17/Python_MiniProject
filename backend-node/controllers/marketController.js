// controllers/marketController.js
const pool = require('../config/db');

// GET /api/market-reports — public
exports.listReports = async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM market_reports ORDER BY city');
  res.json(rows);
};

// GET /api/market-reports/:city
exports.getReportByCity = async (req, res) => {
  const [[row]] = await pool.query(
    'SELECT * FROM market_reports WHERE city = ? ORDER BY report_date DESC LIMIT 1',
    [req.params.city]
  );
  if (!row) return res.status(404).json({ error: 'No data for this city' });
  res.json(row);
};

// POST/PUT/DELETE — admin
exports.createReport = async (req, res) => {
  const cols = Object.keys(req.body).join(', ');
  const vals = Object.values(req.body);
  const ph   = vals.map(() => '?').join(', ');
  const [r]  = await pool.query(`INSERT INTO market_reports (${cols}) VALUES (${ph})`, vals);
  res.status(201).json({ id: r.insertId });
};
exports.updateReport = async (req, res) => {
  const sets = Object.keys(req.body).map(k => `${k} = ?`).join(', ');
  await pool.query(`UPDATE market_reports SET ${sets} WHERE id = ?`, [...Object.values(req.body), req.params.id]);
  res.json({ message: 'Updated' });
};
exports.deleteReport = async (req, res) => {
  await pool.query('DELETE FROM market_reports WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
};

// GET /api/public/stats — counters, testimonials, journey, iconic addresses (single call for homepage)
exports.publicData = async (_req, res) => {
  const [stats]       = await pool.query('SELECT * FROM platform_stats ORDER BY sort_order');
  const [testimonials]= await pool.query('SELECT * FROM testimonials WHERE is_published = 1 ORDER BY sort_order');
  const [journey]     = await pool.query('SELECT * FROM ownership_journey ORDER BY step_number');
  const [addresses]   = await pool.query('SELECT * FROM iconic_addresses ORDER BY city');
  res.json({ stats, testimonials, journey, addresses });
};

// GET /api/public/users — admin list users
exports.listUsers = async (_req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
};

exports.toggleUser = async (req, res) => {
  const [[user]] = await pool.query('SELECT is_active FROM users WHERE id = ?', [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const next = user.is_active ? 0 : 1;
  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [next, req.params.id]);
  res.json({ is_active: next });
};
