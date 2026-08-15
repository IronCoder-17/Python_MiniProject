// controllers/expertsController.js — handles civil_engineers, interior_designers, exterior_designers
const pool = require('../config/db');

const table = { civil: 'civil_engineers', interior: 'interior_designers', exterior: 'exterior_designers' };
const resolve = (type) => table[type];

// Generic CRUD factory
const listExperts = (type) => async (_req, res) => {
  const t = resolve(type);
  const [rows] = await pool.query(`SELECT * FROM ${t} ORDER BY experience_years DESC`);
  res.json(rows);
};

const createExpert = (type) => async (req, res) => {
  const t = resolve(type);
  const cols = Object.keys(req.body).join(', ');
  const vals = Object.values(req.body);
  const ph   = vals.map(() => '?').join(', ');
  const [r]  = await pool.query(`INSERT INTO ${t} (${cols}) VALUES (${ph})`, vals);
  res.status(201).json({ id: r.insertId });
};

const updateExpert = (type) => async (req, res) => {
  const t    = resolve(type);
  const sets = Object.keys(req.body).map(k => `${k} = ?`).join(', ');
  const vals = [...Object.values(req.body), req.params.id];
  await pool.query(`UPDATE ${t} SET ${sets} WHERE id = ?`, vals);
  res.json({ message: 'Updated' });
};

const deleteExpert = (type) => async (req, res) => {
  const t = resolve(type);
  await pool.query(`DELETE FROM ${t} WHERE id = ?`, [req.params.id]);
  res.json({ message: 'Deleted' });
};

exports.listCivilEngineers    = listExperts('civil');
exports.createCivilEngineer   = createExpert('civil');
exports.updateCivilEngineer   = updateExpert('civil');
exports.deleteCivilEngineer   = deleteExpert('civil');

exports.listInteriorDesigners  = listExperts('interior');
exports.createInteriorDesigner = createExpert('interior');
exports.updateInteriorDesigner = updateExpert('interior');
exports.deleteInteriorDesigner = deleteExpert('interior');

exports.listExteriorDesigners  = listExperts('exterior');
exports.createExteriorDesigner = createExpert('exterior');
exports.updateExteriorDesigner = updateExpert('exterior');
exports.deleteExteriorDesigner = deleteExpert('exterior');
