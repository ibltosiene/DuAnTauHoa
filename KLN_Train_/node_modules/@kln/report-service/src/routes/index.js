const router = require('express').Router()

// Mounted ở app.js dưới prefix '/api'.
router.use('/admin/dashboard', require('./dashboard.routes'))
router.use('/admin/reports', require('./reports.routes'))

module.exports = router
