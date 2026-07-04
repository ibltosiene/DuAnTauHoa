const RefundService = require('../services/RefundService')

const getAllRefunds = async (req, res) => {
  try { res.json({ success: true, data: await RefundService.getAllRefunds() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const confirmRefund = async (req, res) => {
  try {
    await RefundService.confirmRefund(req.params.id)
    res.json({ success: true, message: 'Xác nhận hoàn tiền thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const rejectRefund = async (req, res) => {
  try {
    await RefundService.rejectRefund(req.params.id)
    res.json({ success: true, message: 'Từ chối hoàn tiền thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getRefundById = async (req, res) => {
  try {
    const data = await RefundService.getRefundById(req.params.id)
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu hoàn tiền' })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getRefundStats = async (req, res) => {
  try { res.json({ success: true, data: await RefundService.getRefundStats() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

module.exports = { getAllRefunds, getRefundById, confirmRefund, rejectRefund, getRefundStats }
