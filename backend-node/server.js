// server.js — Iconic Estates India | Node.js / Express API
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const fs          = require('fs');

const app = express();

// ── Security middleware ───────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS — allow all localhost ports ─────────────────────────────────────
app.use(cors({
  origin: true,        // reflect the request origin — allows any origin in dev
  credentials: true,
}));

// ── General middleware ────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ─────────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

app.use('/api/auth/login', rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts.' },
}));

// ── Static file serving (uploaded images) ─────────────────────────────────
const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/properties',    require('./routes/properties'));
app.use('/api/leads',         require('./routes/leads'));
app.use('/api/inquiries',     require('./routes/inquiries'));
app.use('/api/builders',      require('./routes/builders'));
app.use('/api/experts',       require('./routes/experts'));
app.use('/api/market',        require('./routes/market'));
app.use('/api/crm',           require('./routes/crm'));
app.use('/api/templates',     require('./routes/templates'));
app.use('/api/notifications', require('./routes/notifications'));

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  service: 'Iconic Estates India API',
  timestamp: new Date().toISOString(),
}));

// ── 404 + Global error handler ────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000');
app.listen(PORT, () => {
  console.log(`\n🏠  Iconic Estates India API running on http://localhost:${PORT}`);
  console.log(`    Environment: ${process.env.NODE_ENV || 'development'}\n`);
});