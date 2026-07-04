const AuthService = require('../services/AuthService')

// Mounted ở /api/admin/auth — dùng bởi FR_Admin. Giữ đúng response shape cũ
// (src/admin/controllers/authController.js) vì FR_Admin đọc trực tiếp
// `res.data.token` / `res.data.user` theo hình dạng này.

const login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' })
  }
  try {
    const result = await AuthService.adminLogin(email, password)
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message || 'Lỗi server' })
  }
}

const register = async (req, res) => {
  const { email, password, ho_ten } = req.body
  if (!email || !password || !ho_ten) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc' })
  }
  try {
    const data = await AuthService.adminRegister(req.body)
    res.status(201).json({ success: true, message: 'Đăng ký thành công', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message })
  }
}

const getProfile = async (req, res) => {
  try {
    const data = await AuthService.adminGetProfile(req.user.userId)
    res.json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message })
  }
}

const updateProfile = async (req, res) => {
  try {
    await AuthService.adminUpdateProfile(req.user.userId, req.body)
    res.json({ success: true, message: 'Cập nhật thông tin thành công' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const changePassword = async (req, res) => {
  const { old_password, new_password } = req.body
  if (!old_password || !new_password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' })
  }
  try {
    await AuthService.adminChangePassword(req.user.userId, { old_password, new_password })
    res.json({ success: true, message: 'Đổi mật khẩu thành công' })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message })
  }
}

const forgotPassword = async (req, res) => {
  try {
    await AuthService.adminForgotPassword(req.body.email)
    res.json({ success: true, message: 'Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const resetPassword = async (req, res) => {
  try {
    await AuthService.adminResetPassword(req.body)
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message })
  }
}

const refreshToken = async (req, res) => {
  try {
    const token = await AuthService.adminRefreshToken(req.user.userId)
    res.json({ success: true, token })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message })
  }
}

const logout = async (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' })
}

module.exports = { login, register, getProfile, updateProfile, changePassword, forgotPassword, resetPassword, refreshToken, logout }
