const router = require('express').Router()
const ticketController = require('../controllers/ticketAdminController')

// Mounted ở /api/admin/tickets — FR_Admin. Không có middleware auth
// (giữ đúng hành vi gốc: src/admin/routes/ticket.routes.js).
router.get('/', ticketController.getAllTickets)
router.get('/stats', ticketController.getTicketStats)
router.post('/bulk-update', ticketController.bulkUpdateExpiredTickets)
router.get('/:id', ticketController.getTicketById)
router.put('/:id/cancel', ticketController.cancelTicket)
router.put('/:id/confirm', ticketController.confirmTicket)
router.put('/:id/auto-update', ticketController.autoUpdateTicketStatus)

module.exports = router
