const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const VaiTroQuyen = sequelize.define('VaiTroQuyen', {
  id_vai_tro: { type: DataTypes.INTEGER, primaryKey: true },
  id_quyen:   { type: DataTypes.INTEGER, primaryKey: true },
}, { tableName: 'VaiTroQuyen', timestamps: false })

module.exports = VaiTroQuyen
