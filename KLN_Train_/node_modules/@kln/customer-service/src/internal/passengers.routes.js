const router = require('express').Router()
const { requireInternalKey, response: { ok, badRequest } } = require('@kln/shared')
const PassengerService = require('../services/PassengerService')

// Gọi bởi booking-service khi tạo đơn đặt vé.
router.use(requireInternalKey)

router.post('/find-or-create', async (req, res, next) => {
  try {
    const { ho_ten, ngay_sinh } = req.body
    if (!ho_ten || !ngay_sinh) return badRequest(res, 'Thiếu ho_ten hoặc ngay_sinh')
    const hk = await PassengerService.findOrCreate(req.body)
    ok(res, { id_hanh_khach: hk.id_hanh_khach, ho_ten: hk.ho_ten, ngay_sinh: hk.ngay_sinh, cccd: hk.cccd })
  } catch (err) { next(err) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const hk = await PassengerService.getById(req.params.id)
    if (!hk) return res.status(404).json({ success: false, message: 'Không tìm thấy hành khách' })
    ok(res, hk)
  } catch (err) { next(err) }
})

module.exports = router
