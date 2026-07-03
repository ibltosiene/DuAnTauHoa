const { sequelize } = require('../config/database')

const ThanhToan = require('./ThanhToan')
const HoaDon = require('./HoaDon')
const HoanTien = require('./HoanTien')
const DonDatVe = require('./ref/DonDatVe')

ThanhToan.belongsTo(DonDatVe, { foreignKey: 'id_don_dat_ve' })
DonDatVe.hasMany(ThanhToan, { foreignKey: 'id_don_dat_ve' })
ThanhToan.hasOne(HoaDon, { foreignKey: 'id_thanh_toan' })
HoaDon.belongsTo(ThanhToan, { foreignKey: 'id_thanh_toan' })
HoaDon.belongsTo(DonDatVe, { foreignKey: 'id_don_dat_ve' })
HoanTien.belongsTo(ThanhToan, { foreignKey: 'id_thanh_toan' })

module.exports = { sequelize, ThanhToan, HoaDon, HoanTien, DonDatVe }
