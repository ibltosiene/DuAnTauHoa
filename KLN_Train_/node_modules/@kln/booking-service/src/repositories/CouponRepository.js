const { BaseRepository } = require('@kln/shared')
const { KhuyenMai } = require('../models')

class CouponRepository extends BaseRepository {
  constructor() {
    super(KhuyenMai)
  }

  findAllOrdered() {
    return KhuyenMai.findAll({ order: [['ngay_het_han', 'DESC']] })
  }

  findByMa(ma_khuyen_mai) {
    return KhuyenMai.findOne({ where: { ma_khuyen_mai } })
  }
}

module.exports = new CouponRepository()
