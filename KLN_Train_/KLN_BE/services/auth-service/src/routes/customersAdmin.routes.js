const router = require('express').Router()
const customerController = require('../controllers/customerAdminController')

// Mounted ở /api/admin/customers — FR_Admin. Không có middleware auth
// (giữ đúng hành vi gốc: src/admin/routes/customers.routes.js).
router.get('/', customerController.getAllCustomers)
router.get('/:id/tickets', customerController.getCustomerTickets)
router.get('/:id', customerController.getCustomerById)
router.put('/:id', customerController.updateCustomer)
router.delete('/:id', customerController.deleteCustomer)

module.exports = router
