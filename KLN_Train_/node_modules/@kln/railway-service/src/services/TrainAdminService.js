const TrainAdminRepo = require('../repositories/TrainAdminRepository')

const getAllTrains = () => TrainAdminRepo.findAllWithCoachCount()

const getTrainDetail = async (id) => {
  const train = await TrainAdminRepo.findById(id)
  if (!train) throw { status: 404, message: 'Không tìm thấy tàu' }
  const carriages = await TrainAdminRepo.getCarriagesByTrain(id)
  return { ...train.toJSON(), danh_sach_toa: carriages }
}

const createTrain = async (data) => {
  const exists = await TrainAdminRepo.soHieuExists(data.so_hieu)
  if (exists) throw { status: 400, message: 'Số hiệu tàu đã tồn tại' }
  const tau = await TrainAdminRepo.create({
    so_hieu: data.so_hieu, ten_tau: data.ten_tau, so_toa: data.so_toa,
    trang_thai: data.trang_thai || 'hoat_dong',
  })
  return { id_tau: tau.id_tau }
}

const updateTrain = (id, data) => TrainAdminRepo.update(id, {
  so_hieu: data.so_hieu, ten_tau: data.ten_tau, so_toa: data.so_toa, trang_thai: data.trang_thai,
}, 'id_tau')

const deleteTrain = async (id) => {
  const used = await TrainAdminRepo.isUsedInSchedule(id)
  if (used) throw { status: 400, message: 'Tàu đang được sử dụng trong lịch trình' }
  await TrainAdminRepo.delete(id, 'id_tau')
}

const addCarriageToTrain = (id_tau, { so_toa_thu_tu, id_loai_toa }) =>
  TrainAdminRepo.addCarriage({ id_tau, so_toa_thu_tu, id_loai_toa })

const removeCarriageFromTrain = (id_tau, id_cau_hinh_toa) =>
  TrainAdminRepo.removeCarriage({ id_tau, id_cau_hinh_toa })

module.exports = { getAllTrains, getTrainDetail, createTrain, updateTrain, deleteTrain, addCarriageToTrain, removeCarriageFromTrain }
