const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const couponController = require('../controllers/couponController')

// Mounted ở /api/admin/coupons — FR_Admin.
router.use(authenticate)
router.use(requireRole('quan_tri'))

router.get('/', couponController.getAllCoupons)
router.get('/:id', couponController.getCouponById)
router.post('/', couponController.createCoupon)
router.put('/:id', couponController.updateCoupon)
router.delete('/:id', couponController.deleteCoupon)

module.exports = router
