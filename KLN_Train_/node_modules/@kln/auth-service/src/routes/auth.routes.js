const router = require('express').Router()
const { body } = require('express-validator')
const { authenticate } = require('@kln/shared')
const authController = require('../controllers/authController')

// Mounted ở /api/auth — FR_User + FR_Dispatcher.

router.post('/register',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('matKhau').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
    body('hoTen').notEmpty().withMessage('Họ tên không được để trống'),
  ],
  authController.register
)

router.post('/login',
  [
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('matKhau').notEmpty().withMessage('Mật khẩu không được để trống'),
  ],
  authController.login
)

router.get('/profile', authenticate, authController.getProfile)
router.put('/profile', authenticate, authController.updateProfile)
router.put('/change-password', authenticate, authController.changePassword)
router.post('/refresh', authenticate, authController.refreshToken)

module.exports = router
