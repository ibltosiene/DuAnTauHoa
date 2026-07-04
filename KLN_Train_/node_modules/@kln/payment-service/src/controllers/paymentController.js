const PaymentService = require('../services/PaymentService')
const { response: { ok, created, badRequest } } = require('@kln/shared')

const createPayment = async (req, res, next) => {
  try {
    const { idDonDatVe, phuongThuc } = req.body
    if (!idDonDatVe) return badRequest(res, 'Thiếu idDonDatVe')
    const result = await PaymentService.createPayment(idDonDatVe, phuongThuc)
    created(res, result, 'Tạo giao dịch thanh toán thành công')
  } catch (err) { next(err) }
}

const confirmPayment = async (req, res, next) => {
  try {
    const result = await PaymentService.confirmPayment(parseInt(req.params.idThanhToan))
    ok(res, result, 'Xác nhận thanh toán thành công')
  } catch (err) { next(err) }
}

const getPaymentStatus = async (req, res, next) => {
  try {
    const result = await PaymentService.getPaymentStatus(parseInt(req.params.idThanhToan))
    ok(res, result)
  } catch (err) { next(err) }
}

const receiveWebhook = async (req, res, next) => {
  try {
    const token = req.headers['authorization'] || req.headers['x-sepay-token'] || ''
    const expected = process.env.SEPAY_WEBHOOK_TOKEN
    if (expected && token.replace('Bearer ', '') !== expected) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }
    await PaymentService.processWebhook(req.body)
    res.json({ success: true })
  } catch (err) { next(err) }
}

const devConfirm = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') return badRequest(res, 'Không khả dụng')
    const result = await PaymentService.devConfirmByMaDon(req.params.maDon)
    ok(res, result, 'Dev confirm thành công')
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    next(err)
  }
}

module.exports = { createPayment, confirmPayment, getPaymentStatus, receiveWebhook, devConfirm }
