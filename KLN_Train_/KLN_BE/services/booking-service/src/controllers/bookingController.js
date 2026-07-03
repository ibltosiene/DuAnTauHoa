const BookingService = require('../services/BookingService')
const { response: { ok, created, badRequest, notFound } } = require('@kln/shared')

const holdSeats = async (req, res, next) => {
  try {
    const { trips } = req.body
    if (!trips?.length) return badRequest(res, 'Thiếu danh sách chuyến (trips)')
    const result = await BookingService.holdSeatsForCheckout({ trips })
    ok(res, result, 'Giữ ghế thành công')
  } catch (err) { next(err) }
}

const createBooking = async (req, res, next) => {
  try {
    const { trips, passengers, contactInfo, maKhuyenMai } = req.body
    if (!trips?.length || !passengers?.length || !contactInfo) {
      return badRequest(res, 'Thiếu thông tin đặt vé')
    }
    const idTaiKhoan = req.user?.userId || null
    const result = await BookingService.createBooking({ trips, passengers, contactInfo, idTaiKhoan, maKhuyenMai })
    created(res, {
      maDon: result.maDon,
      maDatCho: result.maDatCho,
      idDon: result.don.id_don_dat_ve,
      tongThanhToan: result.tongThanhToan,
      tienGiam: result.tienGiam,
    }, 'Đặt vé thành công')
  } catch (err) { next(err) }
}

const lookupBooking = async (req, res, next) => {
  try {
    const { maDatCho, email, phone } = req.body
    if (!maDatCho) return badRequest(res, 'Vui lòng nhập mã đặt chỗ')
    const don = await BookingService.lookupBooking(maDatCho, email, phone)
    if (!don) return notFound(res, 'Không tìm thấy đơn đặt vé hoặc thông tin không khớp')
    ok(res, BookingService.formatDon(don))
  } catch (err) { next(err) }
}

const getBookingHistory = async (req, res, next) => {
  try {
    const dons = await BookingService.getBookingHistory(req.user.userId)
    ok(res, dons.map(BookingService.formatDon))
  } catch (err) { next(err) }
}

const getBookingByCode = async (req, res, next) => {
  try {
    const don = await BookingService.getBookingByCode(req.params.maDatCho)
    ok(res, BookingService.formatDon(don))
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const releaseHold = async (req, res, next) => {
  try {
    await BookingService.releaseHold(req.body.sessionId)
    ok(res, null, 'Giải phóng ghế thành công')
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    next(err)
  }
}

module.exports = { holdSeats, createBooking, lookupBooking, getBookingHistory, getBookingByCode, releaseHold }
