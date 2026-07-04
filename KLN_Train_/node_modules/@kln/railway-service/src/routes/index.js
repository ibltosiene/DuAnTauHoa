const router = require('express').Router()

// Mounted ở app.js dưới prefix '/api' — Gateway chuyển nguyên vẹn full path.
router.use('/trains', require('./trains.routes'))
router.use('/dispatch', require('./dispatch.routes'))

router.use('/admin/stations', require('./stations.routes'))
router.use('/admin/trains', require('./trainsAdmin.routes'))
router.use('/admin/carriages', require('./carriages.routes'))
router.use('/admin/seats', require('./seats.routes'))
router.use('/admin/schedules', require('./schedulesAdmin.routes'))
router.use('/admin/policies', require('./policies.routes'))

module.exports = router
