const { BaseRepository } = require('@kln/shared')
const { TaiKhoan, VaiTro } = require('../models')

class TaiKhoanRepository extends BaseRepository {
  constructor() {
    super(TaiKhoan)
  }

  async findByEmail(email) {
    return this.findOne({ email: email.toLowerCase().trim() })
  }

  async emailExists(email) {
    const count = await this.count({ email: email.toLowerCase().trim() })
    return count > 0
  }

  async findByIdWithRoles(id) {
    return TaiKhoan.findByPk(id, { include: [{ model: VaiTro, through: { attributes: [] } }] })
  }

  async findStaff() {
    const { Op } = require('sequelize')
    return TaiKhoan.findAll({
      where: { vai_tro: { [Op.in]: ['quan_tri', 'nhan_vien'] } },
      order: [['ngay_tao', 'DESC']],
    })
  }

  async findStaffById(id) {
    const { Op } = require('sequelize')
    return TaiKhoan.findOne({ where: { id_tai_khoan: id, vai_tro: { [Op.in]: ['quan_tri', 'nhan_vien'] } } })
  }
}

module.exports = new TaiKhoanRepository()
