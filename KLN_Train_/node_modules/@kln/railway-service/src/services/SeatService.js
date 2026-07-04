const SeatRepo = require('../repositories/SeatRepository')
const { LoaiToa } = require('../models')

const configureSeatsForCarriage = (id_loai_toa, seats) => SeatRepo.configureSeats(id_loai_toa, seats)
const getSeatConfiguration = (id_loai_toa) => SeatRepo.getSeatConfiguration(id_loai_toa)

// ── Loại ghế ──
const getAllSeatTypes = () => SeatRepo.findAllSeatTypes()
const getSeatTypeById = (id) => SeatRepo.findSeatTypeById(id)

const createSeatType = async (data) => {
  const exists = await SeatRepo.seatTypeCodeExists(data.ma_loai_ghe)
  if (exists) throw { status: 400, message: 'Mã loại ghế đã tồn tại' }
  return SeatRepo.create({
    ma_loai_ghe: data.ma_loai_ghe,
    id_loai_toa: data.id_loai_toa,
    ten_loai_ghe: data.ten_loai_ghe,
    he_so_gia: data.he_so_gia,
    trang_thai: data.trang_thai || 'dang_ban',
  })
}

const updateSeatType = (id, data) => SeatRepo.update(id, {
  ten_loai_ghe: data.ten_loai_ghe, he_so_gia: data.he_so_gia,
  trang_thai: data.trang_thai, id_loai_toa: data.id_loai_toa,
}, 'id_loai_ghe')

const deleteSeatType = async (id) => {
  const used = await SeatRepo.isSeatTypeUsed(id)
  if (used) throw { status: 400, message: 'Loại ghế đang được sử dụng trong cấu hình' }
  await SeatRepo.delete(id, 'id_loai_ghe')
}

// ── Loại toa ──
const getAllCarriageTypes = () => SeatRepo.findAllCarriageTypes()
const getCarriageTypeById = (id) => SeatRepo.findCarriageTypeById(id)

const createCarriageType = (data) => LoaiToa.create({
  ma_loai_toa: data.ma_loai_toa, ten_loai_toa: data.ten_loai_toa,
  loai_ghe_chinh: data.loai_ghe_chinh, so_cho_toi_da: data.so_cho_toi_da,
})

const updateCarriageType = async (id, data) => {
  await LoaiToa.update({
    ten_loai_toa: data.ten_loai_toa, loai_ghe_chinh: data.loai_ghe_chinh, so_cho_toi_da: data.so_cho_toi_da,
  }, { where: { id_loai_toa: id } })
}

const deleteCarriageType = async (id) => {
  const used = await SeatRepo.isCarriageTypeUsed(id)
  if (used) throw { status: 400, message: 'Loại toa đang được sử dụng trong loại ghế' }
  await LoaiToa.destroy({ where: { id_loai_toa: id } })
}

module.exports = {
  configureSeatsForCarriage, getSeatConfiguration,
  getAllSeatTypes, getSeatTypeById, createSeatType, updateSeatType, deleteSeatType,
  getAllCarriageTypes, getCarriageTypeById, createCarriageType, updateCarriageType, deleteCarriageType,
}
