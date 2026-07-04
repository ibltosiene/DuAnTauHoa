const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const seatController = require('../controllers/seatController')

// Mounted ở /api/admin/seats — FR_Admin.
router.use(authenticate)

router.get('/types', seatController.getAllSeatTypes)
router.post('/types', seatController.createSeatType)
router.get('/types/:id', seatController.getSeatTypeById)
router.put('/types/:id', seatController.updateSeatType)
router.delete('/types/:id', seatController.deleteSeatType)

router.get('/carriage-types', seatController.getAllCarriageTypes)
router.post('/carriage-types', seatController.createCarriageType)
router.get('/carriage-types/:id', seatController.getCarriageTypeById)
router.put('/carriage-types/:id', seatController.updateCarriageType)
router.delete('/carriage-types/:id', seatController.deleteCarriageType)

router.post('/carriage-types/:id_loai_toa/configure', seatController.configureSeatsForCarriage)
router.get('/carriage-types/:id_loai_toa/configuration', seatController.getSeatConfiguration)

module.exports = router
