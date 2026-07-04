const { sequelize } = require('../config/database')
const Q = (sql, replacements) => sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT })

const getStats = async () => {
  const [revenue] = await Q(`SELECT ISNULL(SUM(tong_tien), 0) AS total_revenue FROM DonDatVe WHERE trang_thai = 'da_thanh_toan'`)
  const [tickets] = await Q(`SELECT COUNT(*) AS total_tickets FROM Ve`)
  const [customers] = await Q(`SELECT COUNT(*) AS total_customers FROM TaiKhoan WHERE vai_tro = 'khach_hang'`)
  const [trains] = await Q(`SELECT COUNT(*) AS total_trains FROM Tau WHERE trang_thai = 'hoat_dong'`)
  const [occupancy] = await Q(`
    SELECT AVG(CAST(so_ve AS FLOAT) / so_ghe * 100) AS avg_occupancy
    FROM (
      SELECT ct.id_chuyen, COUNT(v.id_ve) AS so_ve, SUM(lt.so_cho_toi_da) AS so_ghe
      FROM ChuyenTau ct
      LEFT JOIN Ve v ON ct.id_chuyen = v.id_chuyen AND v.trang_thai IN ('da_su_dung', 'da_xac_nhan')
      JOIN LichChay lc ON ct.id_lich_chay = lc.id_lich_chay
      JOIN Tau t ON lc.id_tau = t.id_tau
      JOIN CauHinhToa cto ON cto.id_tau = t.id_tau
      JOIN LoaiToa lt ON lt.id_loai_toa = cto.id_loai_toa
      WHERE ct.ngay_chay >= DATEADD(day, -30, GETDATE())
      GROUP BY ct.id_chuyen
    ) t
  `)

  return {
    total_revenue: revenue?.total_revenue || 0,
    total_tickets: tickets?.total_tickets || 0,
    total_customers: customers?.total_customers || 0,
    total_trains: trains?.total_trains || 0,
    avg_occupancy: Math.round(occupancy?.avg_occupancy || 0),
  }
}

const getRevenueByMonth = () => Q(`
    SELECT MONTH(ngay_xuat_ve) AS month, YEAR(ngay_xuat_ve) AS year,
           ISNULL(SUM(gia_ve), 0) AS revenue, COUNT(*) AS tickets
    FROM Ve v JOIN DonDatVe d ON v.id_don_dat_ve = d.id_don_dat_ve
    WHERE d.trang_thai = 'da_thanh_toan' AND ngay_xuat_ve >= DATEADD(month, -12, GETDATE())
    GROUP BY YEAR(ngay_xuat_ve), MONTH(ngay_xuat_ve)
    ORDER BY year ASC, month ASC
  `)

const getRevenueByWeek = () => Q(`
    SELECT DATEPART(weekday, ngay_xuat_ve) AS day_of_week,
           ISNULL(SUM(gia_ve), 0) AS revenue, COUNT(*) AS tickets
    FROM Ve v JOIN DonDatVe d ON v.id_don_dat_ve = d.id_don_dat_ve
    WHERE d.trang_thai = 'da_thanh_toan' AND ngay_xuat_ve >= DATEADD(day, -7, GETDATE())
    GROUP BY DATEPART(weekday, ngay_xuat_ve)
  `)

const getPopularRoutes = () => Q(`
    SELECT TOP 5 g1.ten_ga AS from_station, g2.ten_ga AS to_station,
           COUNT(v.id_ve) AS total_tickets, ISNULL(SUM(v.gia_ve), 0) AS total_revenue
    FROM Ve v
    JOIN GaTau g1 ON v.id_ga_len = g1.id_ga
    JOIN GaTau g2 ON v.id_ga_xuong = g2.id_ga
    JOIN DonDatVe d ON v.id_don_dat_ve = d.id_don_dat_ve
    WHERE d.trang_thai = 'da_thanh_toan'
    GROUP BY g1.ten_ga, g2.ten_ga
    ORDER BY total_tickets DESC
  `)

const getRecentOrders = () => Q(`
    SELECT TOP 10 d.ma_don AS id, tk.ho_ten AS customer, t.so_hieu AS train,
           g1.ten_ga AS from_station, g2.ten_ga AS to_station,
           FORMAT(d.thoi_gian_dat, 'yyyy-MM-dd') AS date, d.tong_tien AS amount, d.trang_thai AS status
    FROM DonDatVe d
    JOIN TaiKhoan tk ON d.id_tai_khoan = tk.id_tai_khoan
    LEFT JOIN Ve v ON d.id_don_dat_ve = v.id_don_dat_ve
    LEFT JOIN ChuyenTau ct ON v.id_chuyen = ct.id_chuyen
    LEFT JOIN LichChay lc ON ct.id_lich_chay = lc.id_lich_chay
    LEFT JOIN Tau t ON lc.id_tau = t.id_tau
    LEFT JOIN GaTau g1 ON v.id_ga_len = g1.id_ga
    LEFT JOIN GaTau g2 ON v.id_ga_xuong = g2.id_ga
    ORDER BY d.thoi_gian_dat DESC
  `)

const getUpcomingTrains = () => Q(`
    SELECT TOP 10 t.so_hieu AS id, g1.ten_ga AS from_station, g2.ten_ga AS to_station,
           FORMAT(lc.gio_khoi_hanh, 'HH:mm') AS departure, ct.trang_thai AS status
    FROM ChuyenTau ct
    JOIN LichChay lc ON ct.id_lich_chay = lc.id_lich_chay
    JOIN Tau t ON lc.id_tau = t.id_tau
    JOIN GaTau g1 ON lc.id_ga_di = g1.id_ga
    JOIN GaTau g2 ON lc.id_ga_den = g2.id_ga
    WHERE ct.ngay_chay = CAST(GETDATE() AS DATE) AND CAST(lc.gio_khoi_hanh AS TIME) >= CAST(GETDATE() AS TIME)
    ORDER BY lc.gio_khoi_hanh ASC
  `)

const getTopStations = () => Q(`
    SELECT TOP 5 g.ten_ga AS name, COUNT(v.id_ve) AS traffic
    FROM Ve v JOIN GaTau g ON v.id_ga_len = g.id_ga
    GROUP BY g.ten_ga
    ORDER BY traffic DESC
  `)

const getCustomerDistribution = () => Q(`
    SELECT loai_hanh_khach AS name, COUNT(*) AS value
    FROM HanhKhach
    GROUP BY loai_hanh_khach
  `)

const getRates = async () => {
  const [ontime] = await Q(`
    SELECT COUNT(CASE WHEN trang_thai = 'dung_gio' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS ontime_rate
    FROM ChuyenTau WHERE ngay_chay >= DATEADD(day, -30, GETDATE())
  `)
  const [cancel] = await Q(`
    SELECT COUNT(CASE WHEN trang_thai = 'da_huy' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) AS cancel_rate
    FROM Ve WHERE ngay_xuat_ve >= DATEADD(day, -30, GETDATE())
  `)
  return { ontime_rate: ontime?.ontime_rate || 0, cancel_rate: cancel?.cancel_rate || 0 }
}

module.exports = {
  getStats, getRevenueByMonth, getRevenueByWeek, getPopularRoutes,
  getRecentOrders, getUpcomingTrains, getTopStations, getCustomerDistribution, getRates,
}
