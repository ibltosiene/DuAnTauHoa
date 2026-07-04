const PolicyService = require('../services/PolicyService')

const getCustomerDiscounts = async (req, res) => {
  try { res.json({ success: true, data: await PolicyService.getCustomerDiscounts() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const updateCustomerDiscount = async (req, res) => {
  try {
    await PolicyService.updateCustomerDiscount(req.params.id, req.body.phan_tram_giam)
    res.json({ success: true, message: 'Cập nhật thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const createCustomerDiscount = async (req, res) => {
  try {
    const data = await PolicyService.createCustomerDiscount(req.body)
    res.json({ success: true, message: 'Thêm chính sách giá thành công', data })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const getCancelFees = async (req, res) => {
  try { res.json({ success: true, data: await PolicyService.getCancelFees() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const updateCancelFee = async (req, res) => {
  try {
    await PolicyService.updateCancelFee(req.params.id, req.body.phi_huy)
    res.json({ success: true, message: 'Cập nhật thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const createCancelFee = async (req, res) => {
  try {
    const data = await PolicyService.createCancelFee(req.body)
    res.json({ success: true, message: 'Thêm chính sách hủy thành công', data })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

module.exports = { getCustomerDiscounts, updateCustomerDiscount, createCustomerDiscount, getCancelFees, updateCancelFee, createCancelFee }
