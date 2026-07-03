const PolicyRepository = require('../repositories/PolicyRepository')

const getCustomerDiscounts = () => PolicyRepository.getCustomerDiscounts()
const updateCustomerDiscount = (id, phan_tram_giam) => PolicyRepository.updateCustomerDiscount(id, phan_tram_giam)

const createCustomerDiscount = ({ ten_chinh_sach, loai_hanh_khach, phan_tram_giam, tu_ngay, den_ngay }) => {
  if (!ten_chinh_sach || !loai_hanh_khach || phan_tram_giam === undefined) {
    throw { status: 400, message: 'Thiếu thông tin chính sách' }
  }
  return PolicyRepository.createCustomerDiscount({ ten_chinh_sach, loai_hanh_khach, phan_tram_giam, tu_ngay, den_ngay })
}

const getCancelFees = () => PolicyRepository.getCancelFees()
const updateCancelFee = (id, phi_huy) => PolicyRepository.updateCancelFee(id, phi_huy)

const createCancelFee = ({ gio_truoc_gio_chay, phi_huy }) => {
  if (gio_truoc_gio_chay === undefined || phi_huy === undefined) {
    throw { status: 400, message: 'Thiếu thông tin chính sách hủy' }
  }
  return PolicyRepository.createCancelFee({ gio_truoc_gio_chay, phi_huy })
}

module.exports = { getCustomerDiscounts, updateCustomerDiscount, createCustomerDiscount, getCancelFees, updateCancelFee, createCancelFee }
