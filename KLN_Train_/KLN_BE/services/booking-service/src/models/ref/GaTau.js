// Model tham chiếu READ-ONLY — bảng GaTau thuộc Railway Operation Service.
// Booking chỉ SELECT (qua include) để hiển thị chi tiết đơn/vé, không bao
// giờ create/update/destroy model này.
const { DataTypes } = require('sequelize')
const { sequelize } = require('../../config/database')

const GaTau = sequelize.define('GaTau', {
  id_ga:          { type: DataTypes.INTEGER, primaryKey: true },
  ma_ga_viet_tat: { type: DataTypes.STRING(10) },
  ten_ga:         { type: DataTypes.STRING(50) },
  tinh_thanh:     { type: DataTypes.STRING(50) },
}, { tableName: 'GaTau', timestamps: false })

module.exports = GaTau
