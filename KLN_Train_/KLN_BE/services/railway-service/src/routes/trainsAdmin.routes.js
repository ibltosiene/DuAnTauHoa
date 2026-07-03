const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const trainController = require('../controllers/trainAdminController')

// Mounted ở /api/admin/trains — FR_Admin.
router.use(authenticate)
router.use(requireRole('quan_tri'))

router.get('/', trainController.getAllTrains)
router.get('/:id/detail', trainController.getTrainDetail)
router.get('/:id', trainController.getTrainDetail)
router.post('/', trainController.createTrain)
router.put('/:id', trainController.updateTrain)
router.delete('/:id', trainController.deleteTrain)

router.post('/:id/carriages', trainController.addCarriageToTrain)
router.delete('/:id/carriages/:carriageId', trainController.removeCarriageFromTrain)

module.exports = router
