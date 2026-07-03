// READ-ONLY — thuộc Booking Service. Payment chỉ đọc để validate/hiển thị;
// mọi cập nhật trạng thái đơn đi qua booking-service (/internal/orders/*).
const { DataTypes } = require('sequelize')
const { sequelize } = require('../../config/database')

const DonDatVe = sequelize.define('DonDatVe', {
  id_don_dat_ve:     { type: DataTypes.INTEGER, primaryKey: true },
  id_tai_khoan:      { type: DataTypes.INTEGER },
  ma_don:            { type: DataTypes.STRING(20) },
  ma_dat_cho:        { type: DataTypes.STRING(20) },
  ho_ten_lien_lac:   { type: DataTypes.STRING(100) },
  email_dat_cho:     { type: DataTypes.STRING(255) },
  tong_tien:         { type: DataTypes.DECIMAL(15, 2) },
  tien_giam:         { type: DataTypes.DECIMAL(15, 2) },
  tien_thanh_toan:   { type: DataTypes.DECIMAL(15, 2) },
  trang_thai:        { type: DataTypes.STRING(25) },
  thoi_gian_het_han: { type: DataTypes.DATE },
}, { tableName: 'DonDatVe', timestamps: false })

module.exports = DonDatVe
