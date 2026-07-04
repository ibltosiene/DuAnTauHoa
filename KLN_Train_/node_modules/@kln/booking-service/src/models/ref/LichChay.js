// READ-ONLY — thuộc Railway Operation Service.
const { DataTypes } = require('sequelize')
const { sequelize } = require('../../config/database')

const LichChay = sequelize.define('LichChay', {
  id_lich_chay:    { type: DataTypes.INTEGER, primaryKey: true },
  id_tau:          { type: DataTypes.INTEGER },
  id_ga_di:        { type: DataTypes.INTEGER },
  id_ga_den:       { type: DataTypes.INTEGER },
  gio_khoi_hanh:   { type: DataTypes.TIME },
  gio_du_kien_den: { type: DataTypes.TIME },
}, { tableName: 'LichChay', timestamps: false })

module.exports = LichChay
