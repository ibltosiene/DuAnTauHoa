const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const seatController = require('../controllers/seatController')

// Mounted ở /api/admin/carriages — FR_Admin. '/types' ủy quyền cho cùng
// SeatController xử lý LoaiToa (giữ đúng thiết kế cũ: carriages.routes.js
// và seats.routes.js cùng thao tác trên LoaiToa/LoaiGhe).
router.use(authenticate)
router.use(requireRole('quan_tri'))

router.get('/types', seatController.getAllCarriageTypes)
router.post('/types', seatController.createCarriageType)
router.get('/types/:id', seatController.getCarriageTypeById)
router.put('/types/:id', seatController.updateCarriageType)
router.delete('/types/:id', seatController.deleteCarriageType)

router.get('/seat-types', seatController.getAllSeatTypes)
router.post('/seat-types', seatController.createSeatType)

router.post('/:id_loai_toa/seats', seatController.configureSeatsForCarriage)

module.exports = router
