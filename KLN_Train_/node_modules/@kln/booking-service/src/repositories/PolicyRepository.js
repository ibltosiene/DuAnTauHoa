const { ChinhSachGia, ChinhSachHuy } = require('../models')

// Chỉ ChinhSachGia (customer-discounts) + ChinhSachHuy (cancel-fees) —
// BieuGia (occasion-policies)/hệ số ghế thuộc railway-service.

const getCustomerDiscounts = () => ChinhSachGia.findAll({
  attributes: ['id_chinh_sach', 'ten_chinh_sach', 'loai_hanh_khach', 'phan_tram_giam'],
  order: [['phan_tram_giam', 'ASC']],
})

const updateCustomerDiscount = (id, phan_tram_giam) =>
  ChinhSachGia.update({ phan_tram_giam }, { where: { id_chinh_sach: id } })

const createCustomerDiscount = ({ ten_chinh_sach, loai_hanh_khach, phan_tram_giam, tu_ngay, den_ngay }) =>
  ChinhSachGia.create({ ten_chinh_sach, loai_hanh_khach, phan_tram_giam, tu_ngay: tu_ngay || null, den_ngay: den_ngay || null })

const getCancelFees = () => ChinhSachHuy.findAll({
  attributes: ['id_cs_huy', 'gio_truoc_gio_chay', 'phi_huy'],
  order: [['gio_truoc_gio_chay', 'DESC']],
})

const updateCancelFee = (id, phi_huy) => ChinhSachHuy.update({ phi_huy }, { where: { id_cs_huy: id } })

const createCancelFee = ({ gio_truoc_gio_chay, phi_huy }) => ChinhSachHuy.create({ gio_truoc_gio_chay, phi_huy })

module.exports = { getCustomerDiscounts, updateCustomerDiscount, createCustomerDiscount, getCancelFees, updateCancelFee, createCancelFee }
