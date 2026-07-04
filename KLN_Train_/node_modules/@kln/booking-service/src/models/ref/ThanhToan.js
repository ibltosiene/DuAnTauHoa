// READ-ONLY — thuộc Payment Service. Booking chỉ đọc để hiển thị trạng thái
// thanh toán trong chi tiết đơn; việc tạo/cập nhật đi qua payment-service.
const { DataTypes } = require('sequelize')
const { sequelize } = require('../../config/database')

const ThanhToan = sequelize.define('ThanhToan', {
  id_thanh_toan: { type: DataTypes.INTEGER, primaryKey: true },
  ma_giao_dich:  { type: DataTypes.STRING(30) },
  id_don_dat_ve: { type: DataTypes.INTEGER },
  phuong_thuc:   { type: DataTypes.STRING(30) },
  so_tien:       { type: DataTypes.DECIMAL(15, 2) },
  trang_thai:    { type: DataTypes.STRING(25) },
  thoi_gian_tao: { type: DataTypes.DATE },
  thoi_gian_thanh_toan: { type: DataTypes.DATE },
}, { tableName: 'ThanhToan', timestamps: false })

module.exports = ThanhToan
