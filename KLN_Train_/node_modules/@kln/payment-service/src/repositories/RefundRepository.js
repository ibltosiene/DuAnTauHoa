const { sequelize } = require('../config/database')
const { HoanTien } = require('../models')

// HoanTien thuộc Payment; Ve/DonDatVe (booking), TaiKhoan (auth),
// ChuyenTau/LichChay/Tau (railway) chỉ đọc read-only qua raw SQL.

const getAll = () => sequelize.query(`
    SELECT
      h.id_hoan, h.id_ve, h.tien_goc, h.phi_huy, h.tien_hoan,
      h.ly_do, h.trang_thai_hoan, h.thoi_gian_hoan AS ngay_huy,
      ISNULL(tk.ho_ten, d.ho_ten_lien_lac) AS ho_ten,
      t.so_hieu, v.ngay_xuat_ve
    FROM HoanTien h
    JOIN Ve v ON v.id_ve = h.id_ve
    JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    LEFT JOIN TaiKhoan tk ON tk.id_tai_khoan = d.id_tai_khoan
    JOIN ChuyenTau ct ON ct.id_chuyen = v.id_chuyen
    JOIN LichChay lc ON lc.id_lich_chay = ct.id_lich_chay
    JOIN Tau t ON t.id_tau = lc.id_tau
    ORDER BY h.thoi_gian_hoan DESC
  `, { type: sequelize.QueryTypes.SELECT })

const getById = async (id) => {
  const rows = await sequelize.query(`
    SELECT
      h.id_hoan, h.id_ve, h.tien_goc, h.phi_huy, h.tien_hoan,
      h.ly_do, h.trang_thai_hoan, h.thoi_gian_hoan AS ngay_huy,
      ISNULL(tk.ho_ten, d.ho_ten_lien_lac) AS ho_ten,
      t.so_hieu, v.ngay_xuat_ve
    FROM HoanTien h
    JOIN Ve v ON v.id_ve = h.id_ve
    JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    LEFT JOIN TaiKhoan tk ON tk.id_tai_khoan = d.id_tai_khoan
    JOIN ChuyenTau ct ON ct.id_chuyen = v.id_chuyen
    JOIN LichChay lc ON lc.id_lich_chay = ct.id_lich_chay
    JOIN Tau t ON t.id_tau = lc.id_tau
    WHERE h.id_hoan = :id
  `, { replacements: { id }, type: sequelize.QueryTypes.SELECT })
  return rows[0] || null
}

const confirm = (id) => HoanTien.update(
  { trang_thai_hoan: 'hoan_thanh', thoi_gian_hoan_xong: sequelize.literal('GETDATE()') },
  { where: { id_hoan: id } }
)

const reject = (id) => HoanTien.update({ trang_thai_hoan: 'that_bai' }, { where: { id_hoan: id } })

const getStats = async () => {
  const rows = await sequelize.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN trang_thai_hoan IN ('cho_xu_ly', 'dang_xu_ly') THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN trang_thai_hoan = 'hoan_thanh' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN trang_thai_hoan = 'that_bai' THEN 1 ELSE 0 END) AS rejected,
      SUM(CASE WHEN trang_thai_hoan = 'hoan_thanh' THEN tien_hoan ELSE 0 END) AS total_refunded
    FROM HoanTien
  `, { type: sequelize.QueryTypes.SELECT })
  return rows[0]
}

module.exports = { getAll, getById, confirm, reject, getStats }
