const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Quyen = sequelize.define('Quyen', {
  id_quyen:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ma_quyen:    { type: DataTypes.STRING(60), allowNull: false, unique: true },
  ten_quyen:   { type: DataTypes.STRING(150), allowNull: false },
  nhom_quyen:  { type: DataTypes.STRING(50) },
  mo_ta:       { type: DataTypes.STRING(500) },
}, { tableName: 'Quyen', timestamps: false })

module.exports = Quyen
