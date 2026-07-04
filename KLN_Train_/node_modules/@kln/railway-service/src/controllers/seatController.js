const SeatService = require('../services/SeatService')

const getSeatTypeById = async (req, res) => {
  try {
    const data = await SeatService.getSeatTypeById(req.params.id)
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy loại ghế' })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getAllSeatTypes = async (req, res) => {
  try { res.json({ success: true, data: await SeatService.getAllSeatTypes() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const createSeatType = async (req, res) => {
  try {
    await SeatService.createSeatType(req.body)
    res.status(201).json({ success: true, message: 'Thêm loại ghế thành công' })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const updateSeatType = async (req, res) => {
  try {
    await SeatService.updateSeatType(req.params.id, req.body)
    res.json({ success: true, message: 'Cập nhật thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const deleteSeatType = async (req, res) => {
  try {
    await SeatService.deleteSeatType(req.params.id)
    res.json({ success: true, message: 'Xóa thành công' })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const getCarriageTypeById = async (req, res) => {
  try {
    const data = await SeatService.getCarriageTypeById(req.params.id)
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy loại toa' })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getAllCarriageTypes = async (req, res) => {
  try { res.json({ success: true, data: await SeatService.getAllCarriageTypes() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const createCarriageType = async (req, res) => {
  try {
    await SeatService.createCarriageType(req.body)
    res.status(201).json({ success: true, message: 'Thêm loại toa thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const updateCarriageType = async (req, res) => {
  try {
    await SeatService.updateCarriageType(req.params.id, req.body)
    res.json({ success: true, message: 'Cập nhật thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const deleteCarriageType = async (req, res) => {
  try {
    await SeatService.deleteCarriageType(req.params.id)
    res.json({ success: true, message: 'Xóa thành công' })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const configureSeatsForCarriage = async (req, res) => {
  try {
    await SeatService.configureSeatsForCarriage(req.params.id_loai_toa, req.body.seats)
    res.json({ success: true, message: 'Cấu hình ghế thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getSeatConfiguration = async (req, res) => {
  try { res.json({ success: true, data: await SeatService.getSeatConfiguration(req.params.id_loai_toa) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

module.exports = {
  getSeatTypeById, getAllSeatTypes, createSeatType, updateSeatType, deleteSeatType,
  getCarriageTypeById, getAllCarriageTypes, createCarriageType, updateCarriageType, deleteCarriageType,
  configureSeatsForCarriage, getSeatConfiguration,
}
