// routes/notifications.js
const router = require('express').Router();
const ctrl   = require('../controllers/notificationsController');
const { authenticate, authorize } = require('../middleware/auth');
const admin  = [authenticate, authorize('super_admin', 'admin', 'agent')];

router.get('/',              ...admin, ctrl.list);
router.put('/read-all',      ...admin, ctrl.markAllRead);
router.put('/:id/read',      ...admin, ctrl.markRead);

module.exports = router;
