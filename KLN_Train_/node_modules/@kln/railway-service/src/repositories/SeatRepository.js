const { BaseRepository } = require('@kln/shared')
const { LoaiGhe, LoaiToa, CauHinhGhe } = require('../models')

// Ghi chú: các endpoint "public" cũ (getSeatMap/getCarriageList/holdSeat/
// releaseSeat/checkAvailability/getAvailableCount qua sp_GetSoDoGhe,
// sp_GetDanhSachToa, sp_GiuGheTam, sp_GiaiPhongGhe...) không được frontend
// nào gọi tới (đã khảo sát toàn bộ 3 frontend) và một số stored procedure
// tương ứng (sp_GetDanhSachToa, sp_GiaiPhongGhe) còn không tồn tại trong
// CSDL — nên KHÔNG port sang đây. Luồng giữ ghế thật sự nằm ở
// booking-service gọi railway-service qua /internal/seats/*.

class SeatRepository extends BaseRepository {
  constructor() {
    super(LoaiGhe)
  }

  findAllSeatTypes() {
    return LoaiGhe.findAll({ include: [{ model: LoaiToa, attributes: ['ten_loai_toa'] }], order: [['id_loai_ghe', 'ASC']] })
  }

  findSeatTypeById(id) {
    return LoaiGhe.findByPk(id, { include: [{ model: LoaiToa, attributes: ['ten_loai_toa'] }] })
  }

  seatTypeCodeExists(ma_loai_ghe) {
    return LoaiGhe.count({ where: { ma_loai_ghe } }).then(c => c > 0)
  }

  isSeatTypeUsed(id) {
    return CauHinhGhe.count({ where: { id_loai_ghe: id } }).then(c => c > 0)
  }

  findAllCarriageTypes() {
    return LoaiToa.findAll({ order: [['id_loai_toa', 'ASC']] })
  }

  findCarriageTypeById(id) {
    return LoaiToa.findByPk(id)
  }

  isCarriageTypeUsed(id) {
    return LoaiGhe.count({ where: { id_loai_toa: id } }).then(c => c > 0)
  }

  async configureSeats(id_loai_toa, seats) {
    await CauHinhGhe.destroy({ where: { id_loai_toa } })
    if (seats?.length) {
      await CauHinhGhe.bulkCreate(seats.map(s => ({
        id_loai_toa: parseInt(id_loai_toa),
        so_ghe_trong_toa: s.so_ghe_trong_toa,
        id_loai_ghe: s.id_loai_ghe,
        vi_tri: s.vi_tri,
        tang: s.tang,
        khoang_so: s.khoang_so,
        ben: s.ben,
      })))
    }
  }

  getSeatConfiguration(id_loai_toa) {
    return CauHinhGhe.findAll({
      where: { id_loai_toa },
      include: [{ model: LoaiGhe, attributes: ['ma_loai_ghe', 'ten_loai_ghe', 'he_so_gia'] }],
      order: [['so_ghe_trong_toa', 'ASC']],
    })
  }
}

module.exports = new SeatRepository()
