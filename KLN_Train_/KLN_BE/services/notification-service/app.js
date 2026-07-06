require('dotenv').config()
const express = require('express')
const { errorHandler, notFoundHandler } = require('@kln/shared')
const routes = require('./src/routes')
const internalNotifyRoutes = require('./src/internal/notify.routes')

const { connectDB } = require('./src/config/database')
require('./src/models')

const app = express()
const PORT = process.env.PORT || 4006

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => res.json({ success: true, message: 'notification-service đang hoạt động' }))

app.use('/api', routes)
app.use('/internal', internalNotifyRoutes)
app.use('/api/chatbot', require('./src/routes/chatbot.routes'))

app.use(notFoundHandler)
app.use(errorHandler)

const start = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => console.log(`🔔 notification-service đang chạy tại http://localhost:${PORT}`))
  } catch (err) {
    console.error('❌ Không thể khởi động notification-service:', err.message)
    process.exit(1)
  }
}

start()
