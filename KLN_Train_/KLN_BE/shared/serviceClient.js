const axios = require('axios')

// Gọi API nội bộ (/internal/*) của 1 service khác. baseURL của từng service
// đích đọc từ env của SERVICE ĐANG GỌI (ví dụ booking-service cần biết
// RAILWAY_SERVICE_URL). Dùng chung 1 timeout ngắn vì đây là gọi nội bộ cùng
// mạng LAN/localhost, không phải gọi ra ngoài Internet.
const SERVICE_ENV_KEYS = {
  auth: 'AUTH_SERVICE_URL',
  railway: 'RAILWAY_SERVICE_URL',
  booking: 'BOOKING_SERVICE_URL',
  payment: 'PAYMENT_SERVICE_URL',
  customer: 'CUSTOMER_SERVICE_URL',
  notification: 'NOTIFICATION_SERVICE_URL',
  report: 'REPORT_SERVICE_URL',
}

const client = (serviceKey) => {
  const envKey = SERVICE_ENV_KEYS[serviceKey]
  const baseURL = process.env[envKey]
  if (!baseURL) throw new Error(`Thiếu biến môi trường ${envKey} để gọi ${serviceKey}-service`)

  return axios.create({
    baseURL,
    timeout: 8000,
    headers: { 'X-Internal-Key': process.env.INTERNAL_API_KEY },
  })
}

const post = (serviceKey, path, data) => client(serviceKey).post(path, data).then(r => r.data)
const get = (serviceKey, path, params) => client(serviceKey).get(path, { params }).then(r => r.data)
const put = (serviceKey, path, data) => client(serviceKey).put(path, data).then(r => r.data)
const del = (serviceKey, path) => client(serviceKey).delete(path).then(r => r.data)

module.exports = { post, get, put, delete: del }
