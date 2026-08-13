// controllers/buildersController.js
const pool = require('../config/db');

exports.listBuilders = async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM builders ORDER BY years_experience DESC');
  res.json(rows);
};

exports.getBuilder = async (req, res) => {
  const [[builder]] = await pool.query('SELECT * FROM builders WHERE id = ?', [req.params.id]);
  if (!builder) return res.status(404).json({ error: 'Builder not found' });
  const [properties] = await pool.query(
    'SELECT id, title, property_type, city, price, price_label, hero_image FROM properties WHERE builder_id = ?',
    [req.params.id]
  );
  res.json({ ...builder, properties });
};

exports.createBuilder = async (req, res) => {
  const { name, logo_url, years_experience, total_projects, cities_served, description, rera_registration, website } = req.body;
  const [result] = await pool.query(
    'INSERT INTO builders (name, logo_url, years_experience, total_projects, cities_served, description, rera_registration, website) VALUES (?,?,?,?,?,?,?,?)',
    [name, logo_url, years_experience, total_projects, cities_served, description, rera_registration, website]
  );
  res.status(201).json({ id: result.insertId });
};

exports.updateBuilder = async (req, res) => {
  const fields = ['name','logo_url','years_experience','total_projects','cities_served','description','rera_registration','website'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => fields.includes(k)));
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields' });
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  await pool.query(`UPDATE builders SET ${sets} WHERE id = ?`, [...Object.values(updates), req.params.id]);
  res.json({ message: 'Builder updated' });
};

exports.deleteBuilder = async (req, res) => {
  await pool.query('DELETE FROM builders WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
};
