const { Op } = require('sequelize')
const { sequelize } = require('../config/database')
const {
  DonDatVe, Ve, HanhKhach, ThanhToan,
  ChuyenTau, LichChay, Tau, GaTau, TamGiuGhe, KhuyenMai,
} = require('../models')
const RailwaySeat = require('../services/RailwaySeatClient')

const VN_OFFSET = 7 * 60 * 60 * 1000
const fmtDt = (d) =>
  sequelize.literal(`'${new Date(new Date(d).getTime() + VN_OFFSET).toISOString().replace('T', ' ').slice(0, 23)}'`)

// ─── Queries cho lookup ───────────────────────────────────────────────
const findByMaDon = (maDon) =>
  DonDatVe.findOne({
    where: { ma_don: maDon },
    include: [
      { model: Ve, include: [{ model: HanhKhach }, { model: ChuyenTau, include: [{ model: LichChay, include: [{ model: Tau }, { model: GaTau, as: 'GaDi' }, { model: GaTau, as: 'GaDen' }] }] }, { model: GaTau, as: 'GaLen' }, { model: GaTau, as: 'GaXuong' }] },
      { model: ThanhToan }, { model: KhuyenMai },
    ],
  })

const findByMaDatCho = (maDatCho) =>
  DonDatVe.findOne({
    where: { ma_dat_cho: maDatCho.toUpperCase().trim() },
    include: [
      { model: Ve, include: [{ model: HanhKhach }, { model: ChuyenTau, include: [{ model: LichChay, include: [Tau, { model: GaTau, as: 'GaDi' }, { model: GaTau, as: 'GaDen' }] }] }, { model: GaTau, as: 'GaLen' }, { model: GaTau, as: 'GaXuong' }] },
      { model: ThanhToan },
    ],
  })

const findByTaiKhoan = (idTaiKhoan) =>
  DonDatVe.findAll({
    where: { id_tai_khoan: idTaiKhoan },
    include: [
      { model: Ve, include: [{ model: HanhKhach }, { model: ChuyenTau, include: [{ model: LichChay, include: [Tau, { model: GaTau, as: 'GaDi' }, { model: GaTau, as: 'GaDen' }] }] }, { model: GaTau, as: 'GaLen' }, { model: GaTau, as: 'GaXuong' }] },
      { model: ThanhToan },
    ],
    order: [['thoi_gian_dat', 'DESC']],
  })

// ─── Dọn dẹp TamGiuGhe + Ve hết hạn (phần local) + báo railway dọn GheChang ──
const cleanupExpiredForSeats = async (idChuyen, soToaThuTu, soGheList) => {
  const gheListStr = soGheList.map(Number).join(',')
  const ic = parseInt(idChuyen), st = parseInt(soToaThuTu)

  const expiredHolds = await sequelize.query(
    `SELECT DISTINCT id_don_dat_ve FROM TamGiuGhe
     WHERE id_chuyen = ${ic} AND so_toa_thu_tu = ${st}
       AND so_ghe_trong_toa IN (${gheListStr})
       AND id_don_dat_ve IS NOT NULL
       AND thoi_gian_het_han <= DATEADD(HOUR, 7, GETUTCDATE())`,
    { type: sequelize.QueryTypes.SELECT }
  )
  const donIds = [...new Set(expiredHolds.map(h => h.id_don_dat_ve).filter(Boolean))]
  if (donIds.length > 0) {
    const donList = donIds.join(',')
    await sequelize.query(
      `UPDATE Ve SET trang_thai='da_huy' WHERE id_don_dat_ve IN (${donList}) AND trang_thai='cho_xac_nhan'`
    )
    await sequelize.query(
      `UPDATE DonDatVe SET trang_thai='het_han' WHERE id_don_dat_ve IN (${donList}) AND trang_thai='cho_thanh_toan'`
    )
  }

  await sequelize.query(
    `DELETE FROM TamGiuGhe
     WHERE id_chuyen=${ic} AND so_toa_thu_tu=${st}
       AND so_ghe_trong_toa IN (${gheListStr})
       AND trang_thai <> 'da_dat'
       AND (trang_thai IN ('da_giai_phong','het_han')
            OR thoi_gian_het_han <= DATEADD(HOUR, 7, GETUTCDATE()))`
  )

  await RailwaySeat.cleanupExpired(idChuyen, soToaThuTu, soGheList).catch(() => {})
}

// ─── Giữ ghế: TamGiuGhe (local) + GheChang (railway) ────────────────────
const holdSeats = async (idChuyen, soToaThuTu, soGheList, sessionId, idDonDatVe = null, idGaLen = null, idGaXuong = null) => {
  await cleanupExpiredForSeats(idChuyen, soToaThuTu, soGheList)
  await RailwaySeat.ensureGheChuyen(idChuyen)

  const now = new Date()
  const hetHan = new Date(Date.now() + 15 * 60 * 1000)

  await Promise.all(soGheList.map(soGhe => TamGiuGhe.create({
    id_chuyen: idChuyen, so_toa_thu_tu: soToaThuTu,
    so_ghe_trong_toa: soGhe,
    session_id: sessionId, id_don_dat_ve: idDonDatVe,
    id_ga_len: idGaLen, id_ga_xuong: idGaXuong,
    trang_thai: 'dang_giu',
    thoi_gian_giu: fmtDt(now), thoi_gian_het_han: fmtDt(hetHan),
  })))

  await RailwaySeat.holdSeats(idChuyen, soToaThuTu, soGheList, sessionId, idGaLen, idGaXuong)
}

const releaseHoldBySession = async (sessionId) => {
  await sequelize.query(
    `DELETE FROM TamGiuGhe WHERE session_id='${sessionId.replace(/'/g, "''")}' AND trang_thai='dang_giu' AND id_don_dat_ve IS NULL`
  )
  await RailwaySeat.releaseHoldBySession(sessionId).catch(() => {})
}

const checkSeatsAvailable = async (idChuyen, soToaThuTu, soGheList, idGaLen = null, idGaXuong = null, excludeSessionId = null) => {
  await cleanupExpiredForSeats(idChuyen, soToaThuTu, soGheList)
  await RailwaySeat.ensureGheChuyen(idChuyen)
  return RailwaySeat.checkSeatsAvailable(idChuyen, soToaThuTu, soGheList, idGaLen, idGaXuong, excludeSessionId)
}

module.exports = {
  findByMaDon, findByMaDatCho, findByTaiKhoan,
  cleanupExpiredForSeats, holdSeats, releaseHoldBySession, checkSeatsAvailable,
}
