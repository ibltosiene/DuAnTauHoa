const router = require('express').Router()

// Mounted ở app.js dưới prefix '/api'.
router.use('/notifications', require('./notifications.routes'))
router.use('/admin/notifications', require('./notificationsAdmin.routes'))
router.use('/admin/users/audit-logs', require('./auditLog.routes'))

module.exports = router
