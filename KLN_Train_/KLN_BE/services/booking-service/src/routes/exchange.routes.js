const router = require('express').Router()
const ExchangeController = require('../controllers/exchangeController')

// Mounted ở /api/exchange — FR_User.
router.get('/check/:idVe', ExchangeController.checkExchangeable)
router.post('/', ExchangeController.exchangeTicket)

module.exports = router
