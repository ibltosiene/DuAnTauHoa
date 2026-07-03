const DashboardRepository = require('../repositories/DashboardRepository')

const MONTHS_VI = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12']
const DAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const CUSTOMER_COLORS = { nguoi_lon: '#8C1D19', sinh_vien: '#e67e22', tre_em: '#27ae60', nguoi_cao_tuoi: '#3498db' }
const CUSTOMER_NAMES = { nguoi_lon: 'Người lớn', sinh_vien: 'Sinh viên', tre_em: 'Trẻ em', nguoi_cao_tuoi: 'Người cao tuổi' }

const getStats = () => DashboardRepository.getStats()

const getRevenueByMonth = async () => {
  const rows = await DashboardRepository.getRevenueByMonth()
  return MONTHS_VI.map((label, i) => {
    const found = rows.find(r => r.month === i + 1)
    return { month: label, revenue: found ? found.revenue : 0, tickets: found ? found.tickets : 0 }
  })
}

const getRevenueByWeek = async () => {
  const rows = await DashboardRepository.getRevenueByWeek()
  return DAYS_VI.map((day, i) => {
    const found = rows.find(r => r.day_of_week === i + 1)
    return { day, revenue: found ? found.revenue : 0, tickets: found ? found.tickets : 0 }
  })
}

const getPopularRoutes = () => DashboardRepository.getPopularRoutes()
const getRecentOrders = () => DashboardRepository.getRecentOrders()
const getUpcomingTrains = () => DashboardRepository.getUpcomingTrains()

const getTopStations = async () => {
  const rows = await DashboardRepository.getTopStations()
  const total = rows.reduce((sum, r) => sum + r.traffic, 0)
  return rows.map(r => ({ ...r, percentage: total > 0 ? Math.round((r.traffic / total) * 100) : 0 }))
}

const getCustomerDistribution = async () => {
  const rows = await DashboardRepository.getCustomerDistribution()
  return rows.map(r => ({
    name: CUSTOMER_NAMES[r.name] || r.name,
    value: r.value,
    color: CUSTOMER_COLORS[r.name] || '#8C1D19',
  }))
}

const getRates = async () => {
  const rates = await DashboardRepository.getRates()
  return {
    ontime_rate: parseFloat(rates.ontime_rate || 0).toFixed(1),
    cancel_rate: parseFloat(rates.cancel_rate || 0).toFixed(1),
  }
}

module.exports = {
  getStats, getRevenueByMonth, getRevenueByWeek, getPopularRoutes,
  getRecentOrders, getUpcomingTrains, getTopStations, getCustomerDistribution, getRates,
}
