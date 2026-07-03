const CouponRepo = require('../repositories/CouponRepository')

const getAllCoupons = () => CouponRepo.findAllOrdered()

const getCouponById = async (id) => {
  const coupon = await CouponRepo.findById(id)
  if (!coupon) throw { status: 404, message: 'Không tìm thấy khuyến mãi' }
  return coupon
}

const createCoupon = async (data) => {
  const existing = await CouponRepo.findByMa(data.ma_khuyen_mai)
  if (existing) throw { status: 400, message: 'Mã khuyến mãi đã tồn tại' }
  return CouponRepo.create({ ...data, da_dung: 0 })
}

const updateCoupon = (id, data) => CouponRepo.update(id, data, 'id_khuyen_mai')

const deleteCoupon = (id) => CouponRepo.delete(id, 'id_khuyen_mai')

module.exports = { getAllCoupons, getCouponById, createCoupon, updateCoupon, deleteCoupon }
