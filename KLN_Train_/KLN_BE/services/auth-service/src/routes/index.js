const router = require('express').Router()

// Mounted ở app.js dưới prefix '/api' — vì Gateway chuyển nguyên vẹn full
// path (vd 'POST /api/auth/login') sang service đích, không bóc tách prefix.
router.use('/auth', require('./auth.routes'))
router.use('/admin/auth', require('./adminAuth.routes'))
router.use('/admin/users', require('./users.routes'))
router.use('/admin/roles', require('./roles.routes'))
router.use('/admin/customers', require('./customersAdmin.routes'))

module.exports = router
