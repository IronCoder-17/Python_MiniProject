// routes/properties.js
const router = require('express').Router();
const ctrl   = require('../controllers/propertiesController');
const { authenticate, authorize } = require('../middleware/auth');

const admin = [authenticate, authorize('super_admin', 'admin')];

router.get('/featured',       ctrl.listFeatured);
router.get('/filters/meta',   ctrl.filterMeta);
router.get('/',               ctrl.listProperties);
router.get('/:id',            ctrl.getProperty);

router.post('/',              ...admin, ctrl.createProperty);
router.put('/:id',            ...admin, ctrl.updateProperty);
router.delete('/:id',         ...admin, ctrl.deleteProperty);
router.post('/:id/images',    ...admin, ctrl.addImages);

module.exports = router;
