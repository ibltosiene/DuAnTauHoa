const router = require('express').Router()
const { requireInternalKey } = require('@kln/shared')
const TaiKhoanRepo = require('../repositories/TaiKhoanRepository')

// Route nội bộ cho service khác (không đi qua Gateway, không dùng JWT người
// dùng) — ví dụ Booking/Payment/Notification cần tra tên/email tài khoản.
router.use(requireInternalKey)

router.get('/accounts/:id', async (req, res) => {
  const tk = await TaiKhoanRepo.findById(req.params.id)
  if (!tk) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' })
  res.json({
    success: true,
    data: {
      id_tai_khoan: tk.id_tai_khoan,
      email: tk.email,
      ho_ten: tk.ho_ten,
      so_dien_thoai: tk.so_dien_thoai,
      vai_tro: tk.vai_tro,
      trang_thai: tk.trang_thai,
    },
  })
})

module.exports = router
