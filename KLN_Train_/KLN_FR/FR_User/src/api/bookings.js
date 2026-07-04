import { post, get } from './client'

export const holdSeats = (data) => post('/bookings/hold-seats', data)

export const createBooking = (data) => post('/bookings', data)

export const lookupBooking = (maDatCho, email, phone) =>
  post('/bookings/lookup', { maDatCho, email, phone })

export const getBookingHistory = (page = 1, limit = 5) =>
  get(`/bookings/history?page=${page}&limit=${limit}`)

export const getBookingByCode = (maDatCho) => get(`/bookings/${maDatCho}`)

export const releaseHold = (sessionId) => post('/bookings/release-hold', { sessionId })
