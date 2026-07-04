const { Op } = require('sequelize')
const { sequelize } = require('../config/database')
const {
  Tau, LichChay, ChuyenTau, GaTau,
  CauHinhToa, ToaChuyen, LoaiToa, LoaiGhe, CauHinhGhe,
  LichTrinhChuyen, GheChuyen,
} = require('../models')

// ─── Helper: lấy thu_tu_dung + offset_phut của một ga trong lịch chạy ───
const getStopInfo = async (idLichChay, idGa) => {
  const [row] = await sequelize.query(
    `SELECT thu_tu_dung, offset_phut, khoang_cach_km, gio_den, gio_di
     FROM LichTrinhChuyen WHERE id_lich_chay = :lc AND id_ga = :ga`,
    { replacements: { lc: idLichChay, ga: idGa }, type: sequelize.QueryTypes.SELECT }
  )
  return row || null
}

// ─── Helper: lấy id_loai_toa của toa trong chuyến (ưu tiên ToaChuyen, fallback CauHinhToa) ───
const getLoaiToaChuyen = async (idChuyen, idTau, soToaThuTu) => {
  const tc = await ToaChuyen.findOne({
    where: { id_chuyen: idChuyen, so_toa_thu_tu: soToaThuTu },
    attributes: ['id_loai_toa', 'so_ghe_toi_da'],
  })
  if (tc) return { id_loai_toa: tc.id_loai_toa, so_ghe_toi_da: tc.so_ghe_toi_da }

  const cht = await CauHinhToa.findOne({
    where: { id_tau: idTau, so_toa_thu_tu: soToaThuTu },
    include: [{ model: LoaiToa, attributes: ['id_loai_toa', 'so_cho_toi_da'] }],
  })
  if (!cht) return null
  return { id_loai_toa: cht.id_loai_toa, so_ghe_toi_da: cht.LoaiToa?.so_cho_toi_da }
}

// ─── Đảm bảo GheChuyen đã được populate cho chuyến ──────────────────
// (chuyển từ Booking sang đây vì GheChuyen/GheChang là tài nguyên vận hành
// thuộc Railway Operation Service — Booking chỉ hỏi "ghế còn không?")
const ensureGheChuyen = async (idChuyen) => {
  try {
    await sequelize.query('EXEC sp_EnsureGheChuyen :id', { replacements: { id: idChuyen } })
  } catch {
    const count = await GheChuyen.count({ where: { id_chuyen: idChuyen } })
    if (count > 0) return

    const chuyen = await ChuyenTau.findByPk(idChuyen, {
      include: [{ model: LichChay, attributes: ['id_tau'] }],
    })
    if (!chuyen) return
    const idTau = chuyen.LichChay.id_tau

    const toaList = await (async () => {
      const tc = await ToaChuyen.findAll({ where: { id_chuyen: idChuyen } })
      if (tc.length > 0) return tc.map(t => ({ so_toa_thu_tu: t.so_toa_thu_tu, id_loai_toa: t.id_loai_toa }))
      const cht = await CauHinhToa.findAll({ where: { id_tau: idTau } })
      return cht.map(c => ({ so_toa_thu_tu: c.so_toa_thu_tu, id_loai_toa: c.id_loai_toa }))
    })()

    for (const toa of toaList) {
      const ghes = await CauHinhGhe.findAll({ where: { id_loai_toa: toa.id_loai_toa } })
      const records = ghes.map(g => ({
        id_chuyen: idChuyen, so_toa_thu_tu: toa.so_toa_thu_tu,
        so_ghe_trong_toa: g.so_ghe_trong_toa, id_loai_ghe: g.id_loai_ghe,
      }))
      if (records.length) await GheChuyen.bulkCreate(records, { ignoreDuplicates: true })
    }
  }
}

// ─── Tìm chuyến tàu qua LichTrinhChuyen (hỗ trợ ga trung gian) ──────────
const searchChuyen = async (idGaDi, idGaDen, ngayChay) => {
  const lichChayList = await sequelize.query(
    `SELECT DISTINCT lc.id_lich_chay
     FROM LichChay lc
     WHERE
       EXISTS (
           SELECT 1 FROM LichTrinhChuyen ltc_di
           JOIN  LichTrinhChuyen ltc_den
             ON  ltc_den.id_lich_chay = lc.id_lich_chay AND ltc_den.id_ga = :idGaDen
           WHERE ltc_di.id_lich_chay = lc.id_lich_chay AND ltc_di.id_ga = :idGaDi
             AND ltc_di.thu_tu_dung < ltc_den.thu_tu_dung
       )
       OR
       (
           NOT EXISTS (SELECT 1 FROM LichTrinhChuyen WHERE id_lich_chay = lc.id_lich_chay)
           AND lc.id_ga_di  = :idGaDi
           AND lc.id_ga_den = :idGaDen
       )`,
    { replacements: { idGaDi, idGaDen }, type: sequelize.QueryTypes.SELECT }
  )
  if (!lichChayList.length) return []
  const ids = lichChayList.map(r => r.id_lich_chay)

  return ChuyenTau.findAll({
    where: {
      ngay_chay: ngayChay,
      trang_thai: { [Op.notIn]: ['huy'] },
    },
    include: [
      {
        model: LichChay,
        required: true,
        where: { id_lich_chay: { [Op.in]: ids } },
        include: [
          { model: Tau, attributes: ['id_tau', 'so_hieu', 'ten_tau', 'so_toa'] },
          { model: GaTau, as: 'GaDi', attributes: ['id_ga', 'ten_ga', 'ma_ga_viet_tat'] },
          { model: GaTau, as: 'GaDen', attributes: ['id_ga', 'ten_ga', 'ma_ga_viet_tat'] },
        ],
      },
    ],
    order: [[LichChay, 'gio_khoi_hanh', 'ASC']],
  })
}

// ─── Danh sách toa của chuyến (ưu tiên ToaChuyen runtime) ────────────────
const getCoachesByChuyen = async (idChuyen) => {
  const chuyen = await ChuyenTau.findByPk(idChuyen, {
    include: [{ model: LichChay, include: [{ model: Tau }] }],
  })
  if (!chuyen) return []

  const idTau = chuyen.LichChay.Tau.id_tau

  const toaChuyens = await ToaChuyen.findAll({
    where: { id_chuyen: idChuyen },
    include: [{ model: LoaiToa, include: [{ model: LoaiGhe, where: { trang_thai: 'dang_ban' }, required: false }] }],
    order: [['so_toa_thu_tu', 'ASC']],
  })
  if (toaChuyens.length > 0) return toaChuyens

  return CauHinhToa.findAll({
    where: { id_tau: idTau },
    include: [{ model: LoaiToa, include: [{ model: LoaiGhe, where: { trang_thai: 'dang_ban' }, required: false }] }],
    order: [['so_toa_thu_tu', 'ASC']],
  })
}

// ─── Sơ đồ ghế với segment-aware availability ────────────────────────────
const getSeatMap = async (idChuyen, soToaThuTu, idGaLen = null, idGaXuong = null) => {
  const chuyen = await ChuyenTau.findByPk(idChuyen, {
    include: [{ model: LichChay, attributes: ['id_lich_chay', 'gio_khoi_hanh', 'id_tau'] }],
  })
  if (!chuyen) return null

  const idLichChay = chuyen.LichChay.id_lich_chay
  const idTau = chuyen.LichChay.id_tau

  const toaInfo = await getLoaiToaChuyen(idChuyen, idTau, soToaThuTu)
  if (!toaInfo) return null

  let cauHinhGhe = await CauHinhGhe.findAll({
    where: { id_loai_toa: toaInfo.id_loai_toa },
    include: [{ model: LoaiGhe }],
    order: [['so_ghe_trong_toa', 'ASC']],
  })

  if (cauHinhGhe.length === 0 && (toaInfo.so_ghe_toi_da || 0) > 0) {
    const maxGhe = toaInfo.so_ghe_toi_da
    const loaiGheDefault = await LoaiGhe.findOne({ where: { id_loai_toa: toaInfo.id_loai_toa } })
    cauHinhGhe = Array.from({ length: maxGhe }, (_, i) => ({
      so_ghe_trong_toa: i + 1,
      id_loai_toa: toaInfo.id_loai_toa,
      vi_tri: null,
      tang: null,
      khoang_so: Math.ceil((i + 1) / 4),
      ben: ['A', 'B', 'C', 'D'][i % 4],
      LoaiGhe: loaiGheDefault || null,
    }))
  }

  let soldSet = new Set()
  let heldSet = new Set()

  const gheChuyenList = await GheChuyen.findAll({
    where: { id_chuyen: idChuyen, so_toa_thu_tu: soToaThuTu },
    attributes: ['id_ghe_chuyen', 'so_ghe_trong_toa'],
  })
  const gheIds = gheChuyenList.map(g => g.id_ghe_chuyen)

  if (gheIds.length > 0) {
    let thuTuTu = null, thuTuDen = null
    if (idGaLen && idGaXuong) {
      const stopLen = await getStopInfo(idLichChay, idGaLen)
      const stopXuo = await getStopInfo(idLichChay, idGaXuong)
      if (stopLen && stopXuo) {
        thuTuTu = stopLen.thu_tu_dung
        thuTuDen = stopXuo.thu_tu_dung
      }
    }

    const gheIdList = gheIds.join(',')

    if (thuTuTu !== null && thuTuDen !== null) {
      const [veSold, gheHeld] = await Promise.all([
        sequelize.query(
          `SELECT v.so_ghe_trong_toa
           FROM Ve v
           LEFT JOIN LichTrinhChuyen len_ex
             ON len_ex.id_lich_chay = ${idLichChay} AND len_ex.id_ga = v.id_ga_len
           LEFT JOIN LichTrinhChuyen xuo_ex
             ON xuo_ex.id_lich_chay = ${idLichChay} AND xuo_ex.id_ga = v.id_ga_xuong
           WHERE v.id_chuyen = ${idChuyen}
             AND v.so_toa_thu_tu = ${soToaThuTu}
             AND v.trang_thai NOT IN ('da_huy','da_doi','cho_xac_nhan')
             AND (
               v.id_ga_len IS NULL OR v.id_ga_xuong IS NULL
               OR (len_ex.thu_tu_dung < ${thuTuDen} AND xuo_ex.thu_tu_dung > ${thuTuTu})
             )`,
          { type: sequelize.QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT gc.so_ghe_trong_toa
           FROM GheChang gch
           JOIN GheChuyen gc ON gc.id_ghe_chuyen = gch.id_ghe_chuyen
           WHERE gc.id_ghe_chuyen IN (${gheIdList})
             AND gch.trang_thai = 'dang_giu'
             AND gch.thu_tu_tu < ${thuTuDen}
             AND gch.thu_tu_den > ${thuTuTu}
             AND gch.thoi_gian_het_han > DATEADD(HOUR,7,GETUTCDATE())`,
          { type: sequelize.QueryTypes.SELECT }
        ),
      ])
      veSold.forEach(r => soldSet.add(r.so_ghe_trong_toa))
      gheHeld.forEach(r => { if (!soldSet.has(r.so_ghe_trong_toa)) heldSet.add(r.so_ghe_trong_toa) })
    } else {
      const [veSold, veHeld] = await Promise.all([
        sequelize.query(
          `SELECT v.so_ghe_trong_toa FROM Ve v
           WHERE v.id_chuyen = ${idChuyen}
             AND v.so_toa_thu_tu = ${soToaThuTu}
             AND v.trang_thai NOT IN ('da_huy','da_doi','cho_xac_nhan')`,
          { type: sequelize.QueryTypes.SELECT }
        ),
        sequelize.query(
          `SELECT v.so_ghe_trong_toa FROM Ve v
           WHERE v.id_chuyen = ${idChuyen}
             AND v.so_toa_thu_tu = ${soToaThuTu}
             AND v.trang_thai = 'cho_xac_nhan'`,
          { type: sequelize.QueryTypes.SELECT }
        ),
      ])
      veSold.forEach(r => soldSet.add(r.so_ghe_trong_toa))
      veHeld.forEach(r => { if (!soldSet.has(r.so_ghe_trong_toa)) heldSet.add(r.so_ghe_trong_toa) })
    }
  }

  return {
    loaiToa: { id_loai_toa: toaInfo.id_loai_toa, so_cho_toi_da: toaInfo.so_ghe_toi_da },
    soToaThuTu,
    seats: cauHinhGhe.map(g => ({
      soGhe: g.so_ghe_trong_toa,
      loaiGhe: g.LoaiGhe,
      viTri: g.vi_tri,
      tang: g.tang,
      khoangSo: g.khoang_so,
      ben: g.ben,
      trangThai: soldSet.has(g.so_ghe_trong_toa) ? 'sold'
        : heldSet.has(g.so_ghe_trong_toa) ? 'held'
        : 'empty',
    })),
  }
}

// ─── Lấy thông tin lịch trình (dừng dọc đường) ────────────────────────
const getLichTrinh = async (idLichChay) =>
  LichTrinhChuyen.findAll({
    where: { id_lich_chay: idLichChay },
    include: [{ model: GaTau }],
    order: [['thu_tu_dung', 'ASC']],
  })

// ─── Danh sách ga đang hoạt động ─────────────────────────────────────
const getAllGa = async () =>
  GaTau.findAll({
    where: { trang_thai: 'hoat_dong' },
    order: [['do_uu_tien', 'DESC']],
  })

module.exports = {
  searchChuyen, getCoachesByChuyen, getSeatMap, getLichTrinh, getAllGa,
  getStopInfo, ensureGheChuyen,
}
