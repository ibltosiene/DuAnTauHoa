const ScheduleService = require('../services/ScheduleAdminService')

const getAllSchedules = async (req, res) => {
  try { res.json({ success: true, data: await ScheduleService.getAllSchedules() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getScheduleStations = async (req, res) => {
  try { res.json({ success: true, data: await ScheduleService.getScheduleStations(req.params.id) }) }
  catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const createSchedule = async (req, res) => {
  try {
    const data = await ScheduleService.createSchedule(req.body)
    res.status(201).json({ success: true, data })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const deleteSchedule = async (req, res) => {
  try {
    await ScheduleService.deleteSchedule(req.params.id)
    res.json({ success: true, message: 'Xóa lịch chạy thành công' })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const addStopStation = async (req, res) => {
  try {
    await ScheduleService.addStopStation(req.params.id, req.body)
    res.json({ success: true, message: 'Thêm ga dừng thành công' })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const removeStopStation = async (req, res) => {
  try {
    await ScheduleService.removeStopStation(req.params.id, req.params.stationId)
    res.json({ success: true, message: 'Xóa ga dừng thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

// Giữ nguyên các endpoint "không khả dụng" như bản gốc (dead-but-preserved contract).
const updateSchedule = async (req, res) => {
  res.status(403).json({ success: false, message: 'Không được phép sửa lịch chạy' })
}
const updateTripStatus = async (req, res) => {
  res.status(403).json({ success: false, message: 'Chức năng không khả dụng' })
}
const getStopStations = async (req, res) => {
  res.status(403).json({ success: false, message: 'Chức năng không khả dụng' })
}
const getActualTrips = async (req, res) => {
  res.status(403).json({ success: false, message: 'Chức năng không khả dụng' })
}

const getScheduleById = async (req, res) => {
  try {
    const data = await ScheduleService.getScheduleById(req.params.id)
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch chạy' })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getTrips = async (req, res) => {
  try { res.json({ success: true, data: await ScheduleService.getTrips(req.query) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getUpcomingTrips = async (req, res) => {
  try { res.json({ success: true, data: await ScheduleService.getUpcomingTrips() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getTripStatus = async (req, res) => {
  res.status(501).json({ success: false, message: 'Chức năng chưa được triển khai' })
}

const generateTrips = async (req, res) => {
  try {
    const data = await ScheduleService.generateTrips(req.body)
    res.status(201).json({ success: true, message: 'Tạo chuyến thành công', data })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

module.exports = {
  getAllSchedules, getScheduleStations, createSchedule, deleteSchedule,
  addStopStation, removeStopStation, updateSchedule, updateTripStatus,
  getStopStations, getActualTrips, getScheduleById, getTrips, getUpcomingTrips,
  getTripStatus, generateTrips,
}
