const TicketService = require('../services/TicketAdminService')

const getAllTickets = async (req, res) => {
  try { res.json({ success: true, data: await TicketService.getAllTickets() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getTicketById = async (req, res) => {
  try { res.json({ success: true, data: await TicketService.getTicketById(req.params.id) }) }
  catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const cancelTicket = async (req, res) => {
  try {
    const result = await TicketService.cancelTicket(req.params.id, req.body.ly_do)
    res.json({ success: true, message: `Hủy vé thành công. Hoàn tiền: ${result.tongTienHoan.toLocaleString('vi-VN')}đ`, data: result })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message || 'Lỗi hủy vé' }) }
}

const confirmTicket = async (req, res) => {
  try {
    await TicketService.confirmTicket(req.params.id)
    res.json({ success: true, message: 'Xác nhận vé đã sử dụng thành công' })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const autoUpdateTicketStatus = async (req, res) => {
  try {
    await TicketService.autoUpdateTicketStatus(req.params.id)
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const bulkUpdateExpiredTickets = async (req, res) => {
  try {
    const result = await TicketService.bulkUpdateExpiredTickets()
    res.json({ success: true, message: `Đã cập nhật ${result.updated_count} vé thành đã sử dụng`, ...result })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getTicketStats = async (req, res) => {
  try { res.json({ success: true, data: await TicketService.getTicketStats() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

module.exports = { getAllTickets, getTicketById, cancelTicket, confirmTicket, autoUpdateTicketStatus, bulkUpdateExpiredTickets, getTicketStats }
