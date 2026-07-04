const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const stationController = require('../controllers/stationController')

// Mounted ở /api/admin/stations — FR_Admin.
router.use(authenticate)
router.use(requireRole('quan_tri'))

router.get('/', stationController.getAllStations)
router.post('/', stationController.createStation)
router.put('/:id', stationController.updateStation)
router.delete('/:id', stationController.deleteStation)

module.exports = router
