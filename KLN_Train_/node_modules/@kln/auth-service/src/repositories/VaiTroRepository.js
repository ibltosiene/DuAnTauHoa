const { BaseRepository } = require('@kln/shared')
const { VaiTro, Quyen } = require('../models')

class VaiTroRepository extends BaseRepository {
  constructor() {
    super(VaiTro)
  }

  async findByMa(ma_vai_tro) {
    return this.findOne({ ma_vai_tro })
  }

  async findAllWithQuyen() {
    return VaiTro.findAll({ include: [{ model: Quyen, through: { attributes: [] } }] })
  }

  async findByIdWithQuyen(id) {
    return VaiTro.findByPk(id, { include: [{ model: Quyen, through: { attributes: [] } }] })
  }

  async setQuyen(idVaiTro, idQuyenList) {
    const vaiTro = await VaiTro.findByPk(idVaiTro)
    if (!vaiTro) return null
    await vaiTro.setQuyens(idQuyenList)
    return this.findByIdWithQuyen(idVaiTro)
  }
}

module.exports = new VaiTroRepository()
