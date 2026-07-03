const NotificationService = require('../services/NotificationService')

// Mounted ở /api/admin/notifications — FR_Admin.
const sendBroadcastNotification = async (req, res) => {
  try {
    await NotificationService.sendBroadcastNotification(req.body)
    res.json({ success: true, message: 'Đã gửi thông báo đến tất cả người dùng' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const sendGroupNotification = async (req, res) => {
  try {
    const message = await NotificationService.sendGroupNotification(req.body)
    res.json({ success: true, message })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getNotifications = async (req, res) => {
  try {
    const result = await NotificationService.getNotifications({
      id_tai_khoan: req.user.userId, page: req.query.page, limit: req.query.limit,
    })
    res.json({ success: true, ...result })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const markAsRead = async (req, res) => {
  try {
    await NotificationService.markAsReadAdmin({ id: req.params.id, id_tai_khoan: req.user.userId })
    res.json({ success: true, message: 'Đã đánh dấu đã đọc' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getUnreadCount = async (req, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.user.userId)
    res.json({ success: true, data: { count } })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const markAllAsRead = async (req, res) => {
  try {
    await NotificationService.markAllAsReadAdmin(req.user.userId)
    res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const deleteNotification = async (req, res) => {
  try {
    await NotificationService.deleteNotification({ id: req.params.id, id_tai_khoan: req.user.userId })
    res.json({ success: true, message: 'Đã xóa thông báo' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

module.exports = {
  sendBroadcastNotification, sendGroupNotification, getNotifications,
  markAsRead, getUnreadCount, markAllAsRead, deleteNotification,
}
