// routes/auth.js
const router = require('express').Router();
const { login, register, me, changePassword } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/login',           login);
router.post('/register',        authenticate, authorize('super_admin'), register);
router.get('/me',               authenticate, me);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
