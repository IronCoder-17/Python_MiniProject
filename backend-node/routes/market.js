// routes/market.js
const router = require('express').Router();
const ctrl   = require('../controllers/marketController');
const { authenticate, authorize } = require('../middleware/auth');
const admin  = [authenticate, authorize('super_admin', 'admin')];

router.get('/reports',            ctrl.listReports);            // public
router.get('/reports/:city',      ctrl.getReportByCity);        // public
router.post('/reports',           ...admin, ctrl.createReport);
router.put('/reports/:id',        ...admin, ctrl.updateReport);
router.delete('/reports/:id',     ...admin, ctrl.deleteReport);

router.get('/public-data',        ctrl.publicData);             // homepage data (public)

// user management
router.get('/users',              ...admin, ctrl.listUsers);
router.put('/users/:id/toggle',   ...admin, ctrl.toggleUser);

module.exports = router;
