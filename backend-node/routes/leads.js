// routes/leads.js
const router = require('express').Router();
const ctrl   = require('../controllers/leadsController');
const { authenticate, authorize } = require('../middleware/auth');
const admin  = [authenticate, authorize('super_admin', 'admin')];

router.post('/',            ctrl.createLead);            // public
router.get('/',             ...admin, ctrl.listLeads);
router.get('/export',       ...admin, ctrl.exportCSV);
router.get('/dashboard',    ...admin, ctrl.dashboardSummary);
router.put('/:id/status',   ...admin, ctrl.updateLeadStatus);
module.exports = router;
