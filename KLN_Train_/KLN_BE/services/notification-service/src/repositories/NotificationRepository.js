const { sequelize } = require('../config/database')
const { ThongBao } = require('../models')

// Tránh lỗi convert datetime của driver mssql khi để Sequelize tự áp
// defaultValue: DataTypes.NOW — truyền thẳng literal ISO đã cắt gọn.
const fmtDt = (d) => sequelize.literal(`'${new Date(d).toISOString().replace('T', ' ').slice(0, 23)}'`)

const findByTaiKhoan = (idTaiKhoan, limit = 50) =>
  ThongBao.findAll({ where: { id_tai_khoan: idTaiKhoan }, order: [['thoi_gian_tao', 'DESC']], limit })

const findByIdAndTaiKhoan = (idThongBao, idTaiKhoan) =>
  ThongBao.findOne({ where: { id_thong_bao: idThongBao, id_tai_khoan: idTaiKhoan } })

const markAllAsRead = async (idTaiKhoan) => {
  const [count] = await ThongBao.update({ da_doc: true }, { where: { id_tai_khoan: idTaiKhoan, da_doc: false } })
  return count
}

// ── Admin (FR_Admin) ──
const broadcastToAll = ({ tieu_de, noi_dung, loai, lien_ket }) => sequelize.query(`
    INSERT INTO ThongBao (id_tai_khoan, tieu_de, noi_dung, loai, lien_ket, thoi_gian_tao)
    SELECT id_tai_khoan, :tieu_de, :noi_dung, :loai, :lien_ket, GETDATE()
    FROM TaiKhoan
    WHERE trang_thai = 'hoat_dong'
  `, { replacements: { tieu_de, noi_dung, loai: loai || 'he_thong', lien_ket: lien_ket || null } })

const broadcastToGroup = ({ vai_tro, tieu_de, noi_dung, loai, lien_ket }) => sequelize.query(`
    INSERT INTO ThongBao (id_tai_khoan, tieu_de, noi_dung, loai, lien_ket, thoi_gian_tao)
    SELECT id_tai_khoan, :tieu_de, :noi_dung, :loai, :lien_ket, GETDATE()
    FROM TaiKhoan
    WHERE vai_tro = :vai_tro AND trang_thai = 'hoat_dong'
  `, { replacements: { vai_tro, tieu_de, noi_dung, loai: loai || 'he_thong', lien_ket: lien_ket || null } })

const getByAccount = ({ id_tai_khoan, offset, limit }) =>
  ThongBao.findAll({ where: { id_tai_khoan }, order: [['thoi_gian_tao', 'DESC']], offset, limit })

const countByAccount = (id_tai_khoan) => ThongBao.count({ where: { id_tai_khoan } })

const markAsReadAdmin = ({ id, id_tai_khoan }) =>
  ThongBao.update({ da_doc: true }, { where: { id_thong_bao: id, id_tai_khoan } })

const countUnread = (id_tai_khoan) => ThongBao.count({ where: { id_tai_khoan, da_doc: false } })

const deleteNotification = ({ id, id_tai_khoan }) =>
  ThongBao.destroy({ where: { id_thong_bao: id, id_tai_khoan } })

// ── Internal (gọi từ service khác) ──
const createForAccount = ({ id_tai_khoan, tieu_de, noi_dung, loai, lien_ket }) =>
  ThongBao.create({
    id_tai_khoan, tieu_de, noi_dung, loai: loai || 'he_thong', lien_ket: lien_ket || null,
    thoi_gian_tao: fmtDt(new Date()),
  })

module.exports = {
  findByTaiKhoan, findByIdAndTaiKhoan, markAllAsRead,
  broadcastToAll, broadcastToGroup, getByAccount, countByAccount,
  markAsReadAdmin, countUnread, deleteNotification, createForAccount,
}
