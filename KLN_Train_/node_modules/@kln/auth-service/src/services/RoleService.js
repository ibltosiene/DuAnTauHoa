const { TaiKhoan, VaiTro } = require('../models')
const VaiTroRepo = require('../repositories/VaiTroRepository')
const QuyenRepo = require('../repositories/QuyenRepository')
const TaiKhoanRepo = require('../repositories/TaiKhoanRepository')

// Tính năng RBAC mới (VaiTro/Quyen/TaiKhoanVaiTro/VaiTroQuyen) — bổ sung theo
// yêu cầu, KHÔNG thay thế field TaiKhoan.vai_tro đang là nguồn quyết định JWT
// claim 'vai_tro'/'role' hiện có. Đây là lớp phân quyền chi tiết (permission)
// nằm cạnh role đơn giản đã có, để mở rộng dần về sau.

// ── Vai trò ──
const listRoles = () => VaiTroRepo.findAllWithQuyen()

const getRole = async (id) => {
  const role = await VaiTroRepo.findByIdWithQuyen(id)
  if (!role) throw { status: 404, message: 'Không tìm thấy vai trò' }
  return role
}

const createRole = async ({ ma_vai_tro, ten_vai_tro, mo_ta }) => {
  const exists = await VaiTroRepo.findByMa(ma_vai_tro)
  if (exists) throw { status: 400, message: 'Mã vai trò đã tồn tại' }
  return VaiTroRepo.create({ ma_vai_tro, ten_vai_tro, mo_ta, trang_thai: 'hoat_dong' })
}

const updateRole = async (id, data) => {
  const allowed = ['ten_vai_tro', 'mo_ta', 'trang_thai']
  const update = {}
  allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k] })
  await VaiTroRepo.update(id, update, 'id_vai_tro')
  return getRole(id)
}

const deleteRole = (id) => VaiTroRepo.delete(id, 'id_vai_tro')

// ── Quyền hạn ──
const listPermissions = () => QuyenRepo.findAll()

const createPermission = async ({ ma_quyen, ten_quyen, nhom_quyen, mo_ta }) => {
  const exists = await QuyenRepo.findByMa(ma_quyen)
  if (exists) throw { status: 400, message: 'Mã quyền đã tồn tại' }
  return QuyenRepo.create({ ma_quyen, ten_quyen, nhom_quyen, mo_ta })
}

const updatePermission = async (id, data) => {
  const allowed = ['ten_quyen', 'nhom_quyen', 'mo_ta']
  const update = {}
  allowed.forEach(k => { if (data[k] !== undefined) update[k] = data[k] })
  await QuyenRepo.update(id, update, 'id_quyen')
  return QuyenRepo.findById(id)
}

const deletePermission = (id) => QuyenRepo.delete(id, 'id_quyen')

// ── Gán quyền cho vai trò ──
const setRolePermissions = async (idVaiTro, idQuyenList) => {
  const updated = await VaiTroRepo.setQuyen(idVaiTro, idQuyenList)
  if (!updated) throw { status: 404, message: 'Không tìm thấy vai trò' }
  return updated
}

// ── Gán vai trò cho tài khoản (TaiKhoanVaiTro) ──
const getAccountRoles = async (idTaiKhoan) => {
  const taiKhoan = await TaiKhoanRepo.findByIdWithRoles(idTaiKhoan)
  if (!taiKhoan) throw { status: 404, message: 'Không tìm thấy tài khoản' }
  return taiKhoan.VaiTros || []
}

const setAccountRoles = async (idTaiKhoan, idVaiTroList, nguoiCap) => {
  const taiKhoan = await TaiKhoan.findByPk(idTaiKhoan)
  if (!taiKhoan) throw { status: 404, message: 'Không tìm thấy tài khoản' }
  await taiKhoan.setVaiTros(idVaiTroList, { through: { nguoi_cap: nguoiCap, ngay_tao: new Date() } })
  return getAccountRoles(idTaiKhoan)
}

module.exports = {
  listRoles, getRole, createRole, updateRole, deleteRole,
  listPermissions, createPermission, updatePermission, deletePermission,
  setRolePermissions, getAccountRoles, setAccountRoles,
}
