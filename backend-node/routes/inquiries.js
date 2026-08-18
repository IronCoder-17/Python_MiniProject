// routes/inquiries.js
const router = require('express').Router();
const ctrl   = require('../controllers/inquiriesController');
const { authenticate, authorize } = require('../middleware/auth');
const admin  = [authenticate, authorize('super_admin', 'admin')];

router.post('/',             ctrl.createInquiry);        // public
router.get('/',              ...admin, ctrl.listInquiries);
router.put('/:id/status',    ...admin, ctrl.updateStatus);
module.exports = router;
