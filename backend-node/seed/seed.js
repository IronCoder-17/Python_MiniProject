// seed/seed.js — run with: node seed/seed.js
// Creates the default super_admin user. Change credentials after first login!
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

(async () => {
  const email    = process.env.ADMIN_EMAIL    || 'admin@iconicestates.in';
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
  const name     = process.env.ADMIN_NAME     || 'Iconic Admin';

  const [[existing]] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    console.log(`ℹ️  Admin user already exists: ${email}`);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,'super_admin')",
    [name, email, hash]
  );
  console.log(`✅  Super admin created`);
  console.log(`    Email:    ${email}`);
  console.log(`    Password: ${password}`);
  console.log(`\n⚠️  Change this password immediately after first login!\n`);
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
