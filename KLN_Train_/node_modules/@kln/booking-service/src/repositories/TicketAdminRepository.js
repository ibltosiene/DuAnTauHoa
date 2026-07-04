const { sequelize } = require('../config/database')

// Ve/DonDatVe thuộc Booking; TaiKhoan (auth) + ChuyenTau/LichChay/Tau/GaTau
// (railway) chỉ đọc read-only qua raw SQL (cùng CSDL, ngoại lệ thực dụng).

const getAll = () => sequelize.query(`
    SELECT
      v.id_ve, v.gia_ve, v.so_toa_thu_tu, v.so_ghe_trong_toa, v.trang_thai, v.ngay_xuat_ve,
      ISNULL(tk.ho_ten, d.ho_ten_lien_lac) AS ho_ten,
      t.so_hieu,
      gd.ten_ga AS ga_di, gc.ten_ga AS ga_den,
      ct.ngay_chay,
      FORMAT(lc.gio_khoi_hanh, 'HH:mm') AS gio_di,
      FORMAT(lc.gio_du_kien_den, 'HH:mm') AS gio_den
    FROM Ve v
    JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    LEFT JOIN TaiKhoan tk ON tk.id_tai_khoan = d.id_tai_khoan
    JOIN ChuyenTau ct ON ct.id_chuyen = v.id_chuyen
    JOIN LichChay lc ON lc.id_lich_chay = ct.id_lich_chay
    JOIN Tau t ON t.id_tau = lc.id_tau
    JOIN GaTau gd ON gd.id_ga = v.id_ga_len
    JOIN GaTau gc ON gc.id_ga = v.id_ga_xuong
    ORDER BY v.ngay_xuat_ve DESC
  `, { type: sequelize.QueryTypes.SELECT })

const findById = async (id) => {
  const rows = await sequelize.query(`
    SELECT
      v.id_ve, v.gia_ve, v.so_toa_thu_tu, v.so_ghe_trong_toa, v.trang_thai, v.ngay_xuat_ve,
      ISNULL(tk.ho_ten, d.ho_ten_lien_lac) AS ho_ten,
      ISNULL(tk.email, d.email_dat_cho) AS email,
      ISNULL(tk.so_dien_thoai, d.sdt_dat_cho) AS so_dien_thoai,
      t.so_hieu AS chuyen_tau, t.ten_tau,
      gd.ten_ga AS ga_len, gc.ten_ga AS ga_xuong,
      ct.ngay_chay,
      FORMAT(lc.gio_khoi_hanh, 'HH:mm') AS gio_di,
      FORMAT(lc.gio_du_kien_den, 'HH:mm') AS gio_den,
      d.ma_don, d.ma_dat_cho, d.tong_tien, d.tien_thanh_toan
    FROM Ve v
    JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    LEFT JOIN TaiKhoan tk ON tk.id_tai_khoan = d.id_tai_khoan
    JOIN ChuyenTau ct ON ct.id_chuyen = v.id_chuyen
    JOIN LichChay lc ON lc.id_lich_chay = ct.id_lich_chay
    JOIN Tau t ON t.id_tau = lc.id_tau
    JOIN GaTau gd ON gd.id_ga = v.id_ga_len
    JOIN GaTau gc ON gc.id_ga = v.id_ga_xuong
    WHERE v.id_ve = :id
  `, { replacements: { id }, type: sequelize.QueryTypes.SELECT })
  return rows[0] || null
}

const getStatusInfo = async (id) => {
  const rows = await sequelize.query(`
    SELECT v.trang_thai, d.ma_dat_cho, d.trang_thai AS trang_thai_don
    FROM Ve v JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    WHERE v.id_ve = :id
  `, { replacements: { id }, type: sequelize.QueryTypes.SELECT })
  return rows[0] || null
}

const updateStatus = (id, trang_thai) => sequelize.query(
  'UPDATE Ve SET trang_thai = :trang_thai WHERE id_ve = :id',
  { replacements: { id, trang_thai } }
)

const bulkMarkExpired = async () => {
  const [, meta] = await sequelize.query(`
    UPDATE Ve
    SET trang_thai = 'da_su_dung'
    WHERE trang_thai IN ('hieu_luc', 'da_xac_nhan')
      AND EXISTS (
        SELECT 1 FROM ChuyenTau ct
        WHERE ct.id_chuyen = Ve.id_chuyen AND ct.ngay_chay < GETDATE()
      )
  `)
  return meta?.rowsAffected ?? 0
}

const markExpiredById = (id) => sequelize.query(`
    UPDATE Ve
    SET trang_thai = 'da_su_dung'
    WHERE id_ve = :id
      AND trang_thai IN ('hieu_luc', 'da_xac_nhan')
      AND EXISTS (
        SELECT 1 FROM ChuyenTau ct
        WHERE ct.id_chuyen = Ve.id_chuyen AND ct.ngay_chay < GETDATE()
      )
  `, { replacements: { id } })

const getStats = async () => {
  const rows = await sequelize.query(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN trang_thai IN ('hieu_luc', 'da_xac_nhan') THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN trang_thai = 'da_su_dung' THEN 1 ELSE 0 END) AS used,
      SUM(CASE WHEN trang_thai = 'da_huy' THEN 1 ELSE 0 END) AS cancelled
    FROM Ve
  `, { type: sequelize.QueryTypes.SELECT })
  return rows[0]
}

module.exports = { getAll, findById, getStatusInfo, updateStatus, bulkMarkExpired, markExpiredById, getStats }
