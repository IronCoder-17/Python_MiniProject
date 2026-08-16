// routes/analytics.js
const router = require('express').Router();
const ctrl   = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');
const admin  = [authenticate, authorize('super_admin', 'admin', 'agent')];

router.get('/funnel',        ...admin, ctrl.funnel);
router.get('/monthly-leads', ...admin, ctrl.monthlyLeads);
router.get('/sales-graph',   ...admin, ctrl.salesGraph);
router.get('/lead-sources',  ...admin, ctrl.leadSources);
router.get('/city-wise',     ...admin, ctrl.cityWise);

module.exports = router;
