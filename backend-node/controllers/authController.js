// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });

  const [[user]] = await pool.query(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?',
    [email.toLowerCase().trim()]
  );

  if (!user || !user.is_active)
    return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid)
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
};

// POST /api/auth/register  (super_admin only — seed an initial admin via seed script)
exports.register = async (req, res) => {
  const { name, email, password, role = 'admin' } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email, password required' });

  const [[existing]] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 12);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
    [name, email.toLowerCase().trim(), hash, role]
  );
  return res.status(201).json({ id: result.insertId, name, email, role });
};

// GET /api/auth/me
exports.me = (req, res) => res.json(req.user);

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'Both passwords required' });

  const [[user]] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  return res.json({ message: 'Password updated successfully' });
};
