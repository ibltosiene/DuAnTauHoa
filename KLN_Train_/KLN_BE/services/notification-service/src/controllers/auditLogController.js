const AuditLogRepo = require('../repositories/AuditLogRepository')

// Mounted ở /api/admin/users/audit-logs — FR_Admin.
const getAuditLogs = async (req, res) => {
  try { res.json({ success: true, data: await AuditLogRepo.getAuditLogs(req.query) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

module.exports = { getAuditLogs }
