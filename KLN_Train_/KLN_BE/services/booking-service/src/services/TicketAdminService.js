const { serviceClient } = require('@kln/shared')
const TicketRepo = require('../repositories/TicketAdminRepository')
const { cancelTickets } = require('./CancelService')

const auditLog = (id, log) =>
  serviceClient.post('notification', '/internal/audit-log', {
    bang: 'Ve', maBanGhi: String(id), hanhDong: 'UPDATE', giaTriMoi: log,
  }).catch(() => {})

const getAllTickets = () => TicketRepo.getAll()

const getTicketById = async (id) => {
  const ticket = await TicketRepo.findById(id)
  if (!ticket) throw { status: 404, message: 'Không tìm thấy vé' }
  return ticket
}

const cancelTicket = async (id, ly_do) => {
  const info = await TicketRepo.getStatusInfo(id)
  if (!info) throw { status: 404, message: 'Không tìm thấy vé' }

  if (info.trang_thai !== 'da_xac_nhan' && info.trang_thai !== 'hieu_luc') {
    throw { status: 400, message: 'Vé không thể hủy ở trạng thái hiện tại' }
  }
  if (!['da_thanh_toan', 'da_xac_nhan'].includes(info.trang_thai_don)) {
    throw { status: 400, message: 'Đơn đặt vé chưa thanh toán, không thể hủy' }
  }

  const result = await cancelTickets(info.ma_dat_cho, [parseInt(id)], ly_do || 'Admin hủy vé')
  await auditLog(id, { trang_thai: 'da_huy', ly_do: ly_do || 'Không có lý do' })
  return result
}

const confirmTicket = async (id) => {
  const info = await TicketRepo.getStatusInfo(id)
  if (!info) throw { status: 404, message: 'Không tìm thấy vé' }
  if (info.trang_thai !== 'hieu_luc' && info.trang_thai !== 'da_xac_nhan') {
    throw { status: 400, message: 'Vé không ở trạng thái có hiệu lực để xác nhận' }
  }
  await TicketRepo.updateStatus(id, 'da_su_dung')
  await auditLog(id, { trang_thai: 'da_su_dung' })
}

const autoUpdateTicketStatus = (id) => TicketRepo.markExpiredById(id)

const bulkUpdateExpiredTickets = async () => {
  const count = await TicketRepo.bulkMarkExpired()
  return { updated_count: count }
}

const getTicketStats = () => TicketRepo.getStats()

module.exports = { getAllTickets, getTicketById, cancelTicket, confirmTicket, autoUpdateTicketStatus, bulkUpdateExpiredTickets, getTicketStats }
