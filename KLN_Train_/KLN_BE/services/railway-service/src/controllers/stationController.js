const StationService = require('../services/StationService')

const getAllStations = async (req, res) => {
  try { res.json({ success: true, data: await StationService.getAllStations() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const createStation = async (req, res) => {
  try {
    await StationService.createStation(req.body)
    res.status(201).json({ success: true, message: 'Thêm ga thành công' })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const updateStation = async (req, res) => {
  try {
    await StationService.updateStation(req.params.id, req.body)
    res.json({ success: true, message: 'Cập nhật thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const deleteStation = async (req, res) => {
  try {
    await StationService.deleteStation(req.params.id)
    res.json({ success: true, message: 'Xóa ga thành công' })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

module.exports = { getAllStations, createStation, updateStation, deleteStation }
