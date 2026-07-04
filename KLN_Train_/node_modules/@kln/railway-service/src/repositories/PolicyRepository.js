const { sequelize } = require('../config/database')
const { BieuGia, LoaiGhe } = require('../models')

// Chỉ phần BieuGia (occasion-policies/base-price) + LoaiGhe (seat-factors) —
// ChinhSachGia/ChinhSachHuy thuộc Booking Service (xem booking-service).

const getOccasionPolicies = () => BieuGia.findAll({
  attributes: ['id_bieu_gia', 'ten_dip', 'he_so_tang', 'ngay_bat_dau', 'ngay_ket_thuc'],
  where: { trang_thai: 'dang_ap_dung' },
  order: [['he_so_tang', 'ASC']],
})

const updateOccasionPolicy = (id, he_so_tang) => BieuGia.update({ he_so_tang }, { where: { id_bieu_gia: id } })

const createOccasionPolicy = ({ ten_dip, he_so_tang, ngay_bat_dau, ngay_ket_thuc, don_gia_km_goc }) =>
  BieuGia.create({
    ten_dip, ngay_bat_dau, ngay_ket_thuc, he_so_tang,
    don_gia_km_goc: don_gia_km_goc || 540,
    trang_thai: 'dang_ap_dung',
  })

const getBasePrice = async () => {
  const rows = await sequelize.query(`
    SELECT TOP 1 don_gia_km_goc AS don_gia, ngay_bat_dau AS tu_ngay
    FROM BieuGia
    WHERE he_so_tang = 1.0 AND trang_thai = 'dang_ap_dung'
    ORDER BY ngay_bat_dau DESC
  `, { type: sequelize.QueryTypes.SELECT })
  return rows[0] || null
}

const getSeatFactors = () => LoaiGhe.findAll({
  attributes: ['id_loai_ghe', 'ten_loai_ghe', 'he_so_gia'],
  where: { trang_thai: 'dang_ban' },
  order: [['he_so_gia', 'ASC']],
})

module.exports = { getOccasionPolicies, updateOccasionPolicy, createOccasionPolicy, getBasePrice, getSeatFactors }
