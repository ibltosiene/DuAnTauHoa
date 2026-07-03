const { sequelize } = require('../config/database')

const HanhKhach = require('./HanhKhach')
const PhanHoi = require('./PhanHoi')

// HanhKhach và PhanHoi không có quan hệ FK trực tiếp với nhau (cả hai đều
// tham chiếu id_tai_khoan/id_ve thuộc các service khác) — không cần association.

module.exports = { sequelize, HanhKhach, PhanHoi }
