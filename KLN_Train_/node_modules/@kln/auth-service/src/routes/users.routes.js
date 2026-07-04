const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const userController = require('../controllers/userController')

// Mounted ở /api/admin/users — FR_Admin (quản lý tài khoản nội bộ).
router.use(authenticate)
router.use(requireRole('quan_tri'))

router.get('/', userController.getAllUsers)
router.get('/:id', userController.getUserById)
router.post('/', userController.createUser)
router.put('/:id', userController.updateUser)
router.delete('/:id', userController.deleteUser)
router.put('/:id/status', userController.updateUserStatus)
router.post('/:id/reset-password', userController.resetPassword)

module.exports = router
