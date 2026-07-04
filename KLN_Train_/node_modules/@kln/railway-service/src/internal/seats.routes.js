const router = require('express').Router()
const { requireInternalKey, response: { ok, badRequest } } = require('@kln/shared')
const { sequelize } = require('../config/database')
const { ChuyenTau, LichChay } = require('../models')
const TrainRepo = require('../repositories/TrainRepository')
const GheChangRepo = require('../repositories/GheChangRepository')

// Route nội bộ cho booking-service — nơi DUY NHẤT ghi GheChuyen/GheChang.
// Booking chỉ hỏi "ghế còn không?" / "giữ giúp tôi" / "chốt giúp tôi", không
// tự sửa GheChang (đúng như mô tả kiến trúc ban đầu).
router.use(requireInternalKey)

const getLichChayId = async (idChuyen) => {
  const chuyen = await ChuyenTau.findByPk(idChuyen, { attributes: ['id_lich_chay'] })
  return chuyen?.id_lich_chay || null
}

const getThuTu = async (idLichChay, idGa) => {
  if (!idLichChay || !idGa) return null
  const stop = await TrainRepo.getStopInfo(idLichChay, idGa)
  return stop?.thu_tu_dung ?? null
}

router.post('/ensure', async (req, res, next) => {
  try {
    await TrainRepo.ensureGheChuyen(req.body.idChuyen)
    ok(res, null)
  } catch (err) { next(err) }
})

router.post('/cleanup-expired', async (req, res, next) => {
  try {
    const { idChuyen, soToaThuTu, soGheList } = req.body
    if (!idChuyen || !soToaThuTu || !soGheList?.length) return badRequest(res, 'Thiếu tham số')
    await GheChangRepo.cleanupExpired(idChuyen, soToaThuTu, soGheList)
    ok(res, null)
  } catch (err) { next(err) }
})

router.post('/check-available', async (req, res, next) => {
  try {
    const { idChuyen, soToaThuTu, soGheList, idGaLen, idGaXuong, excludeSessionId } = req.body
    if (!idChuyen || !soToaThuTu || !soGheList?.length) return badRequest(res, 'Thiếu tham số')

    await TrainRepo.ensureGheChuyen(idChuyen)
    const gheChuyenRows = await GheChangRepo.getGheChuyenIds(idChuyen, soToaThuTu, soGheList)
    if (!gheChuyenRows.length) return ok(res, { available: true })

    const idLichChay = await getLichChayId(idChuyen)
    let gaLen = idGaLen, gaXuong = idGaXuong
    if ((!gaLen || !gaXuong) && idLichChay) {
      const lc = await LichChay.findByPk(idLichChay, { attributes: ['id_ga_di', 'id_ga_den'] })
      if (lc) { gaLen = gaLen || lc.id_ga_di; gaXuong = gaXuong || lc.id_ga_den }
    }

    const thuTuTu = await getThuTu(idLichChay, gaLen)
    const thuTuDen = await getThuTu(idLichChay, gaXuong)

    if (thuTuTu !== null && thuTuDen !== null) {
      const overlapCount = await GheChangRepo.checkGheChangOverlap(gheChuyenRows, thuTuTu, thuTuDen, excludeSessionId)
      if (overlapCount > 0) return ok(res, { available: false })

      const gheListStr = gheChuyenRows.map(g => g.so_ghe_trong_toa).join(',')
      const [veCheck] = await sequelize.query(
        `SELECT COUNT(*) AS cnt FROM Ve v
         LEFT JOIN LichTrinhChuyen len_ex ON len_ex.id_lich_chay = ${idLichChay} AND len_ex.id_ga = v.id_ga_len
         LEFT JOIN LichTrinhChuyen xuo_ex ON xuo_ex.id_lich_chay = ${idLichChay} AND xuo_ex.id_ga = v.id_ga_xuong
         WHERE v.id_chuyen = ${parseInt(idChuyen)}
           AND v.so_toa_thu_tu = ${parseInt(soToaThuTu)}
           AND v.so_ghe_trong_toa IN (${gheListStr})
           AND v.trang_thai NOT IN ('da_huy','da_doi')
           AND (
             v.id_ga_len IS NULL OR v.id_ga_xuong IS NULL
             OR (len_ex.thu_tu_dung < ${thuTuDen} AND xuo_ex.thu_tu_dung > ${thuTuTu})
           )`,
        { type: sequelize.QueryTypes.SELECT }
      )
      return ok(res, { available: parseInt(veCheck?.cnt ?? 0) === 0 })
    }

    const idList = gheChuyenRows.map(g => g.id_ghe_chuyen).join(',')
    const excl = excludeSessionId ? `AND session_id <> '${excludeSessionId.replace(/'/g, "''")}'` : ''
    const [fallback] = await sequelize.query(
      `SELECT COUNT(*) AS cnt FROM GheChang
       WHERE id_ghe_chuyen IN (${idList})
         AND trang_thai IN ('dang_giu','da_dat')
         AND (thoi_gian_het_han IS NULL OR thoi_gian_het_han > DATEADD(HOUR,7,GETUTCDATE()))
         ${excl}`,
      { type: sequelize.QueryTypes.SELECT }
    )
    ok(res, { available: parseInt(fallback?.cnt ?? 0) === 0 })
  } catch (err) { next(err) }
})

router.post('/hold', async (req, res, next) => {
  try {
    const { idChuyen, soToaThuTu, soGheList, sessionId, idGaLen, idGaXuong } = req.body
    if (!idChuyen || !soToaThuTu || !soGheList?.length || !sessionId) return badRequest(res, 'Thiếu tham số')

    await TrainRepo.ensureGheChuyen(idChuyen)
    let thuTuTu = null, thuTuDen = null
    if (idGaLen && idGaXuong) {
      const idLichChay = await getLichChayId(idChuyen)
      thuTuTu = await getThuTu(idLichChay, idGaLen)
      thuTuDen = await getThuTu(idLichChay, idGaXuong)
    }
    const gheMap = await GheChangRepo.holdSeats(idChuyen, soToaThuTu, soGheList, sessionId, thuTuTu, thuTuDen)
    ok(res, { gheChuyenMap: gheMap, thuTuTu, thuTuDen })
  } catch (err) { next(err) }
})

router.post('/release', async (req, res, next) => {
  try {
    await GheChangRepo.releaseHoldBySession(req.body.sessionId)
    ok(res, null)
  } catch (err) { next(err) }
})

router.post('/link-ve', async (req, res, next) => {
  try {
    const { idChuyen, soToaThuTu, soGheTrongToa, idVe, idGaLen, idGaXuong, sessionId } = req.body
    let thuTuTu = null, thuTuDen = null
    if (idGaLen && idGaXuong) {
      const idLichChay = await getLichChayId(idChuyen)
      thuTuTu = await getThuTu(idLichChay, idGaLen)
      thuTuDen = await getThuTu(idLichChay, idGaXuong)
    }
    await GheChangRepo.linkVe({ idChuyen, soToaThuTu, soGheTrongToa, idVe, thuTuTu, thuTuDen, sessionId })
    ok(res, null)
  } catch (err) { next(err) }
})

router.post('/confirm', async (req, res, next) => {
  try {
    await GheChangRepo.confirmByVeIds(req.body.veIds)
    ok(res, null)
  } catch (err) { next(err) }
})

router.post('/free', async (req, res, next) => {
  try {
    await GheChangRepo.freeByVeId(req.body.idVe)
    ok(res, null)
  } catch (err) { next(err) }
})

module.exports = router
