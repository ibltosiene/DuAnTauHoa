const StationRepo = require('../repositories/StationRepository')

const getAllStations = () => StationRepo.findAllOrdered()

const createStation = async (data) => {
  const exists = await StationRepo.maGaExists(data.ma_ga_viet_tat)
  if (exists) throw { status: 400, message: 'Mã ga đã tồn tại' }
  return StationRepo.create({
    ma_ga_viet_tat: data.ma_ga_viet_tat,
    ten_ga: data.ten_ga,
    tinh_thanh: data.tinh_thanh,
    thu_tu_tuyen: data.thu_tu_tuyen,
    do_uu_tien: data.do_uu_tien || 3,
    trang_thai: data.trang_thai || 'hoat_dong',
  })
}

const updateStation = (id, data) => StationRepo.update(id, {
  ma_ga_viet_tat: data.ma_ga_viet_tat, ten_ga: data.ten_ga, tinh_thanh: data.tinh_thanh,
  thu_tu_tuyen: data.thu_tu_tuyen, do_uu_tien: data.do_uu_tien, trang_thai: data.trang_thai,
}, 'id_ga')

const deleteStation = async (id) => {
  const used = await StationRepo.isUsedInSchedule(id)
  if (used) throw { status: 400, message: 'Ga đang được sử dụng trong lịch trình, không thể xóa' }
  await StationRepo.delete(id, 'id_ga')
}

module.exports = { getAllStations, createStation, updateStation, deleteStation }
