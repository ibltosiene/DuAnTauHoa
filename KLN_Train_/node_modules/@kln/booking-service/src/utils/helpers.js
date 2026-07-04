const { v4: uuidv4 } = require('uuid')

const genBookingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const genOrderCode = () => 'KLN' + String(Math.floor(100000 + Math.random() * 900000))

const genTransactionCode = () => uuidv4().replace(/-/g, '').substring(0, 20).toUpperCase()

const calcExchangeFee = (originalPrice) => Math.max(Math.round(originalPrice * 0.05), 20000)

module.exports = { genBookingCode, genOrderCode, genTransactionCode, calcExchangeFee }
