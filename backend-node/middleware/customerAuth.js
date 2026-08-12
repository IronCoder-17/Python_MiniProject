// middleware/customerAuth.js — verifies the customer-portal JWT (separate from admin auth).
const jwt = require('jsonwebtoken');

const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET;

const authenticateCustomer = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in to continue' });

  try {
    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET);
    if (decoded.type !== 'customer') return res.status(401).json({ error: 'Invalid session' });
    req.customer = { mobile: decoded.mobile };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(403).json({ error: 'Session expired — please log in again' });
    return res.status(401).json({ error: 'Invalid session' });
  }
};

module.exports = { authenticateCustomer, CUSTOMER_JWT_SECRET };
