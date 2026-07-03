const PolicyService = require('../services/PolicyService')

const getOccasionPolicies = async (req, res) => {
  try { res.json({ success: true, data: await PolicyService.getOccasionPolicies() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const updateOccasionPolicy = async (req, res) => {
  try {
    await PolicyService.updateOccasionPolicy(req.params.id, req.body.he_so_tang)
    res.json({ success: true, message: 'Cập nhật thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const createOccasionPolicy = async (req, res) => {
  try {
    const data = await PolicyService.createOccasionPolicy(req.body)
    res.json({ success: true, message: 'Thêm biểu giá thành công', data })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const getBasePrice = async (req, res) => {
  try { res.json({ success: true, data: await PolicyService.getBasePrice() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getSeatFactors = async (req, res) => {
  try { res.json({ success: true, data: await PolicyService.getSeatFactors() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

module.exports = { getOccasionPolicies, updateOccasionPolicy, createOccasionPolicy, getBasePrice, getSeatFactors }
