const ReportService = require('../services/ReportService')

exports.getRevenueReport = async (req, res) => {
  try { res.json({ success: true, data: await ReportService.getRevenueReport(req.query.range) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getRevenueByRoute = async (req, res) => {
  try { res.json({ success: true, data: await ReportService.getRevenueByRoute(req.query.range) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getRevenueByTrain = async (req, res) => {
  try { res.json({ success: true, data: await ReportService.getRevenueByTrain(req.query.range) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getCustomerDistribution = async (req, res) => {
  try { res.json({ success: true, data: await ReportService.getCustomerDistribution() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getOccupancyReport = async (req, res) => {
  try { res.json({ success: true, data: await ReportService.getOccupancyReport(req.query) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getCancellationReport = async (req, res) => {
  try { res.json({ success: true, data: await ReportService.getCancellationReport(req.query) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getCouponEffectiveness = async (req, res) => {
  try { res.json({ success: true, data: await ReportService.getCouponEffectiveness() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getDashboardStats = async (req, res) => {
  try { res.json({ success: true, data: await ReportService.getDashboardStats() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

exports.getSummaryStats = async (req, res) => {
  try { res.json({ success: true, data: await ReportService.getSummaryStats(req.query.range) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}
