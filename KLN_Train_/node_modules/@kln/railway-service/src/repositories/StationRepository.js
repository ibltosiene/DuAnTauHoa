const { BaseRepository } = require('@kln/shared')
const { GaTau, LichChay } = require('../models')

class StationRepository extends BaseRepository {
  constructor() {
    super(GaTau)
  }

  findAllOrdered() {
    return GaTau.findAll({ order: [['thu_tu_tuyen', 'ASC'], ['do_uu_tien', 'ASC']] })
  }

  maGaExists(ma_ga_viet_tat) {
    return GaTau.count({ where: { ma_ga_viet_tat } }).then(c => c > 0)
  }

  async isUsedInSchedule(id) {
    const { Op } = require('sequelize')
    const count = await LichChay.count({ where: { [Op.or]: [{ id_ga_di: id }, { id_ga_den: id }] } })
    return count > 0
  }
}

module.exports = new StationRepository()
