const NotificationRepo = require('../repositories/NotificationRepository')

// ── Người dùng (FR_User/FR_Dispatcher) ──
const getMyNotifications = async (idTaiKhoan) => {
  const items = await NotificationRepo.findByTaiKhoan(idTaiKhoan, 50)
  const soChuaDoc = items.filter(t => !t.da_doc).length
  return { items, soChuaDoc }
}

const markAsRead = async (idThongBao, idTaiKhoan) => {
  const tb = await NotificationRepo.findByIdAndTaiKhoan(idThongBao, idTaiKhoan)
  if (!tb) throw { status: 404, message: 'Không tìm thấy thông báo' }
  if (!tb.da_doc) await tb.update({ da_doc: true })
}

const markAllAsRead = (idTaiKhoan) => NotificationRepo.markAllAsRead(idTaiKhoan)

// ── Admin (FR_Admin) ──
const sendBroadcastNotification = ({ tieu_de, noi_dung, loai, lien_ket }) =>
  NotificationRepo.broadcastToAll({ tieu_de, noi_dung, loai, lien_ket })

const sendGroupNotification = async ({ vai_tro, tieu_de, noi_dung, loai, lien_ket }) => {
  await NotificationRepo.broadcastToGroup({ vai_tro, tieu_de, noi_dung, loai, lien_ket })
  return `Đã gửi thông báo đến nhóm ${vai_tro}`
}

const getNotifications = async ({ id_tai_khoan, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit
  const data = await NotificationRepo.getByAccount({ id_tai_khoan, offset, limit })
  const total = await NotificationRepo.countByAccount(id_tai_khoan)
  return { data, pagination: { page, limit, total } }
}

const markAsReadAdmin = ({ id, id_tai_khoan }) => NotificationRepo.markAsReadAdmin({ id, id_tai_khoan })
const getUnreadCount = (id_tai_khoan) => NotificationRepo.countUnread(id_tai_khoan)
const markAllAsReadAdmin = (id_tai_khoan) => NotificationRepo.markAllAsRead(id_tai_khoan)
const deleteNotification = ({ id, id_tai_khoan }) => NotificationRepo.deleteNotification({ id, id_tai_khoan })

// ── Internal (gọi từ service khác) ──
const notify = ({ idTaiKhoan, tieuDe, noiDung, loai, lienKet }) =>
  NotificationRepo.createForAccount({ id_tai_khoan: idTaiKhoan, tieu_de: tieuDe, noi_dung: noiDung, loai, lien_ket: lienKet })

module.exports = {
  getMyNotifications, markAsRead, markAllAsRead,
  sendBroadcastNotification, sendGroupNotification, getNotifications,
  markAsReadAdmin, getUnreadCount, markAllAsReadAdmin, deleteNotification,
  notify,
}
