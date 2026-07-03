const { sequelize } = require('../config/database')

const ThongBao = require('./ThongBao')
const AuditLog = require('./AuditLog')

module.exports = { sequelize, ThongBao, AuditLog }
