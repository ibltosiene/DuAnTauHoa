const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const VaiTro = sequelize.define('VaiTro', {
  id_vai_tro:   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_vai_tro:   { type: DataTypes.STRING(30), allowNull: false, unique: true },
  ten_vai_tro:  { type: DataTypes.STRING(100), allowNull: false },
  mo_ta:        { type: DataTypes.STRING(500) },
  trang_thai:   { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'hoat_dong' },
}, { tableName: 'VaiTro', timestamps: false })

module.exports = VaiTro
