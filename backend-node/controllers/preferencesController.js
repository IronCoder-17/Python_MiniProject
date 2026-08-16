// controllers/preferencesController.js — Phase 3: Customer Preferences
const pool = require('../config/db');

// GET /api/crm/:entityType/:id/preferences
exports.get = async (req, res) => {
  const { entityType, id } = req.params;
  const [[row]] = await pool.query(
    `SELECT * FROM crm_preferences WHERE entity_type=? AND entity_id=?`,
    [entityType, id]
  );
  res.json({ data: row || null });
};

// PUT /api/crm/:entityType/:id/preferences  (upsert)
exports.upsert = async (req, res) => {
  const { entityType, id } = req.params;
  const { preferred_location, budget_min, budget_max, bedrooms, amenities, loan_required, purpose } = req.body;

  await pool.query(
    `INSERT INTO crm_preferences (entity_type, entity_id, preferred_location, budget_min, budget_max, bedrooms, amenities, loan_required, purpose)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       preferred_location=VALUES(preferred_location), budget_min=VALUES(budget_min), budget_max=VALUES(budget_max),
       bedrooms=VALUES(bedrooms), amenities=VALUES(amenities), loan_required=VALUES(loan_required), purpose=VALUES(purpose)`,
    [entityType, id, preferred_location || null, budget_min || null, budget_max || null,
     bedrooms || null, amenities || null, loan_required ? 1 : 0, purpose || 'Self Use']
  );
  res.json({ message: 'Preferences saved' });
};
