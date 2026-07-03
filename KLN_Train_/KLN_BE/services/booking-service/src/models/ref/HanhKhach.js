// READ-ONLY — thuộc Customer Service. Booking chỉ đọc để hiển thị; việc
// tạo/cập nhật hành khách đi qua customer-service (/internal/passengers/*).
const { DataTypes } = require('sequelize')
const { sequelize } = require('../../config/database')

const HanhKhach = sequelize.define('HanhKhach', {
  id_hanh_khach: { type: DataTypes.INTEGER, primaryKey: true },
  ho_ten:        { type: DataTypes.STRING(150) },
  ngay_sinh:     { type: DataTypes.DATEONLY },
  cccd:          { type: DataTypes.STRING(20) },
}, { tableName: 'HanhKhach', timestamps: false })

module.exports = HanhKhach
