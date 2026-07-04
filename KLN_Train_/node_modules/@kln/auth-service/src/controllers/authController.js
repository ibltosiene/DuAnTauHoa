const { validationResult } = require('express-validator')
const { response: { ok, created, badRequest } } = require('@kln/shared')
const AuthService = require('../services/AuthService')

// Mounted ở /api/auth — dùng bởi FR_User + FR_Dispatcher.

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Dữ liệu không hợp lệ', errors.array())

    const { email, matKhau, hoTen, soDienThoai } = req.body
    const result = await AuthService.register({ email, matKhau, hoTen, soDienThoai })
    created(res, result, 'Đăng ký thành công')
  } catch (err) { next(err) }
}

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return badRequest(res, 'Dữ liệu không hợp lệ', errors.array())

    const { email, matKhau } = req.body
    const result = await AuthService.login({ email, matKhau })
    ok(res, result, 'Đăng nhập thành công')
  } catch (err) { next(err) }
}

const getProfile = async (req, res, next) => {
  try {
    const user = await AuthService.getProfile(req.user.userId)
    ok(res, user)
  } catch (err) { next(err) }
}

const updateProfile = async (req, res, next) => {
  try {
    const user = await AuthService.updateProfile(req.user.userId, req.body)
    ok(res, user, 'Cập nhật thông tin thành công')
  } catch (err) { next(err) }
}

const changePassword = async (req, res, next) => {
  try {
    const { matKhauCu, matKhauMoi } = req.body
    await AuthService.changePassword(req.user.userId, { matKhauCu, matKhauMoi })
    ok(res, null, 'Đổi mật khẩu thành công')
  } catch (err) { next(err) }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await AuthService.refreshToken(req.user.userId)
    ok(res, result, 'Gia hạn token thành công')
  } catch (err) { next(err) }
}

module.exports = { register, login, getProfile, updateProfile, changePassword, refreshToken }
