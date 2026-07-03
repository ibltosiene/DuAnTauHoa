const { sequelize } = require('../config/database')

// Port trực tiếp từ DuAnTauHoaCom/backend/src/admin/repositories/ScheduleRepository.js
// (raw SQL mssql executeQuery) sang Sequelize sequelize.query — giữ nguyên tên cột
// trả về để FR_Admin/SchedulesManagement.jsx không cần sửa.

const getAll = async () => sequelize.query(`
    SELECT
      lc.id_lich_chay,
      t.so_hieu,
      t.ten_tau,
      gd.ten_ga AS ga_di,
      gc.ten_ga AS ga_den,
      CONVERT(VARCHAR(5), lc.gio_khoi_hanh, 108) AS gio_khoi_hanh,
      CONVERT(VARCHAR(5), lc.gio_du_kien_den, 108) AS gio_du_kien_den,
      lc.thu_trong_tuan,
      (SELECT COUNT(*) FROM LichTrinhChuyen WHERE id_lich_chay = lc.id_lich_chay) AS so_ga_dung,
      (SELECT MAX(khoang_cach_km) FROM LichTrinhChuyen WHERE id_lich_chay = lc.id_lich_chay) AS tong_khoang_cach
    FROM LichChay lc
    JOIN Tau t ON t.id_tau = lc.id_tau
    JOIN GaTau gd ON gd.id_ga = lc.id_ga_di
    JOIN GaTau gc ON gc.id_ga = lc.id_ga_den
    ORDER BY lc.id_lich_chay
  `, { type: sequelize.QueryTypes.SELECT })

const getStops = async (id) => sequelize.query(`
    SELECT
      lt.thu_tu_dung,
      lt.id_ga,
      g.ten_ga,
      g.tinh_thanh,
      g.ma_ga_viet_tat,
      CONVERT(VARCHAR(5), lt.gio_den, 108) AS gio_den,
      CONVERT(VARCHAR(5), lt.gio_di, 108)  AS gio_di,
      lt.khoang_cach_km,
      lt.thoi_gian_dung,
      ISNULL(lt.offset_phut, 0) AS offset_phut
    FROM LichTrinhChuyen lt
    JOIN GaTau g ON g.id_ga = lt.id_ga
    WHERE lt.id_lich_chay = :id
    ORDER BY lt.thu_tu_dung
  `, { replacements: { id }, type: sequelize.QueryTypes.SELECT })

const findById = async (id) => {
  const rows = await sequelize.query(
    'SELECT id_lich_chay FROM LichChay WHERE id_lich_chay = :id',
    { replacements: { id }, type: sequelize.QueryTypes.SELECT }
  )
  return rows[0] || null
}

const create = async ({ id_tau, id_ga_di, id_ga_den, gio_khoi_hanh, gio_du_kien_den, thu_trong_tuan }) => {
  const [row] = await sequelize.query(`
    INSERT INTO LichChay (id_tau, id_ga_di, id_ga_den, gio_khoi_hanh, gio_du_kien_den, thu_trong_tuan)
    OUTPUT INSERTED.id_lich_chay
    VALUES (:id_tau, :id_ga_di, :id_ga_den, :gio_khoi_hanh, :gio_du_kien_den, :thu_trong_tuan)
  `, { replacements: { id_tau, id_ga_di, id_ga_den, gio_khoi_hanh, gio_du_kien_den, thu_trong_tuan: thu_trong_tuan || null }, type: sequelize.QueryTypes.INSERT })
  return row[0].id_lich_chay
}

const remove = async (id) => {
  await sequelize.query('DELETE FROM LichTrinhChuyen WHERE id_lich_chay = :id', { replacements: { id } })
  await sequelize.query('DELETE FROM LichChay WHERE id_lich_chay = :id', { replacements: { id } })
}

const addStop = async ({ id_lich_chay, thu_tu_dung, id_ga, gio_den, gio_di, khoang_cach_km, thoi_gian_dung }) => {
  await sequelize.query(`
    INSERT INTO LichTrinhChuyen (id_lich_chay, thu_tu_dung, id_ga, gio_den, gio_di, khoang_cach_km, thoi_gian_dung, offset_phut)
    VALUES (:id_lich_chay, :thu_tu_dung, :id_ga, :gio_den, :gio_di, :khoang_cach_km, :thoi_gian_dung, 0)
  `, { replacements: { id_lich_chay, thu_tu_dung, id_ga, gio_den, gio_di, khoang_cach_km, thoi_gian_dung } })
}

const removeStop = async ({ id_lich_chay, id_ga }) => {
  await sequelize.query(
    'DELETE FROM LichTrinhChuyen WHERE id_lich_chay = :id AND id_ga = :stationId',
    { replacements: { id: id_lich_chay, stationId: id_ga } }
  )
}

const getScheduleDetail = async (id) => {
  const rows = await sequelize.query(`
    SELECT lc.id_lich_chay, t.so_hieu, t.ten_tau, t.id_tau,
           gd.ten_ga AS ga_di, lc.id_ga_di,
           gc.ten_ga AS ga_den, lc.id_ga_den,
           CONVERT(VARCHAR(5), lc.gio_khoi_hanh, 108) AS gio_khoi_hanh,
           CONVERT(VARCHAR(5), lc.gio_du_kien_den, 108) AS gio_du_kien_den,
           lc.thu_trong_tuan
    FROM LichChay lc
    JOIN Tau t ON t.id_tau = lc.id_tau
    JOIN GaTau gd ON gd.id_ga = lc.id_ga_di
    JOIN GaTau gc ON gc.id_ga = lc.id_ga_den
    WHERE lc.id_lich_chay = :id
  `, { replacements: { id }, type: sequelize.QueryTypes.SELECT })
  return rows[0] || null
}

const getTrips = async ({ tu_ngay, den_ngay, trang_thai } = {}) => {
  let where = 'WHERE 1=1'
  const params = {}
  if (tu_ngay) { where += ' AND ct.ngay_chay >= :tu_ngay'; params.tu_ngay = tu_ngay }
  if (den_ngay) { where += ' AND ct.ngay_chay <= :den_ngay'; params.den_ngay = den_ngay }
  if (trang_thai) { where += ' AND ct.trang_thai = :trang_thai'; params.trang_thai = trang_thai }
  return sequelize.query(`
    SELECT ct.id_chuyen, ct.ngay_chay, ct.trang_thai,
           t.so_hieu, t.ten_tau,
           gd.ten_ga AS ga_di, gc.ten_ga AS ga_den,
           CONVERT(VARCHAR(5), lc.gio_khoi_hanh, 108) AS gio_khoi_hanh,
           CONVERT(VARCHAR(5), lc.gio_du_kien_den, 108) AS gio_du_kien_den
    FROM ChuyenTau ct
    JOIN LichChay lc ON lc.id_lich_chay = ct.id_lich_chay
    JOIN Tau t ON t.id_tau = lc.id_tau
    JOIN GaTau gd ON gd.id_ga = lc.id_ga_di
    JOIN GaTau gc ON gc.id_ga = lc.id_ga_den
    ${where}
    ORDER BY ct.ngay_chay DESC, lc.gio_khoi_hanh
  `, { replacements: params, type: sequelize.QueryTypes.SELECT })
}

const getUpcomingTrips = async () => sequelize.query(`
    SELECT TOP 20 ct.id_chuyen, ct.ngay_chay, ct.trang_thai,
           t.so_hieu, t.ten_tau,
           gd.ten_ga AS ga_di, gc.ten_ga AS ga_den,
           CONVERT(VARCHAR(5), lc.gio_khoi_hanh, 108) AS gio_khoi_hanh
    FROM ChuyenTau ct
    JOIN LichChay lc ON lc.id_lich_chay = ct.id_lich_chay
    JOIN Tau t ON t.id_tau = lc.id_tau
    JOIN GaTau gd ON gd.id_ga = lc.id_ga_di
    JOIN GaTau gc ON gc.id_ga = lc.id_ga_den
    WHERE ct.ngay_chay >= CAST(GETDATE() AS DATE) AND ct.trang_thai NOT IN ('huy','da_chay')
    ORDER BY ct.ngay_chay, lc.gio_khoi_hanh
  `, { type: sequelize.QueryTypes.SELECT })

const generateTrips = async ({ id_lich_chay, tu_ngay, den_ngay }) => {
  const rows = await sequelize.query(`
    DECLARE @ngay DATE = :tu_ngay;
    DECLARE @so_chuyen_tao INT = 0;
    WHILE @ngay <= :den_ngay
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM ChuyenTau WHERE id_lich_chay = :id_lich_chay AND ngay_chay = @ngay
      )
      BEGIN
        INSERT INTO ChuyenTau (id_lich_chay, ngay_chay, trang_thai)
        VALUES (:id_lich_chay, @ngay, 'cho_khoi_hanh');
        SET @so_chuyen_tao = @so_chuyen_tao + 1;
      END
      SET @ngay = DATEADD(DAY, 1, @ngay);
    END
    SELECT @so_chuyen_tao AS so_chuyen_tao;
  `, { replacements: { id_lich_chay, tu_ngay, den_ngay }, type: sequelize.QueryTypes.SELECT })
  return rows[0]
}

module.exports = { getAll, getStops, findById, getScheduleDetail, create, remove, addStop, removeStop, getTrips, getUpcomingTrips, generateTrips }
