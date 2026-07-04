const router = require('express').Router()
const dashboardController = require('../controllers/dashboardController')

// Mounted ở /api/admin/dashboard — FR_Admin. Không có middleware auth trong
// bản gốc (src/admin/routes/dashboard.routes.js) — giữ nguyên.
router.get('/stats', dashboardController.getStats)
router.get('/revenue-by-month', dashboardController.getRevenueByMonth)
router.get('/revenue-by-week', dashboardController.getRevenueByWeek)
router.get('/popular-routes', dashboardController.getPopularRoutes)
router.get('/recent-orders', dashboardController.getRecentOrders)
router.get('/upcoming-trains', dashboardController.getUpcomingTrains)
router.get('/top-stations', dashboardController.getTopStations)
router.get('/customer-distribution', dashboardController.getCustomerDistribution)
router.get('/rates', dashboardController.getRates)

module.exports = router
