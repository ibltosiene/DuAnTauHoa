const { Op } = require('sequelize')
const { sequelize } = require('../config/database')
const TrainRepo = require('../repositories/TrainRepository')
const {
  BieuGia, GaTau, LichChay, ChuyenTau, Tau,
  CauHinhToa, LoaiToa, LoaiGhe,
} = require('../models')

// ─── Tính giá vé theo km + biểu giá + hệ số ghế ─────────────────────
const tinhGiaVe = async (idLichChay, ngayChay, idGaLen, idGaXuong, idLoaiGhe, hesoGhe) => {
  const stopLen = await TrainRepo.getStopInfo(idLichChay, idGaLen)
  const stopXuo = await TrainRepo.getStopInfo(idLichChay, idGaXuong)

  let km
  if (stopLen && stopXuo) {
    km = Math.abs(parseFloat(stopXuo.khoang_cach_km) - parseFloat(stopLen.khoang_cach_km))
  } else {
    const [gaLen] = await sequelize.query('SELECT thu_tu_tuyen FROM GaTau WHERE id_ga = :ga', { replacements: { ga: idGaLen }, type: sequelize.QueryTypes.SELECT })
    const [gaXuong] = await sequelize.query('SELECT thu_tu_tuyen FROM GaTau WHERE id_ga = :ga', { replacements: { ga: idGaXuong }, type: sequelize.QueryTypes.SELECT })
    if (!gaLen || !gaXuong) return null
    km = Math.round(Math.abs((gaXuong.thu_tu_tuyen - gaLen.thu_tu_tuyen) * (1726 / 84)))
  }
  if (!km || km <= 0) return null

  const [bieuGia] = await BieuGia.findAll({
    where: {
      trang_thai: 'dang_ap_dung',
      ngay_bat_dau: { [Op.lte]: ngayChay },
      ngay_ket_thuc: { [Op.gte]: ngayChay },
      [Op.or]: [{ id_loai_ghe: null }, { id_loai_ghe: idLoaiGhe }],
    },
    order: [['he_so_tang', 'DESC']],
    limit: 1,
  })
  const donGia = bieuGia ? parseFloat(bieuGia.don_gia_km_goc) : 264
  const hesoTang = bieuGia ? parseFloat(bieuGia.he_so_tang) : 1
  const heso = hesoGhe ? parseFloat(hesoGhe) : 1

  return Math.ceil((km * donGia * hesoTang * heso) / 1000) * 1000
}

// ─── Lấy thông tin delay từ LichTrinhThucTe cho một chuyến ──────────
const getDelayInfo = async (idChuyen) => {
  try {
    const rows = await sequelize.query(
      `SELECT id_ga, delay_den_phut, delay_di_phut, trang_thai
       FROM LichTrinhThucTe
       WHERE id_chuyen = :idChuyen AND trang_thai = 'delay'`,
      { replacements: { idChuyen }, type: sequelize.QueryTypes.SELECT }
    )
    return Object.fromEntries(rows.map(r => [r.id_ga, r]))
  } catch {
    return {}
  }
}

// ─── Tính thời gian thực tế (có offset) ──────────────────────────────
const parseTimeHHMM = (t) => {
  if (!t) return '00:00'
  if (t instanceof Date) {
    const h = String(t.getUTCHours()).padStart(2, '0')
    const m = String(t.getUTCMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  const s = String(t)
  const iso = s.match(/T(\d{2}):(\d{2})/)
  if (iso) return `${iso[1]}:${iso[2]}`
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
  return '00:00'
}

const calcActualTime = async (idLichChay, ngayChay, idGaDi, idGaDen, gioKhoiHanh) => {
  try {
    const stopDi = await TrainRepo.getStopInfo(idLichChay, idGaDi)
    const stopDen = await TrainRepo.getStopInfo(idLichChay, idGaDen)

    const gioStr = parseTimeHHMM(gioKhoiHanh)
    const ngayStr = typeof ngayChay === 'string'
      ? ngayChay.slice(0, 10)
      : new Date(ngayChay).toISOString().slice(0, 10)
    const baseDt = new Date(`${ngayStr}T${gioStr}:00+07:00`).getTime()

    const offsetDi = stopDi?.offset_phut ?? 0
    const offsetDen = stopDen?.offset_phut ?? null

    const departureMs = baseDt + offsetDi * 60000
    const arrivalMs = offsetDen !== null ? baseDt + offsetDen * 60000 : null

    return {
      departureMs,
      arrivalMs,
      departDate: new Date(departureMs).toISOString(),
      arrivalDate: arrivalMs ? new Date(arrivalMs).toISOString() : null,
      durationPhut: offsetDen !== null ? (offsetDen - offsetDi) : null,
    }
  } catch {
    return null
  }
}

// ─── Tìm ga linh hoạt ────────────────────────────────────────────────
const findGa = async (ten) => {
  if (!ten) return null
  const exact = await GaTau.findOne({ where: { ten_ga: ten, trang_thai: 'hoat_dong' } })
  if (exact) return exact
  const withGa = await GaTau.findOne({ where: { ten_ga: `Ga ${ten}`, trang_thai: 'hoat_dong' } })
  if (withGa) return withGa
  return GaTau.findOne({ where: { tinh_thanh: { [Op.like]: `%${ten}%` }, trang_thai: 'hoat_dong' } })
}

// ─── Tìm kiếm chuyến tàu ─────────────────────────────────────────────
const searchTrains = async (tenGaDi, tenGaDen, ngayChay) => {
  const [gaDi, gaDen] = await Promise.all([findGa(tenGaDi), findGa(tenGaDen)])
  if (!gaDi || !gaDen) throw { status: 404, message: 'Không tìm thấy ga tàu' }

  const chuyens = await TrainRepo.searchChuyen(gaDi.id_ga, gaDen.id_ga, ngayChay)

  const results = await Promise.all(chuyens.map(async (ct) => {
    const lc = ct.LichChay
    const tau = lc.Tau
    const idLichChay = lc.id_lich_chay

    const coaches = await TrainRepo.getCoachesByChuyen(ct.id_chuyen)

    const loaiGheMap = {}
    for (const c of coaches) {
      for (const lg of (c.LoaiToa?.LoaiGhes || [])) {
        if (!loaiGheMap[lg.id_loai_ghe]) loaiGheMap[lg.id_loai_ghe] = lg
      }
    }

    let priceFrom = null
    if (Object.keys(loaiGheMap).length > 0) {
      const prices = await Promise.all(
        Object.values(loaiGheMap).map(lg =>
          tinhGiaVe(idLichChay, ct.ngay_chay, gaDi.id_ga, gaDen.id_ga, lg.id_loai_ghe, parseFloat(lg.he_so_gia) || 1)
        )
      )
      const validPrices = prices.filter(p => p > 0)
      if (validPrices.length > 0) priceFrom = Math.min(...validPrices)
    } else if (coaches.length > 0) {
      priceFrom = await tinhGiaVe(idLichChay, ct.ngay_chay, gaDi.id_ga, gaDen.id_ga, null, 1.0)
    }

    const timing = await calcActualTime(idLichChay, ct.ngay_chay, gaDi.id_ga, gaDen.id_ga, lc.gio_khoi_hanh)

    const delayMap = await getDelayInfo(ct.id_chuyen)
    const delayDi = delayMap[gaDi.id_ga] || null
    const delayDen = delayMap[gaDen.id_ga] || null
    const delayDiPhut = delayDi?.delay_di_phut || 0
    const delayDenPhut = delayDen?.delay_den_phut || 0
    const isDelayed = delayDiPhut > 0 || delayDenPhut > 0

    let departureISO = timing?.departDate || null
    let arrivalISO = timing?.arrivalDate || null
    let durationPhut = timing?.durationPhut ?? null
    if (isDelayed) {
      if (delayDiPhut > 0 && timing?.departureMs)
        departureISO = new Date(timing.departureMs + delayDiPhut * 60_000).toISOString()
      if (delayDenPhut > 0 && timing?.arrivalMs)
        arrivalISO = new Date(timing.arrivalMs + delayDenPhut * 60_000).toISOString()
      if (durationPhut !== null)
        durationPhut = durationPhut + (delayDenPhut - delayDiPhut)
    }

    await TrainRepo.ensureGheChuyen(ct.id_chuyen)

    const [stopDi, stopDen] = await Promise.all([
      TrainRepo.getStopInfo(idLichChay, gaDi.id_ga),
      TrainRepo.getStopInfo(idLichChay, gaDen.id_ga),
    ])
    const thuTuDi = stopDi?.thu_tu_dung ?? null
    const thuTuDen = stopDen?.thu_tu_dung ?? null

    const idChuyen = ct.id_chuyen

    const totalSeatsRows = await sequelize.query(
      `SELECT gc.so_toa_thu_tu, COUNT(gc.id_ghe_chuyen) AS total
       FROM GheChuyen gc
       WHERE gc.id_chuyen = ${idChuyen}
       GROUP BY gc.so_toa_thu_tu`,
      { type: sequelize.QueryTypes.SELECT }
    )
    const totalMap = Object.fromEntries(totalSeatsRows.map(r => [r.so_toa_thu_tu, parseInt(r.total) || 0]))

    let occupiedMap = {}
    const ic = parseInt(idChuyen)

    if (thuTuDi !== null && thuTuDen !== null) {
      const rows = await sequelize.query(
        `SELECT so_toa_thu_tu, COUNT(*) AS cnt
         FROM (
           SELECT DISTINCT v.so_toa_thu_tu, v.so_ghe_trong_toa
           FROM Ve v
           JOIN LichTrinhChuyen len_ex
             ON len_ex.id_lich_chay = ${idLichChay} AND len_ex.id_ga = v.id_ga_len
           JOIN LichTrinhChuyen xuo_ex
             ON xuo_ex.id_lich_chay = ${idLichChay} AND xuo_ex.id_ga = v.id_ga_xuong
           WHERE v.id_chuyen = ${ic}
             AND v.trang_thai NOT IN ('da_huy','da_doi')
             AND len_ex.thu_tu_dung < ${thuTuDen} AND xuo_ex.thu_tu_dung > ${thuTuDi}

           UNION

           SELECT DISTINCT gc.so_toa_thu_tu, gc.so_ghe_trong_toa
           FROM GheChang gch
           JOIN GheChuyen gc ON gc.id_ghe_chuyen = gch.id_ghe_chuyen
           WHERE gc.id_chuyen = ${ic}
             AND gch.trang_thai = 'dang_giu'
             AND gch.id_ve IS NULL
             AND gch.thu_tu_tu < ${thuTuDen}
             AND gch.thu_tu_den > ${thuTuDi}
             AND gch.thoi_gian_het_han > DATEADD(HOUR,7,GETUTCDATE())
         ) t
         GROUP BY so_toa_thu_tu`,
        { type: sequelize.QueryTypes.SELECT }
      ).catch(() => [])
      occupiedMap = Object.fromEntries(rows.map(r => [r.so_toa_thu_tu, parseInt(r.cnt) || 0]))
    } else {
      const rows = await sequelize.query(
        `SELECT so_toa_thu_tu, COUNT(*) AS cnt
         FROM (
           SELECT DISTINCT v.so_toa_thu_tu, v.so_ghe_trong_toa
           FROM Ve v
           WHERE v.id_chuyen = ${ic}
             AND v.trang_thai NOT IN ('da_huy','da_doi')

           UNION

           SELECT DISTINCT gc.so_toa_thu_tu, gc.so_ghe_trong_toa
           FROM GheChang gch
           JOIN GheChuyen gc ON gc.id_ghe_chuyen = gch.id_ghe_chuyen
           WHERE gc.id_chuyen = ${ic}
             AND gch.trang_thai = 'dang_giu'
             AND gch.id_ve IS NULL
             AND gch.thoi_gian_het_han > DATEADD(HOUR,7,GETUTCDATE())
         ) t
         GROUP BY so_toa_thu_tu`,
        { type: sequelize.QueryTypes.SELECT }
      ).catch(() => [])
      occupiedMap = Object.fromEntries(rows.map(r => [r.so_toa_thu_tu, parseInt(r.cnt) || 0]))
    }

    const mappedCoaches = coaches.map(c => {
      const soToa = c.so_toa_thu_tu
      const maxSeats = totalMap[soToa] || c.LoaiToa?.so_cho_toi_da || c.so_ghe_toi_da || 0
      const occupied = occupiedMap[soToa] || 0
      return {
        soToa,
        idLoaiToa: c.id_loai_toa,
        tenLoaiToa: c.LoaiToa?.ten_loai_toa || '',
        maLoaiToa: c.LoaiToa?.ma_loai_toa || '',
        soChoToiDa: maxSeats,
        soChoTrong: Math.max(0, maxSeats - occupied),
      }
    })

    const availableSeats = mappedCoaches.reduce((s, c) => s + c.soChoTrong, 0)

    return {
      idChuyen: ct.id_chuyen,
      idLichChay,
      maTau: tau.so_hieu,
      tenTau: tau.ten_tau,
      loaiTau: tau.ten_tau?.includes('Tốc Hành') ? 'Tàu Tốc Hành' : 'Tàu Liên Tỉnh',
      gaDi: { id: gaDi.id_ga, ten: gaDi.ten_ga },
      gaDen: { id: gaDen.id_ga, ten: gaDen.ten_ga },
      gioKhoiHanh: lc.gio_khoi_hanh,
      gioDuKienDen: lc.gio_du_kien_den,
      ngayChay: ct.ngay_chay,
      trangThai: ct.trang_thai,
      daDiQua: ct.trang_thai === 'da_chay' || (() => {
        if (!timing?.departureMs) return false
        return timing.departureMs < Date.now()
      })(),
      departureISO,
      arrivalISO,
      durationPhut,
      isDelayed,
      delayPhut: delayDiPhut,
      delayDenPhut,
      priceFrom,
      soToa: coaches.length,
      availableSeats,
      coaches: mappedCoaches,
    }
  }))

  return results
}

// ─── Lấy sơ đồ ghế (segment-aware) ──────────────────────────────────
const getSeatMap = async (idChuyen, soToaThuTu, idGaLen = null, idGaXuong = null) => {
  const result = await TrainRepo.getSeatMap(idChuyen, soToaThuTu, idGaLen, idGaXuong)
  if (!result) throw { status: 404, message: 'Không tìm thấy toa tàu' }

  if (!idGaLen || !idGaXuong) return result

  const chuyen = await ChuyenTau.findByPk(idChuyen, {
    include: [{ model: LichChay, attributes: ['id_lich_chay', 'gio_khoi_hanh'] }],
  })
  if (!chuyen?.LichChay) return result

  const idLichChay = chuyen.LichChay.id_lich_chay
  const ngayChay = chuyen.ngay_chay

  const priceCache = {}
  const seatsWithPrice = await Promise.all(result.seats.map(async (seat) => {
    const idLoaiGhe = seat.loaiGhe?.id_loai_ghe ?? null
    const hesoGhe = parseFloat(seat.loaiGhe?.he_so_gia) || 1
    const cacheKey = `${idLoaiGhe}_${hesoGhe}`
    if (!(cacheKey in priceCache)) {
      priceCache[cacheKey] = await tinhGiaVe(idLichChay, ngayChay, idGaLen, idGaXuong, idLoaiGhe, hesoGhe)
    }
    return { ...seat, gia: priceCache[cacheKey] }
  }))

  return { ...result, seats: seatsWithPrice }
}

const getAllStations = async () => TrainRepo.getAllGa()

const getSchedule = async () =>
  LichChay.findAll({
    include: [
      { model: Tau, attributes: ['so_hieu', 'ten_tau'] },
      { model: GaTau, as: 'GaDi', attributes: ['ten_ga', 'ma_ga_viet_tat'] },
      { model: GaTau, as: 'GaDen', attributes: ['ten_ga', 'ma_ga_viet_tat'] },
    ],
    order: [['gio_khoi_hanh', 'ASC']],
  })

// ─── Chi tiết lịch chạy: điểm dừng + bảng giá ────────────────────────
const getTrainRouteDetail = async (idLichChay, idGaLen, idGaXuong, ngayChay) => {
  const lichChay = await LichChay.findByPk(idLichChay, {
    include: [
      {
        model: Tau,
        include: [{
          model: CauHinhToa,
          include: [{ model: LoaiToa, include: [{ model: LoaiGhe, where: { trang_thai: 'dang_ban' }, required: false }] }],
        }],
      },
      { model: GaTau, as: 'GaDi', attributes: ['id_ga', 'ten_ga'] },
      { model: GaTau, as: 'GaDen', attributes: ['id_ga', 'ten_ga'] },
    ],
  })
  if (!lichChay) throw { status: 404, message: 'Không tìm thấy lịch chạy' }

  const stops = await TrainRepo.getLichTrinh(idLichChay)
  const loaiGheMap = {}
  for (const cauHinhToa of (lichChay.Tau?.CauHinhToas || [])) {
    for (const lg of (cauHinhToa.LoaiToa?.LoaiGhes || [])) {
      if (!loaiGheMap[lg.id_loai_ghe]) loaiGheMap[lg.id_loai_ghe] = lg
    }
  }

  let priceRows = []
  if (idGaLen && idGaXuong && ngayChay) {
    const rawPrices = await Promise.all(
      Object.values(loaiGheMap).map(async (lg) => ({
        ma: lg.ma_loai_ghe,
        ten: lg.ten_loai_ghe,
        gia: await tinhGiaVe(idLichChay, ngayChay, idGaLen, idGaXuong, lg.id_loai_ghe, parseFloat(lg.he_so_gia) || 1),
      }))
    )
    priceRows = rawPrices.filter(p => p.gia > 0).map((p, idx) => ({ stt: idx + 1, ...p }))
  }

  let timing = null
  if (idGaLen && idGaXuong && ngayChay) {
    timing = await calcActualTime(idLichChay, ngayChay, idGaLen, idGaXuong, lichChay.gio_khoi_hanh)
  }

  let delayMap = {}
  if (ngayChay) {
    try {
      const [chuyenRow] = await sequelize.query(
        `SELECT id_chuyen FROM ChuyenTau WHERE id_lich_chay = :lc AND CAST(ngay_chay AS DATE) = CAST(:ngay AS DATE)`,
        { replacements: { lc: idLichChay, ngay: ngayChay }, type: sequelize.QueryTypes.SELECT }
      )
      if (chuyenRow?.id_chuyen) delayMap = await getDelayInfo(chuyenRow.id_chuyen)
    } catch { /* ignore */ }
  }

  const isDelayed = Object.values(delayMap).some(d => (d.delay_di_phut || 0) > 0 || (d.delay_den_phut || 0) > 0)
  const delayDiPhut = idGaLen ? (delayMap[idGaLen]?.delay_di_phut || 0) : 0
  const delayDenPhut = idGaXuong ? (delayMap[idGaXuong]?.delay_den_phut || 0) : 0

  let departureISO = timing?.departDate || null
  let arrivalISO = timing?.arrivalDate || null
  let durationPhut = timing?.durationPhut ?? null
  if (isDelayed) {
    if (delayDiPhut > 0 && timing?.departureMs)
      departureISO = new Date(timing.departureMs + delayDiPhut * 60_000).toISOString()
    if (delayDenPhut > 0 && timing?.arrivalMs)
      arrivalISO = new Date(timing.arrivalMs + delayDenPhut * 60_000).toISOString()
    if (durationPhut !== null)
      durationPhut = durationPhut + (delayDenPhut - delayDiPhut)
  }

  return {
    idLichChay,
    maTau: lichChay.Tau?.so_hieu,
    tenTau: lichChay.Tau?.ten_tau,
    gaDi: lichChay.GaDi?.ten_ga,
    gaDen: lichChay.GaDen?.ten_ga,
    gioKhoiHanh: lichChay.gio_khoi_hanh,
    gioDuKienDen: lichChay.gio_du_kien_den,
    departureISO,
    arrivalISO,
    durationPhut,
    isDelayed,
    delayPhut: delayDiPhut,
    delayDenPhut,
    stops: stops.map((s, idx) => {
      const d = delayMap[s.GaTau?.id_ga] || null
      return {
        stt: idx + 1,
        idGa: s.GaTau?.id_ga,
        tenGa: s.GaTau?.ten_ga,
        km: parseFloat(s.khoang_cach_km),
        offsetPhut: s.offset_phut,
        gioDen: s.gio_den,
        gioDi: s.gio_di,
        delayDenPhut: d?.delay_den_phut || 0,
        delayDiPhut: d?.delay_di_phut || 0,
        isDelayed: !!(d && ((d.delay_den_phut || 0) > 0 || (d.delay_di_phut || 0) > 0)),
      }
    }),
    prices: priceRows,
  }
}

// ─── Top N hành trình phổ biến ────────────────────────────────────────
const getPopularRoutes = async (limit = 10) => {
  const rows = await sequelize.query(`
    SELECT TOP ${parseInt(limit)}
      v.id_ga_len, v.id_ga_xuong,
      gl.ten_ga AS ga_di, gx.ten_ga AS ga_den,
      COUNT(v.id_ve) AS so_luot_dat,
      MIN(CAST(v.gia_ve AS FLOAT)) AS gia_min
    FROM Ve v
    JOIN GaTau gl ON gl.id_ga = v.id_ga_len
    JOIN GaTau gx ON gx.id_ga = v.id_ga_xuong
    WHERE v.trang_thai IN ('da_xac_nhan','da_doi','da_su_dung')
    GROUP BY v.id_ga_len, v.id_ga_xuong, gl.ten_ga, gx.ten_ga
    ORDER BY COUNT(v.id_ve) DESC
  `, { type: sequelize.QueryTypes.SELECT })

  return rows.map((r, idx) => ({
    rank: idx + 1,
    idGaLen: r.id_ga_len,
    idGaDen: r.id_ga_xuong,
    gaDi: r.ga_di,
    gaDen: r.ga_den,
    soLuotDat: parseInt(r.so_luot_dat || 0),
    giaMin: parseFloat(r.gia_min || 0),
  }))
}

module.exports = {
  searchTrains, getSeatMap, getAllStations, getSchedule,
  getTrainRouteDetail, tinhGiaVe, getPopularRoutes, calcActualTime,
}
