const router = require('express').Router()

// Mounted ở app.js dưới prefix '/api'.
router.use('/payments', require('./payments.routes'))
router.use('/admin/refunds', require('./refundsAdmin.routes'))

module.exports = router
