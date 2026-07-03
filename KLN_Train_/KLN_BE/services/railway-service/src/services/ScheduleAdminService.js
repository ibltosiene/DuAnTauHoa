const ScheduleRepository = require('../repositories/ScheduleAdminRepository')

const getAllSchedules = async () => ScheduleRepository.getAll()

const getScheduleStations = async (id) => {
  const schedule = await ScheduleRepository.findById(id)
  if (!schedule) throw { status: 404, message: 'Không tìm thấy lịch chạy' }
  const stops = await ScheduleRepository.getStops(id)
  return stops.map((row, index, arr) => ({
    ...row,
    khoang_cach_giua_ga: index === 0 ? 0 : row.khoang_cach_km - (arr[index - 1]?.khoang_cach_km || 0),
    tong_km: row.khoang_cach_km,
  }))
}

const createSchedule = async ({ id_tau, id_ga_di, id_ga_den, gio_khoi_hanh, gio_du_kien_den, thu_trong_tuan }) => {
  if (!id_tau || !id_ga_di || !id_ga_den || !gio_khoi_hanh || !gio_du_kien_den) {
    throw { status: 400, message: 'Vui lòng điền đầy đủ thông tin' }
  }
  const id = await ScheduleRepository.create({ id_tau, id_ga_di, id_ga_den, gio_khoi_hanh, gio_du_kien_den, thu_trong_tuan })
  return { id_lich_chay: id }
}

const deleteSchedule = async (id) => {
  const schedule = await ScheduleRepository.findById(id)
  if (!schedule) throw { status: 404, message: 'Không tìm thấy lịch chạy' }
  await ScheduleRepository.remove(id)
}

const addStopStation = async (id_lich_chay, { thu_tu_dung, id_ga, gio_den, gio_di, khoang_cach_km, thoi_gian_dung }) => {
  if (!thu_tu_dung || !id_ga || !gio_den || !gio_di) {
    throw { status: 400, message: 'Vui lòng điền đầy đủ thông tin ga dừng' }
  }
  await ScheduleRepository.addStop({ id_lich_chay, thu_tu_dung, id_ga, gio_den, gio_di, khoang_cach_km, thoi_gian_dung })
}

const removeStopStation = async (id_lich_chay, id_ga) => {
  await ScheduleRepository.removeStop({ id_lich_chay, id_ga })
}

const getScheduleById = async (id) => ScheduleRepository.getScheduleDetail(id)

const getTrips = async (query) => ScheduleRepository.getTrips(query)

const getUpcomingTrips = async () => ScheduleRepository.getUpcomingTrips()

const generateTrips = async ({ id_lich_chay, tu_ngay, den_ngay }) => {
  if (!id_lich_chay || !tu_ngay || !den_ngay) {
    throw { status: 400, message: 'Cần cung cấp id_lich_chay, tu_ngay, den_ngay' }
  }
  const schedule = await ScheduleRepository.findById(id_lich_chay)
  if (!schedule) throw { status: 404, message: 'Không tìm thấy lịch chạy' }
  return ScheduleRepository.generateTrips({ id_lich_chay, tu_ngay, den_ngay })
}

module.exports = {
  getAllSchedules, getScheduleById, getScheduleStations,
  createSchedule, deleteSchedule, addStopStation, removeStopStation,
  getTrips, getUpcomingTrips, generateTrips,
}
