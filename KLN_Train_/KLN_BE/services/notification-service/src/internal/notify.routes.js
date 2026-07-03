const router = require('express').Router()
const { requireInternalKey, response: { ok } } = require('@kln/shared')
const NotificationService = require('../services/NotificationService')
const AuditLogRepo = require('../repositories/AuditLogRepository')

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

module.exports = router
