const router = require('express').Router()

// Mounted ở app.js dưới prefix '/api'.
router.use('/bookings', require('./bookings.routes'))
router.use('/cancel', require('./cancel.routes'))
router.use('/exchange', require('./exchange.routes'))

router.use('/admin/tickets', require('./ticketsAdmin.routes'))
router.use('/admin/coupons', require('./couponsAdmin.routes'))
router.use('/admin/policies', require('./policies.routes'))

module.exports = router
