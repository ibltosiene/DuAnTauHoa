const router = require('express').Router()
const PaymentController = require('../controllers/paymentController')

// Mounted ở /api/payments — FR_User.
router.post('/', PaymentController.createPayment)
router.post('/webhook', PaymentController.receiveWebhook)
router.post('/dev-confirm/:maDon', PaymentController.devConfirm)
router.put('/:idThanhToan/confirm', PaymentController.confirmPayment)
router.get('/:idThanhToan', PaymentController.getPaymentStatus)

module.exports = router
