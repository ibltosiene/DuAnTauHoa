const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const roleController = require('../controllers/roleController')

// Mounted ở /api/admin/roles — RBAC mới (Vai trò/Quyền hạn).
router.use(authenticate)
router.use(requireRole('quan_tri'))

router.get('/', roleController.listRoles)
router.get('/:id', roleController.getRole)
router.post('/', roleController.createRole)
router.put('/:id', roleController.updateRole)
router.delete('/:id', roleController.deleteRole)
router.put('/:id/permissions', roleController.setRolePermissions)

router.get('/permissions/all', roleController.listPermissions)
router.post('/permissions', roleController.createPermission)
router.put('/permissions/:id', roleController.updatePermission)
router.delete('/permissions/:id', roleController.deletePermission)

router.get('/accounts/:idTaiKhoan', roleController.getAccountRoles)
router.put('/accounts/:idTaiKhoan', roleController.setAccountRoles)

module.exports = router
