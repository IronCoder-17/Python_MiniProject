// middleware/upload.js — disk storage for CRM customer documents.
// Files land in <UPLOAD_DIR>/documents and are served statically at /uploads/documents/...
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const baseDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads', 'documents');
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, baseDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safe = `${req.params.entityType}-${req.params.id}-${Date.now()}${ext}`;
    cb(null, safe);
  },
});

const ALLOWED = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.includes(ext)) return cb(new Error('Only PDF, JPG, PNG, or WEBP files are allowed'));
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
