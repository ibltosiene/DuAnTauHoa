const router = require('express').Router()
const CancelController = require('../controllers/cancelController')

// Mounted ở /api/cancel — FR_User.
router.get('/fee/:idVe', CancelController.getCancelFee)
router.post('/', CancelController.cancelTickets)

module.exports = router
