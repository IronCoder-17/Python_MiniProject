// utils/notify.js — create a stored admin notification
const pool = require('../config/db');

async function notify({ type, title, message, entity_type, entity_id }) {
  await pool.query(
    `INSERT INTO crm_notifications (type, title, message, entity_type, entity_id) VALUES (?,?,?,?,?)`,
    [type, title, message || null, entity_type || null, entity_id || null]
  );
}

module.exports = { notify };
