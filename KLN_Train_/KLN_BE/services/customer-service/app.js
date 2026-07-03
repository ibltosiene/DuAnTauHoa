require('dotenv').config()
const express = require('express')
const { errorHandler, notFoundHandler } = require('@kln/shared')
const passengersInternalRoutes = require('./src/internal/passengers.routes')

const { connectDB } = require('./src/config/database')
require('./src/models')

const app = express()
const PORT = process.env.PORT || 4005

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => res.json({ success: true, message: 'customer-service đang hoạt động' }))

// customer-service hiện chưa có route công khai qua Gateway (chưa frontend
// nào gọi trực tiếp HanhKhach/PhanHoi) — chỉ phục vụ nội bộ cho booking-service.
app.use('/internal/passengers', passengersInternalRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

const start = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => console.log(`🧑‍🤝‍🧑 customer-service đang chạy tại http://localhost:${PORT}`))
  } catch (err) {
    console.error('❌ Không thể khởi động customer-service:', err.message)
    process.exit(1)
  }
}

start()
