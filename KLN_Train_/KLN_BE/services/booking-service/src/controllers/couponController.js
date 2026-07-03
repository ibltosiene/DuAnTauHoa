const CouponService = require('../services/CouponService')

const getAllCoupons = async (req, res) => {
  try { res.json({ success: true, data: await CouponService.getAllCoupons() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getCouponById = async (req, res) => {
  try { res.json({ success: true, data: await CouponService.getCouponById(req.params.id) }) }
  catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const createCoupon = async (req, res) => {
  try {
    await CouponService.createCoupon(req.body)
    res.status(201).json({ success: true, message: 'Thêm khuyến mãi thành công' })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const updateCoupon = async (req, res) => {
  try {
    await CouponService.updateCoupon(req.params.id, req.body)
    res.json({ success: true, message: 'Cập nhật thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const deleteCoupon = async (req, res) => {
  try {
    await CouponService.deleteCoupon(req.params.id)
    res.json({ success: true, message: 'Xóa thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

module.exports = { getAllCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon }
