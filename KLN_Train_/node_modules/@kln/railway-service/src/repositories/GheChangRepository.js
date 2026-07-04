const { sequelize } = require('../config/database')
const { GheChuyen, GheChang } = require('../models')

// Toàn bộ thao tác ghi lên GheChuyen/GheChang (tài nguyên vận hành) — được
// gọi qua /internal/seats/* bởi booking-service. Port từ
// DuAnTauHoaCom/backend/src/repositories/BookingRepository.js, tách phần
// "Booking không sửa GheChang" ra khỏi Booking sang đây.

const getGheChuyenIds = async (idChuyen, soToaThuTu, soGheList) => {
  const rows = await GheChuyen.findAll({
    where: {
      id_chuyen: idChuyen,
      so_toa_thu_tu: soToaThuTu,
      so_ghe_trong_toa: soGheList,
    },
    attributes: ['id_ghe_chuyen', 'so_ghe_trong_toa'],
  })
  return rows
}

// Overlap: thu_tu_tu_cũ < thuTuDen_mới AND thu_tu_den_cũ > thuTuTu_mới
const checkGheChangOverlap = async (gheChuyenIds, thuTuTu, thuTuDen, excludeSessionId = null) => {
  const ids = gheChuyenIds.map(g => (typeof g === 'object' ? g.id_ghe_chuyen : g))
  if (!ids.length) return 0

  const idList = ids.join(',')
  const excludeSQL = excludeSessionId
    ? `AND gc.session_id <> '${excludeSessionId.replace(/'/g, "''")}'`
    : ''

  const [row] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM GheChang gc
     WHERE gc.id_ghe_chuyen IN (${idList})
       AND gc.trang_thai IN ('dang_giu','da_dat')
       AND gc.thu_tu_tu < ${thuTuDen}
       AND gc.thu_tu_den > ${thuTuTu}
       AND (gc.thoi_gian_het_han IS NULL
            OR gc.thoi_gian_het_han > DATEADD(HOUR, 7, GETUTCDATE()))
       ${excludeSQL}`,
    { type: sequelize.QueryTypes.SELECT }
  )
  return parseInt(row?.cnt ?? 0)
}

// Giữ ghế: tạo/refresh GheChang(dang_giu) cho danh sách ghế của 1 session.
const holdSeats = async (idChuyen, soToaThuTu, soGheList, sessionId, thuTuTu = null, thuTuDen = null) => {
  const gheChuyenRows = await getGheChuyenIds(idChuyen, soToaThuTu, soGheList)
  const gheMap = Object.fromEntries(gheChuyenRows.map(g => [g.so_ghe_trong_toa, g.id_ghe_chuyen]))

  if (thuTuTu === null || thuTuDen === null) return gheMap

  await Promise.all(soGheList.map(async (soGhe) => {
    const idGheChuyen = gheMap[soGhe]
    if (!idGheChuyen) return
    await sequelize.query(
      `DELETE FROM GheChang WHERE id_ghe_chuyen=${parseInt(idGheChuyen)} AND session_id='${sessionId.replace(/'/g, "''")}'`
    )
    await sequelize.query(
      `INSERT INTO GheChang(id_ghe_chuyen,thu_tu_tu,thu_tu_den,trang_thai,session_id,thoi_gian_het_han)
       VALUES(${parseInt(idGheChuyen)},${thuTuTu},${thuTuDen},'dang_giu',
              '${sessionId.replace(/'/g, "''")}',
              DATEADD(MINUTE,15,DATEADD(HOUR,7,GETUTCDATE())))`
    )
  }))
  return gheMap
}

const releaseHoldBySession = async (sessionId) => {
  const sid = sessionId.replace(/'/g, "''")
  await sequelize.query(
    `UPDATE GheChang SET trang_thai='trong' WHERE session_id='${sid}' AND trang_thai='dang_giu'`
  )
}

// Gắn id_ve vào GheChang khi booking-service tạo Ve (giữ nguyên trang_thai='dang_giu').
const linkVe = async ({ idChuyen, soToaThuTu, soGheTrongToa, idVe, thuTuTu, thuTuDen, sessionId }) => {
  const gheChuyen = await GheChuyen.findOne({
    where: { id_chuyen: idChuyen, so_toa_thu_tu: soToaThuTu, so_ghe_trong_toa: soGheTrongToa },
  })
  if (!gheChuyen) return null
  if (thuTuTu === null || thuTuDen === null) return null

  const gcId = parseInt(gheChuyen.id_ghe_chuyen)
  const veId = parseInt(idVe)

  if (sessionId) {
    const sid = sessionId.replace(/'/g, "''")
    const [, count] = await sequelize.query(
      `UPDATE GheChang SET id_ve=${veId}
       WHERE id_ghe_chuyen=${gcId} AND session_id='${sid}' AND trang_thai='dang_giu'`
    )
    if (count > 0) return true
  }

  await sequelize.query(
    `INSERT INTO GheChang(id_ghe_chuyen,thu_tu_tu,thu_tu_den,trang_thai,id_ve,thoi_gian_het_han)
     VALUES(${gcId},${thuTuTu},${thuTuDen},'dang_giu',${veId},
            DATEADD(MINUTE,15,DATEADD(HOUR,7,GETUTCDATE())))`
  )
  return true
}

// Xác nhận GheChang sau khi thanh toán (chuyển da_dat) theo danh sách id_ve.
const confirmByVeIds = async (veIds) => {
  if (!veIds?.length) return
  const idList = veIds.map(Number).join(',')
  await sequelize.query(
    `UPDATE GheChang
     SET trang_thai='da_dat', thoi_gian_het_han=NULL, session_id=NULL
     WHERE trang_thai IN ('dang_giu', 'da_dat') AND id_ve IN (${idList})`
  )
}

// Giải phóng GheChang khi hủy vé.
const freeByVeId = async (idVe) => sequelize.query(
  `UPDATE GheChang SET trang_thai='trong', thoi_gian_het_han=NULL
   WHERE id_ve=${parseInt(idVe)} AND trang_thai IN ('dang_giu','da_dat')`
)

// Dọn GheChang hết hạn HOẶC unlinked (id_ve IS NULL) > 12 phút cho 1 nhóm ghế
// của 1 toa/chuyến — gọi bởi booking-service trước khi giữ/kiểm tra ghế.
const cleanupExpired = async (idChuyen, soToaThuTu, soGheList) => {
  const gheListStr = soGheList.map(Number).join(',')
  await sequelize.query(
    `UPDATE GheChang SET trang_thai='trong'
     WHERE trang_thai='dang_giu'
       AND id_ghe_chuyen IN (
           SELECT id_ghe_chuyen FROM GheChuyen
           WHERE id_chuyen=${parseInt(idChuyen)} AND so_toa_thu_tu=${parseInt(soToaThuTu)}
             AND so_ghe_trong_toa IN (${gheListStr})
       )
       AND (
         thoi_gian_het_han <= DATEADD(HOUR, 7, GETUTCDATE())
         OR (id_ve IS NULL AND thoi_gian_het_han <= DATEADD(MINUTE, 3, DATEADD(HOUR, 7, GETUTCDATE())))
       )`
  )
}

module.exports = {
  getGheChuyenIds, checkGheChangOverlap, holdSeats, releaseHoldBySession,
  linkVe, confirmByVeIds, freeByVeId, cleanupExpired,
}
