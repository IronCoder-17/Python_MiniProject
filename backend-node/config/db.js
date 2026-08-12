// config/db.js — MySQL connection pool (mysql2/promise)
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || '3306'),
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'iconic_estates_india',
  charset:            'utf8mb4',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
});

// Test the connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    const [[row]] = await conn.query('SELECT VERSION() as v');
    console.log(`✅  MySQL connected — MariaDB/MySQL ${row.v}`);
    conn.release();
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);
  }
})();

module.exports = pool;
