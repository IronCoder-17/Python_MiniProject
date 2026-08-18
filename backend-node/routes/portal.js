// routes/portal.js — Phase 5: Customer Portal (separate from the admin API)
const router = require('express').Router();
const authCtrl   = require('../controllers/customerAuthController');
const portalCtrl = require('../controllers/portalController');
const upload     = require('../middleware/upload');
const { authenticateCustomer } = require('../middleware/customerAuth');

// Auth (public)
router.post('/auth/request-otp', authCtrl.requestOtp);
router.post('/auth/verify-otp',  authCtrl.verifyOtp);

// Everything below requires a valid customer session
router.use(authenticateCustomer);

router.get('/me',                              portalCtrl.myRecords);
router.get('/:entityType/:id',                 portalCtrl.getRecord);
router.get('/:entityType/:id/messages',        portalCtrl.listMessages);
router.post('/:entityType/:id/messages',       portalCtrl.sendMessage);
router.get('/:entityType/:id/documents',       portalCtrl.listDocuments);
router.post('/:entityType/:id/documents',      upload.single('file'), portalCtrl.uploadDocument);

module.exports = router;
