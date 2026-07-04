const ReportRepository = require('../repositories/ReportRepository')

const CUSTOMER_LABELS = {
  nguoi_lon: { name: 'Người lớn', color: '#8C1D19' },
  tre_em: { name: 'Trẻ em', color: '#27ae60' },
  nguoi_cao_tuoi: { name: 'Người cao tuổi', color: '#3498db' },
  sinh_vien: { name: 'Học sinh, sinh viên', color: '#e67e22' },
}

const getRangeDays = (range) => ({ week: 7, month: 30, quarter: 90, year: 365 }[range] || 30)

const getRevenueReport = async (range) => {
  const days = getRangeDays(range)
  const groupByMonth = range === 'quarter' || range === 'year'
  const groupExpr = groupByMonth ? "FORMAT(v.ngay_xuat_ve, 'yyyy-MM')" : 'CAST(v.ngay_xuat_ve AS DATE)'
  const labelExpr = groupByMonth ? "FORMAT(v.ngay_xuat_ve, 'MM/yyyy')" : "FORMAT(v.ngay_xuat_ve, 'dd/MM')"
  return ReportRepository.getRevenue({ days, groupExpr, labelExpr })
}

const getRevenueByRoute = (range) => ReportRepository.getRevenueByRoute(getRangeDays(range))
const getRevenueByTrain = (range) => ReportRepository.getRevenueByTrain(getRangeDays(range))

const getCustomerDistribution = async () => {
  const rows = await ReportRepository.getCustomerDistribution()
  const total = rows.reduce((sum, r) => sum + r.so_luong, 0) || 1
  return rows.map(r => ({
    name: CUSTOMER_LABELS[r.loai_hanh_khach]?.name || r.loai_hanh_khach,
    value: Math.round((r.so_luong / total) * 1000) / 10,
    color: CUSTOMER_LABELS[r.loai_hanh_khach]?.color || '#95a5a6',
  }))
}

const getOccupancyReport = ({ tu_ngay, den_ngay }) => ReportRepository.getOccupancyReport({ tu_ngay, den_ngay })
const getCancellationReport = ({ tu_ngay, den_ngay }) => ReportRepository.getCancellationReport({ tu_ngay, den_ngay })
const getCouponEffectiveness = () => ReportRepository.getCouponEffectiveness()
const getDashboardStats = () => ReportRepository.getDashboardStats()

const getSummaryStats = async (range) => {
  const days = getRangeDays(range)
  const { ticketStats, total_customers, avg_occupancy } = await ReportRepository.getSummaryStats(days)

  const total_revenue = Number(ticketStats.total_revenue) || 0
  const total_tickets = Number(ticketStats.total_tickets) || 0
  const prev_revenue = Number(ticketStats.prev_revenue) || 0
  const prev_tickets = Number(ticketStats.prev_tickets) || 0
  const cancelled_tickets = Number(ticketStats.cancelled_tickets) || 0
  const total_count = total_tickets + cancelled_tickets

  const growth_revenue = prev_revenue > 0 ? Math.round(((total_revenue - prev_revenue) / prev_revenue) * 1000) / 10 : 0
  const growth_tickets = prev_tickets > 0 ? Math.round(((total_tickets - prev_tickets) / prev_tickets) * 1000) / 10 : 0
  const cancel_rate = total_count > 0 ? Math.round((cancelled_tickets / total_count) * 1000) / 10 : 0

  return {
    total_revenue, total_tickets, total_customers,
    avg_occupancy: Math.round((avg_occupancy || 0) * 10) / 10,
    growth_revenue, growth_tickets, cancel_rate,
  }
}

module.exports = {
  getRevenueReport, getRevenueByRoute, getRevenueByTrain, getCustomerDistribution,
  getOccupancyReport, getCancellationReport, getCouponEffectiveness,
  getDashboardStats, getSummaryStats,
}
