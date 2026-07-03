const { sequelize } = require('../config/database')
const { AuditLog } = require('../models')

// Tránh lỗi convert datetime của driver mssql khi để Sequelize tự áp
// defaultValue: DataTypes.NOW — truyền thẳng literal ISO đã cắt gọn.
const fmtDt = (d) => sequelize.literal(`'${new Date(d).toISOString().replace('T', ' ').slice(0, 23)}'`)

const create = ({ bang, ma_ban_ghi, hanh_dong, gia_tri_cu, gia_tri_moi, id_tai_khoan, ip_address, user_agent }) =>
  AuditLog.create({
    bang, ma_ban_ghi, hanh_dong,
    gia_tri_cu: gia_tri_cu ? JSON.stringify(gia_tri_cu) : null,
    gia_tri_moi: gia_tri_moi ? JSON.stringify(gia_tri_moi) : null,
    id_tai_khoan: id_tai_khoan || null,
    ip_address: ip_address || null,
    user_agent: user_agent || null,
    thoi_gian: fmtDt(new Date()),
  })

// TaiKhoan (auth) chỉ đọc read-only qua raw SQL để hiển thị tên người thực hiện.
const getAuditLogs = async ({ bang, tu_ngay, den_ngay, limit = 100 }) => {
  let query = `
    SELECT id_log, bang, ma_ban_ghi, hanh_dong, gia_tri_cu, gia_tri_moi,
           tk.ho_ten AS nguoi_thuc_hien, ip_address, user_agent, thoi_gian
    FROM AuditLog al
    LEFT JOIN TaiKhoan tk ON tk.id_tai_khoan = al.id_tai_khoan
    WHERE 1=1
  `
  const replacements = {}
  if (bang) { query += ` AND al.bang = :bang`; replacements.bang = bang }
  if (tu_ngay) { query += ` AND al.thoi_gian >= :tu_ngay`; replacements.tu_ngay = tu_ngay }
  if (den_ngay) { query += ` AND al.thoi_gian <= :den_ngay`; replacements.den_ngay = den_ngay }
  query += ` ORDER BY al.thoi_gian DESC OFFSET 0 ROWS FETCH NEXT :limit ROWS ONLY`
  replacements.limit = parseInt(limit)

  return sequelize.query(query, { replacements, type: sequelize.QueryTypes.SELECT })
}

module.exports = { create, getAuditLogs }
