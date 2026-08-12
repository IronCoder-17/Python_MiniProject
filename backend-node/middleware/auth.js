// middleware/auth.js — JWT authentication + RBAC middleware
const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Verifies the Bearer JWT token and attaches req.user.
 * Returns 401 if missing/invalid, 403 if expired.
 */
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Verify the user still exists and is active
    const [[user]] = await pool.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Token expired — please log in again' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * RBAC: restrict route to specific roles.
 * Usage: authorize('super_admin', 'admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient privileges' });
  }
  next();
};

module.exports = { authenticate, authorize };
