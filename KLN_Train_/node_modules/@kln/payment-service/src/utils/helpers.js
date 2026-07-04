const { v4: uuidv4 } = require('uuid')

const genTransactionCode = () => uuidv4().replace(/-/g, '').substring(0, 20).toUpperCase()

const genInvoiceNumber = () => {
  const now = new Date()
  return `HD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
}

module.exports = { genTransactionCode, genInvoiceNumber }
