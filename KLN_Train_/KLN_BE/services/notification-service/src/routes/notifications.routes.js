const router = require('express').Router()
const { authenticate } = require('@kln/shared')
const C = require('../controllers/notificationController')

// Mounted ở /api/notifications — FR_User + FR_Dispatcher.
router.get('/', authenticate, C.getMyNotifications)
router.put('/read-all', authenticate, C.markAllAsRead)
router.put('/:id/read', authenticate, C.markAsRead)

module.exports = router
