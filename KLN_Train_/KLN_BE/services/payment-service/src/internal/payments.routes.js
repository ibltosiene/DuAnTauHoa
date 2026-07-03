const router = require('express').Router()
const { requireInternalKey, response: { ok } } = require('@kln/shared')
const PaymentService = require('../services/PaymentService')

// Gọi bởi booking-service (ExchangeService) khi cần thu phí chênh lệch đổi vé.
router.use(requireInternalKey)

router.post('/', async (req, res, next) => {
  try {
    const tt = await PaymentService.createInternalPayment(req.body)
    ok(res, { id_thanh_toan: tt.id_thanh_toan, ma_giao_dich: tt.ma_giao_dich })
  } catch (err) { next(err) }
})

module.exports = router
