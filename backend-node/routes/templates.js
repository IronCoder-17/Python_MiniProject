// routes/templates.js
const router = require('express').Router();
const ctrl   = require('../controllers/templatesController');
const { authenticate, authorize } = require('../middleware/auth');
const admin  = [authenticate, authorize('super_admin', 'admin', 'agent')];
const manage = [authenticate, authorize('super_admin', 'admin')];

// WhatsApp templates
router.get('/whatsapp',           ...admin,  ctrl.listWhatsappTemplates);
router.post('/whatsapp',          ...manage, ctrl.createWhatsappTemplate);
router.put('/whatsapp/:id',       ...manage, ctrl.updateWhatsappTemplate);
router.delete('/whatsapp/:id',    ...manage, ctrl.deleteWhatsappTemplate);

// Email templates
router.get('/email',              ...admin,  ctrl.listEmailTemplates);
router.post('/email',             ...manage, ctrl.createEmailTemplate);
router.put('/email/:id',          ...manage, ctrl.updateEmailTemplate);
router.delete('/email/:id',       ...manage, ctrl.deleteEmailTemplate);

// SMTP status + send
router.get('/email-status',       ...admin, ctrl.emailStatus);
router.post('/send-email/:entityType/:id', ...admin, ctrl.sendEmail);

module.exports = router;
