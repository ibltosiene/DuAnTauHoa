require('dotenv').config()
const express = require('express')
const { errorHandler, notFoundHandler } = require('@kln/shared')
const routes = require('./src/routes')
const internalRoutes = require('./src/internal/internal.routes')

const { connectDB } = require('./src/config/database')
require('./src/models') // khởi tạo associations

const app = express()
const PORT = process.env.PORT || 4001

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => res.json({ success: true, message: 'auth-service đang hoạt động' }))

// Gateway chuyển full path (vd '/api/auth/login') nên mount ở đây dưới '/api'.
app.use('/api', routes)

// Route nội bộ cho service khác gọi trực tiếp (không qua Gateway).
app.use('/internal', internalRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

const start = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => console.log(`🔐 auth-service đang chạy tại http://localhost:${PORT}`))
  } catch (err) {
    console.error('❌ Không thể khởi động auth-service:', err.message)
    process.exit(1)
  }
}

start()
