const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const TaiKhoanRepo = require('../repositories/TaiKhoanRepository')

const SALT_ROUNDS = 10
const ADMIN_ROLES = ['quan_tri', 'nhan_vien']

// Token "khách hàng / điều phối viên" — payload { id, email, role }, dùng bởi
// FR_User + FR_Dispatcher (mounted ở /api/auth). Giữ đúng hình dạng cũ.
const signUserToken = (tk) =>
  jwt.sign(
    { id: tk.id_tai_khoan, email: tk.email, role: tk.vai_tro },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '365d' }
  )

// Token "quản trị" — payload { id_tai_khoan, email, vai_tro }, dùng bởi
// FR_Admin (mounted ở /api/admin/auth). Giữ đúng hình dạng cũ.
const signAdminToken = (tk) =>
  jwt.sign(
    { id_tai_khoan: tk.id_tai_khoan, email: tk.email, vai_tro: tk.vai_tro },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

const sanitize = (tk) => ({
  id: tk.id_tai_khoan,
  email: tk.email,
  hoTen: tk.ho_ten,
  soDienThoai: tk.so_dien_thoai,
  ngaySinh: tk.ngay_sinh,
  gioiTinh: tk.gioi_tinh,
  vaiTro: tk.vai_tro,
  ngayTao: tk.ngay_tao,
})

const sanitizeAdmin = (tk) => ({
  id: tk.id_tai_khoan,
  email: tk.email,
  name: tk.ho_ten,
  phone: tk.so_dien_thoai,
  role: tk.vai_tro,
})

// ─── Customer / Dispatcher (mounted /api/auth) ─────────────────────

const register = async ({ email, matKhau, hoTen, soDienThoai }) => {
  const exists = await TaiKhoanRepo.emailExists(email)
  if (exists) throw { status: 400, message: 'Email đã được đăng ký' }

  const hashedPwd = await bcrypt.hash(matKhau, SALT_ROUNDS)
  const taiKhoan = await TaiKhoanRepo.create({
    email: email.toLowerCase().trim(),
    mat_khau: hashedPwd,
    ho_ten: hoTen.trim(),
    so_dien_thoai: soDienThoai || null,
    vai_tro: 'khach_hang',
    trang_thai: 'hoat_dong',
  })

  return { token: signUserToken(taiKhoan), user: sanitize(taiKhoan) }
}

const login = async ({ email, matKhau }) => {
  const taiKhoan = await TaiKhoanRepo.findByEmail(email)
  if (!taiKhoan) throw { status: 401, message: 'Email hoặc mật khẩu không đúng' }
  if (taiKhoan.trang_thai !== 'hoat_dong') throw { status: 403, message: 'Tài khoản đã bị khóa' }

  const valid = await bcrypt.compare(matKhau, taiKhoan.mat_khau)
  if (!valid) throw { status: 401, message: 'Email hoặc mật khẩu không đúng' }

  return { token: signUserToken(taiKhoan), user: sanitize(taiKhoan) }
}

const getProfile = async (idTaiKhoan) => {
  const taiKhoan = await TaiKhoanRepo.findById(idTaiKhoan)
  if (!taiKhoan) throw { status: 404, message: 'Không tìm thấy tài khoản' }
  return sanitize(taiKhoan)
}

const updateProfile = async (idTaiKhoan, data) => {
  const allowed = ['ho_ten', 'so_dien_thoai', 'ngay_sinh', 'gioi_tinh']
  const update = {}
  allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k] })
  await TaiKhoanRepo.update(idTaiKhoan, update, 'id_tai_khoan')
  return getProfile(idTaiKhoan)
}

const changePassword = async (idTaiKhoan, { matKhauCu, matKhauMoi }) => {
  const taiKhoan = await TaiKhoanRepo.findById(idTaiKhoan)
  const valid = await bcrypt.compare(matKhauCu, taiKhoan.mat_khau)
  if (!valid) throw { status: 400, message: 'Mật khẩu cũ không đúng' }
  const hashed = await bcrypt.hash(matKhauMoi, SALT_ROUNDS)
  await TaiKhoanRepo.update(idTaiKhoan, { mat_khau: hashed }, 'id_tai_khoan')
}

const refreshToken = async (idTaiKhoan) => {
  const taiKhoan = await TaiKhoanRepo.findById(idTaiKhoan)
  if (!taiKhoan) throw { status: 404, message: 'Không tìm thấy tài khoản' }
  if (taiKhoan.trang_thai !== 'hoat_dong') throw { status: 403, message: 'Tài khoản đã bị khóa' }
  return { token: signUserToken(taiKhoan), user: sanitize(taiKhoan) }
}

// ─── Admin (mounted /api/admin/auth) ────────────────────────────────

const adminLogin = async (email, password) => {
  const user = await TaiKhoanRepo.findByEmail(email)
  if (!user) throw { status: 401, message: 'Email hoặc mật khẩu không đúng' }
  if (user.trang_thai !== 'hoat_dong') throw { status: 401, message: 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên' }

  const isValid = await bcrypt.compare(password, user.mat_khau)
  if (!isValid) throw { status: 401, message: 'Email hoặc mật khẩu không đúng' }

  if (!ADMIN_ROLES.includes(user.vai_tro)) {
    throw { status: 403, message: 'Tài khoản không có quyền truy cập hệ thống quản trị' }
  }

  return { token: signAdminToken(user), user: sanitizeAdmin(user) }
}

const adminRegister = async ({ email, password, ho_ten, so_dien_thoai, ngay_sinh, gioi_tinh }) => {
  const exists = await TaiKhoanRepo.emailExists(email)
  if (exists) throw { status: 400, message: 'Email đã được đăng ký' }

  const mat_khau = await bcrypt.hash(password, SALT_ROUNDS)
  const taiKhoan = await TaiKhoanRepo.create({
    email: email.toLowerCase().trim(),
    mat_khau, ho_ten, so_dien_thoai, ngay_sinh, gioi_tinh,
    vai_tro: 'khach_hang',
    trang_thai: 'hoat_dong',
  })
  return { id_tai_khoan: taiKhoan.id_tai_khoan }
}

const adminGetProfile = async (userId) => {
  const user = await TaiKhoanRepo.findById(userId)
  if (!user) throw { status: 404, message: 'Không tìm thấy người dùng' }
  return {
    id_tai_khoan: user.id_tai_khoan,
    email: user.email,
    ho_ten: user.ho_ten,
    so_dien_thoai: user.so_dien_thoai,
    ngay_sinh: user.ngay_sinh,
    gioi_tinh: user.gioi_tinh,
    vai_tro: user.vai_tro,
    ngay_tao: user.ngay_tao,
  }
}

const adminUpdateProfile = async (userId, data) => {
  const allowed = ['ho_ten', 'so_dien_thoai', 'ngay_sinh', 'gioi_tinh']
  const update = {}
  allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k] })
  await TaiKhoanRepo.update(userId, update, 'id_tai_khoan')
}

const adminChangePassword = async (userId, { old_password, new_password }) => {
  if (new_password.length < 6) throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' }
  const user = await TaiKhoanRepo.findById(userId)
  const isValid = await bcrypt.compare(old_password, user.mat_khau)
  if (!isValid) throw { status: 400, message: 'Mật khẩu cũ không đúng' }
  const newHash = await bcrypt.hash(new_password, SALT_ROUNDS)
  await TaiKhoanRepo.update(userId, { mat_khau: newHash }, 'id_tai_khoan')
}

// Quên mật khẩu: tạo reset token JWT 1 giờ. Không tiết lộ email có tồn tại hay không.
const adminForgotPassword = async (email) => {
  const user = await TaiKhoanRepo.findOne({ email: email.toLowerCase().trim(), trang_thai: 'hoat_dong' })
  if (!user) return null
  return jwt.sign({ id_tai_khoan: user.id_tai_khoan, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' })
}

const adminResetPassword = async ({ token, new_password }) => {
  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (e) {
    if (e.name === 'TokenExpiredError') throw { status: 400, message: 'Link đã hết hạn, vui lòng thử lại' }
    throw { status: 400, message: 'Token không hợp lệ' }
  }
  if (decoded.type !== 'reset') throw { status: 400, message: 'Token không hợp lệ' }
  const hashedPassword = await bcrypt.hash(new_password, SALT_ROUNDS)
  await TaiKhoanRepo.update(decoded.id_tai_khoan, { mat_khau: hashedPassword }, 'id_tai_khoan')
}

const adminRefreshToken = async (userId) => {
  const user = await TaiKhoanRepo.findOne({ id_tai_khoan: userId, trang_thai: 'hoat_dong' })
  if (!user) throw { status: 401, message: 'Tài khoản không tồn tại hoặc đã bị khóa' }
  return signAdminToken(user)
}

module.exports = {
  register, login, getProfile, updateProfile, changePassword, refreshToken,
  adminLogin, adminRegister, adminGetProfile, adminUpdateProfile,
  adminChangePassword, adminForgotPassword, adminResetPassword, adminRefreshToken,
}
