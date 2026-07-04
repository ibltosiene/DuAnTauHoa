require('dotenv').config()
const express = require('express')
const { errorHandler, notFoundHandler } = require('@kln/shared')
const routes = require('./src/routes')
const internalSeatsRoutes = require('./src/internal/seats.routes')

const { connectDB, sequelize } = require('./src/config/database')
require('./src/models') // khởi tạo associations

const app = express()
const PORT = process.env.PORT || 4002

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => res.json({ success: true, message: 'railway-service đang hoạt động' }))

app.use('/api', routes)
app.use('/internal/seats', internalSeatsRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

// Cron: tự động cập nhật trạng thái ChuyenTau (port từ DuAnTauHoaCom/backend/app.js)
const startCron = () => {
  const runUpdate = async () => {
    try { await sequelize.query('EXEC sp_CapNhatTrangThaiChuyen') } catch { /* proc chưa cài thì bỏ qua */ }
  }
  runUpdate()
  setInterval(runUpdate, 5 * 60 * 1000)
}

const start = async () => {
  try {
    await connectDB()
    startCron()
    app.listen(PORT, () => console.log(`🚆 railway-service đang chạy tại http://localhost:${PORT}`))
  } catch (err) {
    console.error('❌ Không thể khởi động railway-service:', err.message)
    process.exit(1)
  }
}

start()
