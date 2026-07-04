const router = require('express').Router()
const { authenticate, requireRole } = require('@kln/shared')
const reportController = require('../controllers/reportController')

// Mounted ở /api/admin/reports — FR_Admin.
router.use(authenticate)
router.use(requireRole('quan_tri'))

router.get('/dashboard', reportController.getDashboardStats)
router.get('/revenue', reportController.getRevenueReport)
router.get('/revenue/by-route', reportController.getRevenueByRoute)
router.get('/revenue/by-train', reportController.getRevenueByTrain)
router.get('/occupancy', reportController.getOccupancyReport)
router.get('/cancellations', reportController.getCancellationReport)
router.get('/coupon-effectiveness', reportController.getCouponEffectiveness)
router.get('/dashboard-stats', reportController.getDashboardStats)
router.get('/customer-distribution', reportController.getCustomerDistribution)
router.get('/summary', reportController.getSummaryStats)

module.exports = router
