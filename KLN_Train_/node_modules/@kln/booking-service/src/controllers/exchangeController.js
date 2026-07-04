const ExchangeService = require('../services/ExchangeService')
const { response: { ok, badRequest } } = require('@kln/shared')

const checkExchangeable = async (req, res, next) => {
  try {
    const result = await ExchangeService.checkExchangeable(parseInt(req.params.idVe))
    ok(res, result)
  } catch (err) { next(err) }
}

const exchangeTicket = async (req, res, next) => {
  try {
    const { idVeCu, newTicketData } = req.body
    if (!idVeCu || !newTicketData) return badRequest(res, 'Thiếu thông tin đổi vé')
    const result = await ExchangeService.exchangeTicket(idVeCu, newTicketData)
    ok(res, result, 'Đổi vé thành công')
  } catch (err) { next(err) }
}

module.exports = { checkExchangeable, exchangeTicket }
