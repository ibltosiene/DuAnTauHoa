const router = require('express').Router()
const { authenticate } = require('@kln/shared')
const authController = require('../controllers/adminAuthController')

// Mounted ở /api/admin/auth — FR_Admin.

router.post('/login', authController.login)
router.post('/register', authController.register)
router.post('/forgot-password', authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)

router.get('/profile', authenticate, authController.getProfile)
router.put('/profile', authenticate, authController.updateProfile)
router.put('/change-password', authenticate, authController.changePassword)
router.post('/refresh-token', authenticate, authController.refreshToken)
router.post('/logout', authenticate, authController.logout)

module.exports = router
