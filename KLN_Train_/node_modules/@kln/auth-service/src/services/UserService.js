const bcrypt = require('bcryptjs')
const TaiKhoanRepo = require('../repositories/TaiKhoanRepository')

const SALT_ROUNDS = 10

// Quản lý tài khoản nội bộ (quan_tri, nhan_vien) cho FR_Admin — port từ
// DuAnTauHoaCom/backend/src/admin/services/UserService.js, chuyển raw SQL
// (mssql executeQuery) sang Sequelize.

const getAllUsers = () => TaiKhoanRepo.findStaff()

const getUserById = async (id) => {
  const user = await TaiKhoanRepo.findStaffById(id)
  if (!user) throw { status: 404, message: 'Không tìm thấy người dùng' }
  return user
}

const createUser = async ({ email, password, ho_ten, so_dien_thoai, ngay_sinh, gioi_tinh, vai_tro }) => {
  if (vai_tro !== 'quan_tri' && vai_tro !== 'nhan_vien') {
    throw { status: 400, message: 'Chỉ được tạo tài khoản quản trị hoặc nhân viên' }
  }
  const exists = await TaiKhoanRepo.emailExists(email)
  if (exists) throw { status: 400, message: 'Email đã tồn tại' }

  const mat_khau = await bcrypt.hash(password || '123456', SALT_ROUNDS)
  const taiKhoan = await TaiKhoanRepo.create({
    email: email.toLowerCase().trim(), mat_khau, ho_ten, so_dien_thoai, ngay_sinh, gioi_tinh, vai_tro,
    trang_thai: 'hoat_dong',
  })
  return { id_tai_khoan: taiKhoan.id_tai_khoan }
}

const updateUser = async (id, data) => {
  const allowed = ['ho_ten', 'so_dien_thoai', 'ngay_sinh', 'gioi_tinh', 'vai_tro']
  const update = {}
  allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k] })
  await TaiKhoanRepo.update(id, update, 'id_tai_khoan')
}

const updateUserStatus = async (id, trang_thai) => {
  await TaiKhoanRepo.update(id, { trang_thai }, 'id_tai_khoan')
}

const resetPassword = async (id) => {
  const mat_khau = await bcrypt.hash('123456', SALT_ROUNDS)
  await TaiKhoanRepo.update(id, { mat_khau }, 'id_tai_khoan')
}

const deleteUser = async (id) => {
  await TaiKhoanRepo.delete(id, 'id_tai_khoan')
}

module.exports = { getAllUsers, getUserById, createUser, updateUser, updateUserStatus, resetPassword, deleteUser }
