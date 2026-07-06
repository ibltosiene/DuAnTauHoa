const router = require('express').Router()
const { requireInternalKey, response: { ok } } = require('@kln/shared')
const NotificationService = require('../services/NotificationService')
const AuditLogRepo = require('../repositories/AuditLogRepository')
const { sendBookingConfirmation, sendTripEventEmail } = require('../utils/emailService')
// Gọi bởi các service khác (payment/booking/railway...) để gửi thông báo
// hoặc ghi audit log — thay vì tự ghi thẳng vào ThongBao/AuditLog.
router.use(requireInternalKey)

router.post('/notify', async (req, res, next) => {
  try {
    const { idTaiKhoan, tieuDe, noiDung, loai, lienKet } = req.body
    if (!idTaiKhoan) return ok(res, null) // Không có người nhận cụ thể — bỏ qua êm
    await NotificationService.notify({ idTaiKhoan, tieuDe, noiDung, loai, lienKet })
    ok(res, null)
  } catch (err) { next(err) }
})

router.post('/audit-log', async (req, res, next) => {
  try {
    const { bang, maBanGhi, hanhDong, giaTriCu, giaTriMoi, idTaiKhoan, ipAddress, userAgent } = req.body
    await AuditLogRepo.create({
      bang, ma_ban_ghi: maBanGhi, hanh_dong: hanhDong || 'UPDATE',
      gia_tri_cu: giaTriCu, gia_tri_moi: giaTriMoi,
      id_tai_khoan: idTaiKhoan, ip_address: ipAddress, user_agent: userAgent,
    })
    ok(res, null)
  } catch (err) { next(err) }
})


// Gửi email xác nhận đặt vé (gọi bởi payment-service sau khi thanh toán OK)
router.post('/send-booking-email', async (req, res, next) => {
  try {
    const { email, ...bookingData } = req.body
    if (!email) return ok(res, null)
    await sendBookingConfirmation(email, bookingData)
    ok(res, { sent: true })
  } catch (err) {
    console.error(' Gửi email thất bại:', err.message)
    // best-effort — không crash flow thanh toán
    ok(res, { sent: false, error: err.message })
  }
})
// Gửi email báo sự kiện chuyến tàu (trễ giờ/hủy chuyến/bảo trì...) — gọi bởi
// railway-service khi điều phối viên ghi sự kiện hoặc hủy chuyến.
router.post('/send-event-email', async (req, res, next) => {
  try {
    const { email, hoTen, tieuDe, noiDung, maDatCho } = req.body
    if (!email || !tieuDe || !noiDung) return ok(res, null)
    await sendTripEventEmail(email, { hoTen, tieuDe, noiDung, maDatCho })
    ok(res, { sent: true })
  } catch (err) {
    console.error('Gửi email sự kiện chuyến tàu thất bại:', err.message)
    // best-effort — không chặn luồng ghi nhận sự kiện của điều phối viên
    ok(res, { sent: false, error: err.message })
  }
})

module.exports = router