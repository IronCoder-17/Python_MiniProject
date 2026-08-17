// routes/builders.js
const router = require('express').Router();
const ctrl   = require('../controllers/buildersController');
const { authenticate, authorize } = require('../middleware/auth');
const admin  = [authenticate, authorize('super_admin', 'admin')];

router.get('/',        ctrl.listBuilders);
router.get('/:id',     ctrl.getBuilder);
router.post('/',       ...admin, ctrl.createBuilder);
router.put('/:id',     ...admin, ctrl.updateBuilder);
router.delete('/:id',  ...admin, ctrl.deleteBuilder);
module.exports = router;
