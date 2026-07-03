const { sequelize } = require('../config/database')
const Q = (sql, replacements) => sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT })

// Ghi chú: "days"/"days2" luôn là số nguyên tính sẵn từ getRangeDays() (7/30/
// 90/365, không bao giờ là input người dùng thô) nên nội suy thẳng vào SQL an
// toàn — tránh lỗi "Incorrect syntax near ':'" của driver mssql khi
// Sequelize thay thế named replacement ngay sau dấu trừ (vd DATEADD(day,-:days,...)).

const getRevenue = ({ days, groupExpr, labelExpr }) => {
  const d = parseInt(days)
  return Q(`
    SELECT ${groupExpr} AS ky, MIN(${labelExpr}) AS month,
           COUNT(v.id_ve) AS tickets, SUM(v.gia_ve) AS revenue
    FROM Ve v
    JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    WHERE d.trang_thai IN ('da_thanh_toan', 'da_xac_nhan')
      AND v.trang_thai != 'da_huy'
      AND v.ngay_xuat_ve >= DATEADD(day, -${d}, CAST(GETDATE() AS DATE))
    GROUP BY ${groupExpr}
    ORDER BY ky
  `)
}

const getRevenueByRoute = (days) => {
  const d = parseInt(days)
  return Q(`
    SELECT TOP 10 gd.ten_ga AS from_station, gn.ten_ga AS to_station,
           COUNT(v.id_ve) AS total_tickets, SUM(v.gia_ve) AS total_revenue
    FROM Ve v
    JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    JOIN GaTau gd ON gd.id_ga = v.id_ga_len
    JOIN GaTau gn ON gn.id_ga = v.id_ga_xuong
    WHERE d.trang_thai IN ('da_thanh_toan', 'da_xac_nhan')
      AND v.trang_thai != 'da_huy'
      AND v.ngay_xuat_ve >= DATEADD(day, -${d}, CAST(GETDATE() AS DATE))
    GROUP BY gd.ten_ga, gn.ten_ga
    ORDER BY total_revenue DESC
  `)
}

const getRevenueByTrain = (days) => {
  const d = parseInt(days)
  return Q(`
    SELECT t.so_hieu AS train_code, t.ten_tau AS train_name,
           agg.total_tickets, agg.total_revenue,
           ROUND(agg.total_tickets * 100.0 / NULLIF(seats.tong_ghe, 0), 1) AS occupancy_rate
    FROM (
      SELECT lc.id_tau, COUNT(v.id_ve) AS total_tickets, SUM(v.gia_ve) AS total_revenue
      FROM Ve v
      JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
      JOIN ChuyenTau ct ON ct.id_chuyen = v.id_chuyen
      JOIN LichChay lc ON lc.id_lich_chay = ct.id_lich_chay
      WHERE d.trang_thai IN ('da_thanh_toan', 'da_xac_nhan')
        AND v.trang_thai != 'da_huy'
        AND v.ngay_xuat_ve >= DATEADD(day, -${d}, CAST(GETDATE() AS DATE))
      GROUP BY lc.id_tau
    ) agg
    JOIN Tau t ON t.id_tau = agg.id_tau
    LEFT JOIN (
      SELECT cto.id_tau, SUM(lt.so_cho_toi_da) AS tong_ghe
      FROM CauHinhToa cto JOIN LoaiToa lt ON lt.id_loai_toa = cto.id_loai_toa
      GROUP BY cto.id_tau
    ) seats ON seats.id_tau = t.id_tau
    ORDER BY agg.total_revenue DESC
  `)
}

const getCustomerDistribution = () => Q(`
    SELECT v.loai_hanh_khach, COUNT(*) AS so_luong
    FROM Ve v JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    WHERE d.trang_thai IN ('da_thanh_toan', 'da_xac_nhan') AND v.trang_thai != 'da_huy'
    GROUP BY v.loai_hanh_khach
  `)

const getOccupancyReport = ({ tu_ngay, den_ngay }) => Q(`
    SELECT ct.id_chuyen, t.so_hieu AS ma_tau, ct.ngay_chay,
           SUM(lt.so_cho_toi_da) AS tong_ghe, COUNT(v.id_ve) AS ghe_da_ban,
           ROUND(COUNT(v.id_ve) * 100.0 / SUM(lt.so_cho_toi_da), 2) AS ty_le_lap_day
    FROM ChuyenTau ct
    JOIN LichChay lc ON lc.id_lich_chay = ct.id_lich_chay
    JOIN Tau t ON t.id_tau = lc.id_tau
    JOIN CauHinhToa cto ON cto.id_tau = t.id_tau
    JOIN LoaiToa lt ON lt.id_loai_toa = cto.id_loai_toa
    LEFT JOIN Ve v ON v.id_chuyen = ct.id_chuyen AND v.trang_thai = 'da_xac_nhan'
    WHERE ct.ngay_chay BETWEEN :tu_ngay AND :den_ngay
    GROUP BY ct.id_chuyen, t.so_hieu, ct.ngay_chay
    ORDER BY ty_le_lap_day DESC
  `, { tu_ngay, den_ngay })

const getCancellationReport = ({ tu_ngay, den_ngay }) => Q(`
    SELECT d.ma_don, tk.ho_ten, v.gia_ve, h.phi_huy, h.tien_hoan, h.ly_do, h.thoi_gian_hoan
    FROM HoanTien h
    JOIN Ve v ON v.id_ve = h.id_ve
    JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    JOIN TaiKhoan tk ON tk.id_tai_khoan = d.id_tai_khoan
    WHERE h.trang_thai_hoan = 'hoan_thanh' AND h.thoi_gian_hoan BETWEEN :tu_ngay AND :den_ngay
    ORDER BY h.thoi_gian_hoan DESC
  `, { tu_ngay, den_ngay })

const getCouponEffectiveness = () => Q(`
    SELECT km.ma_khuyen_mai, km.mo_ta, km.loai_giam, km.gia_tri, km.so_luong, km.da_dung,
           ROUND(km.da_dung * 100.0 / NULLIF(km.so_luong, 0), 2) AS ty_le_su_dung,
           SUM(d.tien_giam) AS tong_tien_giam
    FROM KhuyenMai km
    LEFT JOIN DonDatVe d ON d.id_khuyen_mai = km.id_khuyen_mai AND d.trang_thai = 'da_thanh_toan'
    GROUP BY km.id_khuyen_mai, km.ma_khuyen_mai, km.mo_ta, km.loai_giam, km.gia_tri, km.so_luong, km.da_dung
    ORDER BY ty_le_su_dung DESC
  `)

const getDashboardStats = async () => {
  const [stats] = await Q(`
    SELECT
      (SELECT COUNT(*) FROM TaiKhoan WHERE vai_tro = 'khach_hang') AS tong_khach,
      (SELECT COUNT(*) FROM DonDatVe WHERE trang_thai = 'da_thanh_toan') AS tong_don,
      (SELECT ISNULL(SUM(tien_thanh_toan), 0) FROM DonDatVe WHERE trang_thai = 'da_thanh_toan') AS tong_doanh_thu,
      (SELECT COUNT(*) FROM KhuyenMai WHERE ngay_het_han >= GETDATE()) AS khuyen_mai_dang_chay,
      (SELECT COUNT(*) FROM HoanTien WHERE trang_thai_hoan = 'cho_xu_ly') AS hoan_cho_xu_ly,
      (SELECT COUNT(*) FROM ChuyenTau WHERE ngay_chay >= CAST(GETDATE() AS DATE) AND trang_thai = 'dung_gio') AS chuyen_hoat_dong
  `)
  const recentOrders = await Q(`
    SELECT TOP 10 d.ma_don, tk.ho_ten, d.tong_tien, d.trang_thai, d.thoi_gian_dat
    FROM DonDatVe d JOIN TaiKhoan tk ON tk.id_tai_khoan = d.id_tai_khoan
    ORDER BY d.thoi_gian_dat DESC
  `)
  return { stats, recentOrders }
}

const getSummaryStats = async (days) => {
  const d = parseInt(days)
  const d2 = d * 2
  const [ticketStats] = await Q(`
    SELECT
      ISNULL(SUM(CASE WHEN v.ngay_xuat_ve >= DATEADD(day, -${d}, CAST(GETDATE() AS DATE)) AND v.trang_thai != 'da_huy' THEN v.gia_ve ELSE 0 END), 0) AS total_revenue,
      COUNT(CASE WHEN v.ngay_xuat_ve >= DATEADD(day, -${d}, CAST(GETDATE() AS DATE)) AND v.trang_thai != 'da_huy' THEN 1 END) AS total_tickets,
      ISNULL(SUM(CASE WHEN v.ngay_xuat_ve >= DATEADD(day, -${d2}, CAST(GETDATE() AS DATE)) AND v.ngay_xuat_ve < DATEADD(day, -${d}, CAST(GETDATE() AS DATE)) AND v.trang_thai != 'da_huy' THEN v.gia_ve ELSE 0 END), 0) AS prev_revenue,
      COUNT(CASE WHEN v.ngay_xuat_ve >= DATEADD(day, -${d2}, CAST(GETDATE() AS DATE)) AND v.ngay_xuat_ve < DATEADD(day, -${d}, CAST(GETDATE() AS DATE)) AND v.trang_thai != 'da_huy' THEN 1 END) AS prev_tickets,
      COUNT(CASE WHEN v.ngay_xuat_ve >= DATEADD(day, -${d}, CAST(GETDATE() AS DATE)) AND v.trang_thai = 'da_huy' THEN 1 END) AS cancelled_tickets
    FROM Ve v
    JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    WHERE d.trang_thai IN ('da_thanh_toan', 'da_xac_nhan', 'da_huy')
  `)

  const [{ total_customers }] = await Q(`SELECT COUNT(*) AS total_customers FROM TaiKhoan WHERE vai_tro = 'khach_hang'`)

  const [occupancyRow] = await Q(`
    SELECT AVG(ty_le) AS avg_occupancy
    FROM (
      SELECT ct.id_chuyen, COUNT(v.id_ve) * 100.0 / NULLIF(seats.tong_ghe, 0) AS ty_le
      FROM ChuyenTau ct
      JOIN LichChay lc ON lc.id_lich_chay = ct.id_lich_chay
      LEFT JOIN Ve v ON v.id_chuyen = ct.id_chuyen AND v.trang_thai != 'da_huy'
      LEFT JOIN (
        SELECT cto.id_tau, SUM(lt.so_cho_toi_da) AS tong_ghe
        FROM CauHinhToa cto JOIN LoaiToa lt ON lt.id_loai_toa = cto.id_loai_toa
        GROUP BY cto.id_tau
      ) seats ON seats.id_tau = lc.id_tau
      WHERE ct.ngay_chay >= DATEADD(day, -${d}, CAST(GETDATE() AS DATE))
      GROUP BY ct.id_chuyen, seats.tong_ghe
    ) occ
  `)

  return {
    ticketStats,
    total_customers,
    avg_occupancy: occupancyRow?.avg_occupancy || 0,
  }
}

module.exports = {
  getRevenue, getRevenueByRoute, getRevenueByTrain, getCustomerDistribution,
  getOccupancyReport, getCancellationReport, getCouponEffectiveness,
  getDashboardStats, getSummaryStats,
}
