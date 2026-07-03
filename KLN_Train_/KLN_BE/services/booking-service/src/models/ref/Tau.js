// READ-ONLY — thuộc Railway Operation Service.
const { DataTypes } = require('sequelize')
const { sequelize } = require('../../config/database')

const Tau = sequelize.define('Tau', {
  id_tau:  { type: DataTypes.INTEGER, primaryKey: true },
  so_hieu: { type: DataTypes.STRING(20) },
  ten_tau: { type: DataTypes.STRING(100) },
}, { tableName: 'Tau', timestamps: false })

module.exports = Tau
