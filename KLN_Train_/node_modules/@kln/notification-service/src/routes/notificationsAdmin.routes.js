const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const C = require('../controllers/notificationAdminController')

// Mounted ở /api/admin/notifications — FR_Admin.
router.use(authenticate)

router.get('/', C.getNotifications)
router.get('/unread/count', C.getUnreadCount)
router.put('/read-all', C.markAllAsRead)
router.put('/:id/read', C.markAsRead)
router.delete('/:id', C.deleteNotification)
router.post('/broadcast', requireRole('quan_tri'), C.sendBroadcastNotification)
router.post('/group', requireRole('quan_tri'), C.sendGroupNotification)

module.exports = router
