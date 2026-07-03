const { sequelize } = require('../config/database')

const TaiKhoan = require('./TaiKhoan')
const VaiTro = require('./VaiTro')
const Quyen = require('./Quyen')
const TaiKhoanVaiTro = require('./TaiKhoanVaiTro')
const VaiTroQuyen = require('./VaiTroQuyen')

// TaiKhoan <-> VaiTro (nhiều-nhiều qua TaiKhoanVaiTro)
TaiKhoan.belongsToMany(VaiTro, { through: TaiKhoanVaiTro, foreignKey: 'id_tai_khoan', otherKey: 'id_vai_tro' })
VaiTro.belongsToMany(TaiKhoan, { through: TaiKhoanVaiTro, foreignKey: 'id_vai_tro', otherKey: 'id_tai_khoan' })
TaiKhoan.hasMany(TaiKhoanVaiTro, { foreignKey: 'id_tai_khoan' })
TaiKhoanVaiTro.belongsTo(TaiKhoan, { foreignKey: 'id_tai_khoan' })
TaiKhoanVaiTro.belongsTo(VaiTro, { foreignKey: 'id_vai_tro' })
VaiTro.hasMany(TaiKhoanVaiTro, { foreignKey: 'id_vai_tro' })

// VaiTro <-> Quyen (nhiều-nhiều qua VaiTroQuyen)
VaiTro.belongsToMany(Quyen, { through: VaiTroQuyen, foreignKey: 'id_vai_tro', otherKey: 'id_quyen' })
Quyen.belongsToMany(VaiTro, { through: VaiTroQuyen, foreignKey: 'id_quyen', otherKey: 'id_vai_tro' })

module.exports = { sequelize, TaiKhoan, VaiTro, Quyen, TaiKhoanVaiTro, VaiTroQuyen }
