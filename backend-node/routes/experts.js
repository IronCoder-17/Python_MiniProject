// routes/experts.js
const router = require('express').Router();
const ctrl   = require('../controllers/expertsController');
const { authenticate, authorize } = require('../middleware/auth');
const admin  = [authenticate, authorize('super_admin', 'admin')];

// Civil Engineers
router.get('/civil',         ctrl.listCivilEngineers);
router.post('/civil',        ...admin, ctrl.createCivilEngineer);
router.put('/civil/:id',     ...admin, ctrl.updateCivilEngineer);
router.delete('/civil/:id',  ...admin, ctrl.deleteCivilEngineer);

// Interior Designers
router.get('/interior',         ctrl.listInteriorDesigners);
router.post('/interior',        ...admin, ctrl.createInteriorDesigner);
router.put('/interior/:id',     ...admin, ctrl.updateInteriorDesigner);
router.delete('/interior/:id',  ...admin, ctrl.deleteInteriorDesigner);

// Exterior Designers
router.get('/exterior',         ctrl.listExteriorDesigners);
router.post('/exterior',        ...admin, ctrl.createExteriorDesigner);
router.put('/exterior/:id',     ...admin, ctrl.updateExteriorDesigner);
router.delete('/exterior/:id',  ...admin, ctrl.deleteExteriorDesigner);

module.exports = router;
