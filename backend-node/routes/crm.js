// routes/crm.js
const router = require('express').Router();
const ctrl   = require('../controllers/crmController');
const visits = require('../controllers/siteVisitsController');
const docs   = require('../controllers/documentsController');
const prefs  = require('../controllers/preferencesController');
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');
const admin  = [authenticate, authorize('super_admin', 'admin', 'agent')];

// Executives list (for assignment dropdown)
router.get('/executives', ...admin, ctrl.listExecutives);

// Follow-ups dashboard widget (Today / Tomorrow / Missed)
router.get('/followups/dashboard', ...admin, ctrl.followupsDashboard);
router.put('/followups/:followupId', ...admin, ctrl.updateFollowup);

// Notes
router.delete('/notes/:noteId', ...admin, ctrl.deleteNote);

// Site visits — cross-entity endpoints first (avoid ':entityType' catching 'site-visits')
router.get('/site-visits/today', ...admin, visits.today);
router.put('/site-visits/:visitId', ...admin, visits.update);
router.delete('/site-visits/:visitId', ...admin, visits.remove);

// Documents — cross-entity endpoint first
router.delete('/documents/:docId', ...admin, docs.remove);

// Per-customer (entityType = 'lead' | 'inquiry')
router.get('/:entityType/:id',              ...admin, ctrl.getCustomerDetail);
router.post('/:entityType/:id/notes',       ...admin, ctrl.addNote);
router.post('/:entityType/:id/followups',   ...admin, ctrl.addFollowup);
router.put('/:entityType/:id/assign',       ...admin, ctrl.assign);
router.post('/:entityType/:id/contact',     ...admin, ctrl.logContact);
router.put('/:entityType/:id/status',       ...admin, ctrl.updateStatus);
router.put('/:entityType/:id/score',        ...admin, ctrl.updateScore);

router.get('/:entityType/:id/site-visits',  ...admin, visits.list);
router.post('/:entityType/:id/site-visits', ...admin, visits.create);

router.get('/:entityType/:id/documents',    ...admin, docs.list);
router.post('/:entityType/:id/documents',   ...admin, upload.single('file'), docs.upload);

router.get('/:entityType/:id/preferences',  ...admin, prefs.get);
router.put('/:entityType/:id/preferences',  ...admin, prefs.upsert);

module.exports = router;
