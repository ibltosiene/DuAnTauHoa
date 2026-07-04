const router = require('express').Router()
const policyController = require('../controllers/policyController')

// Mounted ở /api/admin/policies — chỉ phần occasion-policies/base-price/
// seat-factors (BieuGia + LoaiGhe). customer-discounts/cancel-fees thuộc
// booking-service. Không có middleware auth (giữ đúng hành vi gốc).
router.get('/occasion-policies', policyController.getOccasionPolicies)
router.post('/occasion-policies', policyController.createOccasionPolicy)
router.put('/occasion-policies/:id', policyController.updateOccasionPolicy)

router.get('/base-price', policyController.getBasePrice)
router.get('/seat-factors', policyController.getSeatFactors)

module.exports = router
