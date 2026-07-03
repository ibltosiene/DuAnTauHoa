const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const C = require('../controllers/auditLogController')

// Mounted ở /api/admin/users/audit-logs — FR_Admin (tách khỏi auth-service
// vì AuditLog thuộc Notification Service).
router.get('/', authenticate, requireRole('quan_tri'), C.getAuditLogs)

module.exports = router
