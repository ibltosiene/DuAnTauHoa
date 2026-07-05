require('dotenv').config()

const targets = {
  auth: process.env.AUTH_SERVICE_URL,
  railway: process.env.RAILWAY_SERVICE_URL,
  booking: process.env.BOOKING_SERVICE_URL,
  payment: process.env.PAYMENT_SERVICE_URL,
  customer: process.env.CUSTOMER_SERVICE_URL,
  notification: process.env.NOTIFICATION_SERVICE_URL,
  report: process.env.REPORT_SERVICE_URL,
  dashboard: process.env.DASHBOARD_SERVICE_URL,
}

module.exports = { targets }
