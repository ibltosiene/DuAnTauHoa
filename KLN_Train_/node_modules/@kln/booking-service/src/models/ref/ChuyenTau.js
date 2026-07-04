// READ-ONLY — thuộc Railway Operation Service.
const { DataTypes } = require('sequelize')
const { sequelize } = require('../../config/database')

const ChuyenTau = sequelize.define('ChuyenTau', {
  id_chuyen:    { type: DataTypes.INTEGER, primaryKey: true },
  id_lich_chay: { type: DataTypes.INTEGER },
  ngay_chay:    { type: DataTypes.DATEONLY },
  trang_thai:   { type: DataTypes.STRING(25) },
}, { tableName: 'ChuyenTau', timestamps: false })

module.exports = ChuyenTau
