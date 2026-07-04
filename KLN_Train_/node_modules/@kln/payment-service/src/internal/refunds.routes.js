const router = require('express').Router()
const { requireInternalKey, response: { ok } } = require('@kln/shared')
const RefundService = require('../services/RefundService')

// Gọi bởi booking-service (CancelService) khi hủy vé đã thanh toán.
router.use(requireInternalKey)

router.post('/', async (req, res, next) => {
  try {
    const { idVe, idDonDatVe, tienGoc, phiHuy, tienHoan, lyDo } = req.body
    const hoanTien = await RefundService.createRefund({ idVe, idDonDatVe, tienGoc, phiHuy, tienHoan, lyDo })
    ok(res, hoanTien ? { id_hoan: hoanTien.id_hoan } : null)
  } catch (err) { next(err) }
})

module.exports = router
