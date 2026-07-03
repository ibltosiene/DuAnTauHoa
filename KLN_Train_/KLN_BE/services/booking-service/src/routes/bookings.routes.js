const router = require('express').Router()
const { authenticate, optionalAuth } = require('@kln/shared')
const BookingController = require('../controllers/bookingController')

// Mounted ở /api/bookings — FR_User.
router.post('/hold-seats', BookingController.holdSeats)
router.post('/release-hold', BookingController.releaseHold)
router.post('/', optionalAuth, BookingController.createBooking)
router.post('/lookup', BookingController.lookupBooking)
router.get('/history', authenticate, BookingController.getBookingHistory)
router.get('/:maDatCho', BookingController.getBookingByCode)

module.exports = router
