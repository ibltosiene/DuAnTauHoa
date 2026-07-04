require('dotenv').config()
const express = require('express')
const { errorHandler, notFoundHandler } = require('@kln/shared')
const routes = require('./src/routes')

const { connectDB } = require('./src/config/database')

const app = express()
const PORT = process.env.PORT || 4007

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => res.json({ success: true, message: 'report-service đang hoạt động' }))

app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)

const start = async () => {
  try {
    await connectDB()
    app.listen(PORT, () => console.log(`📊 report-service đang chạy tại http://localhost:${PORT}`))
  } catch (err) {
    console.error('❌ Không thể khởi động report-service:', err.message)
    process.exit(1)
  }
}

start()
