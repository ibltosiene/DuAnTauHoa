const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const TaiKhoanVaiTro = sequelize.define('TaiKhoanVaiTro', {
  id_tai_khoan: { type: DataTypes.INTEGER, primaryKey: true },
  id_vai_tro:   { type: DataTypes.INTEGER, primaryKey: true },
  nguoi_cap:    { type: DataTypes.INTEGER },
  ngay_tao:     { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal('GETDATE()') },
}, { tableName: 'TaiKhoanVaiTro', timestamps: false })

module.exports = TaiKhoanVaiTro
