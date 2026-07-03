const UserService = require('../services/UserService')

// Mounted ở /api/admin/users — dùng bởi FR_Admin (quản lý tài khoản nội bộ).

const getAllUsers = async (req, res) => {
  try {
    const data = await UserService.getAllUsers()
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const getUserById = async (req, res) => {
  try {
    const data = await UserService.getUserById(req.params.id)
    res.json({ success: true, data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message })
  }
}

const createUser = async (req, res) => {
  try {
    const data = await UserService.createUser(req.body)
    res.status(201).json({ success: true, message: 'Thêm người dùng thành công', data })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message })
  }
}

const updateUser = async (req, res) => {
  try {
    await UserService.updateUser(req.params.id, req.body)
    res.json({ success: true, message: 'Cập nhật thành công' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const updateUserStatus = async (req, res) => {
  try {
    await UserService.updateUserStatus(req.params.id, req.body.trang_thai)
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const resetPassword = async (req, res) => {
  try {
    await UserService.resetPassword(req.params.id)
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

const deleteUser = async (req, res) => {
  try {
    await UserService.deleteUser(req.params.id)
    res.json({ success: true, message: 'Xóa thành công' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, updateUserStatus, resetPassword, deleteUser }
