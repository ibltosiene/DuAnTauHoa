const TrainAdminService = require('../services/TrainAdminService')

const getAllTrains = async (req, res) => {
  try { res.json({ success: true, data: await TrainAdminService.getAllTrains() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getTrainDetail = async (req, res) => {
  try { res.json({ success: true, data: await TrainAdminService.getTrainDetail(req.params.id) }) }
  catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const createTrain = async (req, res) => {
  try {
    const data = await TrainAdminService.createTrain(req.body)
    res.status(201).json({ success: true, data })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const updateTrain = async (req, res) => {
  try {
    await TrainAdminService.updateTrain(req.params.id, req.body)
    res.json({ success: true, message: 'Cập nhật thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const deleteTrain = async (req, res) => {
  try {
    await TrainAdminService.deleteTrain(req.params.id)
    res.json({ success: true, message: 'Xóa tàu thành công' })
  } catch (err) { res.status(err.status || 500).json({ success: false, message: err.message }) }
}

const addCarriageToTrain = async (req, res) => {
  try {
    await TrainAdminService.addCarriageToTrain(req.params.id, req.body)
    res.json({ success: true, message: 'Thêm toa thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const removeCarriageFromTrain = async (req, res) => {
  try {
    await TrainAdminService.removeCarriageFromTrain(req.params.id, req.params.carriageId)
    res.json({ success: true, message: 'Xóa toa thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

module.exports = { getAllTrains, getTrainDetail, createTrain, updateTrain, deleteTrain, addCarriageToTrain, removeCarriageFromTrain }
