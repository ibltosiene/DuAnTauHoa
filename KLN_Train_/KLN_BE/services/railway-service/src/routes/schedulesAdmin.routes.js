const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const scheduleController = require('../controllers/scheduleAdminController')

// Mounted ở /api/admin/schedules — FR_Admin.
router.use(authenticate)
router.use(requireRole('quan_tri'))

router.get('/', scheduleController.getAllSchedules)
router.get('/trips', scheduleController.getTrips)
router.get('/trips/upcoming', scheduleController.getUpcomingTrips)
router.get('/trips/:id/status', scheduleController.getTripStatus)
router.post('/', scheduleController.createSchedule)
router.post('/generate', scheduleController.generateTrips)
router.put('/trips/:id/status', scheduleController.updateTripStatus)
router.delete('/:id', scheduleController.deleteSchedule)
router.get('/:id', scheduleController.getScheduleById)
router.put('/:id', scheduleController.updateSchedule)
router.get('/:id/stations', scheduleController.getScheduleStations)
router.post('/:id/stations', scheduleController.addStopStation)
router.delete('/:id/stations/:stationId', scheduleController.removeStopStation)

module.exports = router
