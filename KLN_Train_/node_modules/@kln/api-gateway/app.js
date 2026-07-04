require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { createProxyMiddleware } = require('http-proxy-middleware')
const { targets } = require('./config/targets')
const { routeTable } = require('./config/routeTable')

const app = express()
const PORT = process.env.PORT || 8000

// CORS được xử lý tập trung ở Gateway (kể cả preflight OPTIONS) — các
// microservice phía sau KHÔNG cần tự cấu hình CORS.
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.DISPATCHER_URL || 'http://localhost:5174',
  process.env.ADMIN_URL || 'http://localhost:3000',
]
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} không được phép`))
  },
  credentials: true,
}))

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API Gateway đang chạy', targets })
})

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'KLN Train API (microservices) đang hoạt động', time: new Date().toISOString() })
})

for (const { prefix, service } of routeTable) {
  const target = targets[service]
  app.use(
    prefix,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      logLevel: 'warn',
    })
  )
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Không tìm thấy route phía Gateway: ${req.method} ${req.originalUrl}` })
})

app.listen(PORT, () => {
  console.log(`🚪 API Gateway đang chạy tại http://localhost:${PORT}`)
})
