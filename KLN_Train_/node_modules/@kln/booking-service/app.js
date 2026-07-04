require('dotenv').config()
const express = require('express')
const { errorHandler, notFoundHandler } = require('@kln/shared')
const routes = require('./src/routes')
const internalOrdersRoutes = require('./src/internal/orders.routes')

const { connectDB } = require('./src/config/database')
require('./src/models')

const app = express()
const PORT = process.env.PORT || 4003

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => res.json({ success: true, message: 'booking-service đang hoạt động' }))

app.use('/api', routes)
app.use('/internal/orders', internalOrdersRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

const start = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => console.log(`🎫 booking-service đang chạy tại http://localhost:${PORT}`))
  } catch (err) {
    console.error('❌ Không thể khởi động booking-service:', err.message)
    process.exit(1)
  }
}

start()
