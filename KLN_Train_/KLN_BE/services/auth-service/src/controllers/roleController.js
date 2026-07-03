const { response: { ok, created } } = require('@kln/shared')
const RoleService = require('../services/RoleService')

// Mounted ở /api/admin/roles — tính năng RBAC mới (CRUD Vai trò/Quyền hạn +
// gán quyền cho vai trò + gán vai trò cho tài khoản). Không có frontend nào
// hiện tại gọi các route này; đây là API nền cho phần quản trị phân quyền
// chi tiết mở rộng thêm ngoài field TaiKhoan.vai_tro đang dùng cho JWT.

const listRoles = async (req, res, next) => {
  try { ok(res, await RoleService.listRoles()) } catch (err) { next(err) }
}

const getRole = async (req, res, next) => {
  try { ok(res, await RoleService.getRole(req.params.id)) } catch (err) { next(err) }
}

const createRole = async (req, res, next) => {
  try { created(res, await RoleService.createRole(req.body)) } catch (err) { next(err) }
}

const updateRole = async (req, res, next) => {
  try { ok(res, await RoleService.updateRole(req.params.id, req.body), 'Cập nhật vai trò thành công') } catch (err) { next(err) }
}

const deleteRole = async (req, res, next) => {
  try { await RoleService.deleteRole(req.params.id); ok(res, null, 'Xóa vai trò thành công') } catch (err) { next(err) }
}

const listPermissions = async (req, res, next) => {
  try { ok(res, await RoleService.listPermissions()) } catch (err) { next(err) }
}

const createPermission = async (req, res, next) => {
  try { created(res, await RoleService.createPermission(req.body)) } catch (err) { next(err) }
}

const updatePermission = async (req, res, next) => {
  try { ok(res, await RoleService.updatePermission(req.params.id, req.body), 'Cập nhật quyền thành công') } catch (err) { next(err) }
}

const deletePermission = async (req, res, next) => {
  try { await RoleService.deletePermission(req.params.id); ok(res, null, 'Xóa quyền thành công') } catch (err) { next(err) }
}

const setRolePermissions = async (req, res, next) => {
  try { ok(res, await RoleService.setRolePermissions(req.params.id, req.body.id_quyen || []), 'Cập nhật quyền cho vai trò thành công') } catch (err) { next(err) }
}

const getAccountRoles = async (req, res, next) => {
  try { ok(res, await RoleService.getAccountRoles(req.params.idTaiKhoan)) } catch (err) { next(err) }
}

const setAccountRoles = async (req, res, next) => {
  try { ok(res, await RoleService.setAccountRoles(req.params.idTaiKhoan, req.body.id_vai_tro || [], req.user.userId), 'Gán vai trò thành công') } catch (err) { next(err) }
}

module.exports = {
  listRoles, getRole, createRole, updateRole, deleteRole,
  listPermissions, createPermission, updatePermission, deletePermission,
  setRolePermissions, getAccountRoles, setAccountRoles,
}
