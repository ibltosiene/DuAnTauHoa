const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const refundController = require('../controllers/refundController')

// Mounted ở /api/admin/refunds — FR_Admin.
router.use(authenticate)
router.use(requireRole('quan_tri', 'nhan_vien'))

router.get('/', refundController.getAllRefunds)
router.get('/stats', refundController.getRefundStats)
router.get('/:id', refundController.getRefundById)
router.put('/:id/confirm', refundController.confirmRefund)
router.put('/:id/reject', refundController.rejectRefund)

module.exports = router
