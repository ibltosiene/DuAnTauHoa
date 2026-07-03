const { BaseRepository } = require('@kln/shared')
const { HanhKhach } = require('../models')

class PassengerRepository extends BaseRepository {
  constructor() {
    super(HanhKhach)
  }

  findByHoTenNgaySinh(ho_ten, ngay_sinh) {
    return HanhKhach.findOne({ where: { ho_ten, ngay_sinh } })
  }

  findByTaiKhoan(id_tai_khoan) {
    return HanhKhach.findAll({ where: { id_tai_khoan }, order: [['la_chinh', 'DESC']] })
  }
}

module.exports = new PassengerRepository()
