const DashboardService = require('../services/DashboardService')

const wrap = (fn) => async (req, res) => {
  try { res.json({ success: true, data: await fn(req) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getStats = wrap(() => DashboardService.getStats())
exports.getRevenueByMonth = wrap(() => DashboardService.getRevenueByMonth())
exports.getRevenueByWeek = wrap(() => DashboardService.getRevenueByWeek())
exports.getPopularRoutes = wrap(() => DashboardService.getPopularRoutes())
exports.getRecentOrders = wrap(() => DashboardService.getRecentOrders())
exports.getUpcomingTrains = wrap(() => DashboardService.getUpcomingTrains())
exports.getTopStations = wrap(() => DashboardService.getTopStations())
exports.getCustomerDistribution = wrap(() => DashboardService.getCustomerDistribution())
exports.getRates = wrap(() => DashboardService.getRates())
