const NotificationService = require('../services/NotificationService')
const { response: { ok, notFound } } = require('@kln/shared')

// Mounted ở /api/notifications — FR_User + FR_Dispatcher.
const getMyNotifications = async (req, res, next) => {
  try {
    const data = await NotificationService.getMyNotifications(req.user.userId)
    ok(res, data)
  } catch (err) { next(err) }
}

const markAsRead = async (req, res, next) => {
  try {
    await NotificationService.markAsRead(req.params.id, req.user.userId)
    ok(res, null, 'Đã đánh dấu đã đọc')
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const markAllAsRead = async (req, res, next) => {
  try {
    await NotificationService.markAllAsRead(req.user.userId)
    ok(res, null, 'Đã đánh dấu tất cả là đã đọc')
  } catch (err) { next(err) }
}

module.exports = { getMyNotifications, markAsRead, markAllAsRead }
