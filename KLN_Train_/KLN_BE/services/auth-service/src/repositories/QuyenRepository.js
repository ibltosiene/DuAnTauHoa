const { BaseRepository } = require('@kln/shared')
const { Quyen } = require('../models')

class QuyenRepository extends BaseRepository {
  constructor() {
    super(Quyen)
  }

  async findByMa(ma_quyen) {
    return this.findOne({ ma_quyen })
  }
}

module.exports = new QuyenRepository()
