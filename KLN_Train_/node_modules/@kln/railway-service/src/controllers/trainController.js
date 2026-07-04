const TrainService = require('../services/TrainService')
const { response: { ok, badRequest } } = require('@kln/shared')

const searchTrains = async (req, res, next) => {
  try {
    const { gaDi, gaDen, ngayChay } = req.query
    if (!gaDi || !gaDen || !ngayChay) return badRequest(res, 'Thiếu tham số: gaDi, gaDen, ngayChay')

    const results = await TrainService.searchTrains(gaDi, gaDen, ngayChay)
    ok(res, results)
  } catch (err) { next(err) }
}

const getSeatMap = async (req, res, next) => {
  try {
    const { idChuyen, soToa } = req.params
    const { idGaLen, idGaXuong } = req.query
    const result = await TrainService.getSeatMap(
      parseInt(idChuyen), parseInt(soToa),
      idGaLen ? parseInt(idGaLen) : null,
      idGaXuong ? parseInt(idGaXuong) : null
    )
    ok(res, result)
  } catch (err) { next(err) }
}

const getAllStations = async (req, res, next) => {
  try {
    ok(res, await TrainService.getAllStations())
  } catch (err) { next(err) }
}

const getSchedule = async (req, res, next) => {
  try {
    ok(res, await TrainService.getSchedule())
  } catch (err) { next(err) }
}

const getTrainDetail = async (req, res, next) => {
  try {
    const { idLichChay } = req.params
    const { idGaLen, idGaXuong, ngayChay } = req.query
    const result = await TrainService.getTrainRouteDetail(
      parseInt(idLichChay),
      idGaLen ? parseInt(idGaLen) : null,
      idGaXuong ? parseInt(idGaXuong) : null,
      ngayChay || null
    )
    ok(res, result)
  } catch (err) { next(err) }
}

const getPopularRoutes = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    ok(res, await TrainService.getPopularRoutes(limit))
  } catch (err) { next(err) }
}

module.exports = { searchTrains, getSeatMap, getAllStations, getSchedule, getTrainDetail, getPopularRoutes }
