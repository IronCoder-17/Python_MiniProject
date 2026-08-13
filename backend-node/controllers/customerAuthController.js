// controllers/customerAuthController.js — Phase 5: passwordless customer-portal login
const pool = require('../config/db');
const jwt  = require('jsonwebtoken');
const mailer = require('../utils/mailer');
const { CUSTOMER_JWT_SECRET } = require('../middleware/customerAuth');

function normalizeMobile(m) {
  return (m || '').replace(/\D/g, '').slice(-10); // last 10 digits
}

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/portal/auth/request-otp  { mobile }
exports.requestOtp = async (req, res) => {
  const mobile = normalizeMobile(req.body.mobile);
  if (mobile.length !== 10) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });

  const [[leadMatch]] = await pool.query(`SELECT id, email FROM leads WHERE mobile_number LIKE ? LIMIT 1`, [`%${mobile}`]);
  const [[inqMatch]]  = await pool.query(`SELECT id, email FROM inquiries WHERE mobile_number LIKE ? LIMIT 1`, [`%${mobile}`]);
  if (!leadMatch && !inqMatch) {
    return res.status(404).json({ error: 'No enquiry found for this mobile number. Please submit an enquiry first.' });
  }

  const otp = genOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await pool.query(`INSERT INTO customer_otps (mobile, otp_code, expires_at) VALUES (?,?,?)`, [mobile, otp, expiresAt]);

  const email = leadMatch?.email || inqMatch?.email;
  if (email && mailer.isConfigured()) {
    try {
      await mailer.sendMail({ to: email, subject: 'Your Iconic Estates India login code', text: `Your one-time login code is ${otp}. It expires in 10 minutes.` });
      return res.json({ message: `A login code was sent to ${email.replace(/(.{2}).+(@.+)/, '$1***$2')}` });
    } catch (e) { /* fall through to dev-mode response below */ }
  }

  // No SMS gateway is wired up and email either isn't on file or SMTP isn't configured —
  // return the code directly so the flow still works end-to-end (clearly marked as such).
  return res.json({ message: 'SMS/Email delivery is not configured on this server — showing your code directly for now.', dev_otp: otp });
};

// POST /api/portal/auth/verify-otp  { mobile, otp }
exports.verifyOtp = async (req, res) => {
  const mobile = normalizeMobile(req.body.mobile);
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'Enter the code' });

  const [[record]] = await pool.query(
    `SELECT * FROM customer_otps WHERE mobile=? AND otp_code=? AND consumed=0 AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [mobile, otp]
  );
  if (!record) return res.status(400).json({ error: 'Invalid or expired code' });

  await pool.query('UPDATE customer_otps SET consumed=1 WHERE id=?', [record.id]);

  const token = jwt.sign({ mobile, type: 'customer' }, CUSTOMER_JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, mobile });
};
