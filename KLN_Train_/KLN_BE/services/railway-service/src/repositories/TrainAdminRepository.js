const { BaseRepository } = require('@kln/shared')
const { Tau, CauHinhToa, LoaiToa, LichChay } = require('../models')
const { sequelize } = require('../config/database')

class TrainAdminRepository extends BaseRepository {
  constructor() {
    super(Tau)
  }

  async findAllWithCoachCount() {
    const rows = await sequelize.query(`
      SELECT t.id_tau, t.so_hieu, t.ten_tau, t.so_toa, t.trang_thai,
             COUNT(DISTINCT cto.id_cau_hinh_toa) AS so_toa_thuc_te
      FROM Tau t
      LEFT JOIN CauHinhToa cto ON cto.id_tau = t.id_tau
      GROUP BY t.id_tau, t.so_hieu, t.ten_tau, t.so_toa, t.trang_thai
      ORDER BY t.so_hieu
    `, { type: sequelize.QueryTypes.SELECT })
    return rows
  }

  soHieuExists(so_hieu) {
    return Tau.count({ where: { so_hieu } }).then(c => c > 0)
  }

  getCarriagesByTrain(id_tau) {
    return CauHinhToa.findAll({
      where: { id_tau },
      include: [{ model: LoaiToa, attributes: ['ma_loai_toa', 'ten_loai_toa', 'so_cho_toi_da'] }],
      order: [['so_toa_thu_tu', 'ASC']],
    })
  }

  async isUsedInSchedule(id_tau) {
    const count = await LichChay.count({ where: { id_tau } })
    return count > 0
  }

  addCarriage({ id_tau, so_toa_thu_tu, id_loai_toa }) {
    return CauHinhToa.create({ id_tau, so_toa_thu_tu, id_loai_toa })
  }

  removeCarriage({ id_tau, id_cau_hinh_toa }) {
    return CauHinhToa.destroy({ where: { id_cau_hinh_toa, id_tau } })
  }
}

module.exports = new TrainAdminRepository()
