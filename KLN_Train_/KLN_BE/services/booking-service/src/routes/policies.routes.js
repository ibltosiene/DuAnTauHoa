const router = require('express').Router()
const policyController = require('../controllers/policyController')

// Mounted ở /api/admin/policies — chỉ customer-discounts/cancel-fees
// (ChinhSachGia/ChinhSachHuy). occasion-policies/base-price/seat-factors
// thuộc railway-service. Không có middleware auth (giữ đúng hành vi gốc).
router.get('/customer-discounts', policyController.getCustomerDiscounts)
router.post('/customer-discounts', policyController.createCustomerDiscount)
router.put('/customer-discounts/:id', policyController.updateCustomerDiscount)

router.get('/cancel-fees', policyController.getCancelFees)
router.post('/cancel-fees', policyController.createCancelFee)
router.put('/cancel-fees/:id', policyController.updateCancelFee)

module.exports = router
