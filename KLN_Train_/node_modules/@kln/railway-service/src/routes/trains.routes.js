const router = require('express').Router()
const TrainController = require('../controllers/trainController')

// Mounted ở /api/trains — FR_User (tìm vé, sơ đồ ghế công khai).
router.get('/popular-routes', TrainController.getPopularRoutes)
router.get('/search', TrainController.searchTrains)
router.get('/stations', TrainController.getAllStations)
router.get('/schedule', TrainController.getSchedule)
router.get('/detail/:idLichChay', TrainController.getTrainDetail)
router.get('/:idChuyen/seats/:soToa', TrainController.getSeatMap)

module.exports = router
