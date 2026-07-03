const DieuPhoiRepo = require('../repositories/DieuPhoiRepository')
const { vnDate, fmtDateVN, fmtTimeVN, timeToMinutes, calcDelayedTime } = require('../utils/dateUtils')

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getDashboard = async () => {
  const today = vnDate(0)
  const tomorrow = vnDate(1)

  const [todayTrips, tomorrowCount, recentEventsRaw] = await Promise.all([
    DieuPhoiRepo.getChuyenTauByNgay(today),
    DieuPhoiRepo.demChuyenTheoNgay(tomorrow),
    DieuPhoiRepo.getSuKienGanDay(24, 10),
  ])

  const byStatus = {}
  todayTrips.forEach(c => { byStatus[c.trang_thai] = (byStatus[c.trang_thai] || 0) + 1 })

  const parseHHMM = (t) => {
    if (!t) return '--:--'
    if (t instanceof Date) return String(t.getUTCHours()).padStart(2, '0') + ':' + String(t.getUTCMinutes()).padStart(2, '0')
    const s = String(t)
    const m = s.match(/T(\d{2}):(\d{2})/)
    if (m) return `${m[1]}:${m[2]}`
    if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
    return '--:--'
  }

  return {
    today: {
      total: todayTrips.length,
      byStatus,
      trips: todayTrips.map(c => ({
        idChuyen: c.id_chuyen,
        maTau: c.LichChay?.Tau?.so_hieu,
        tenTau: c.LichChay?.Tau?.ten_tau,
        gaDi: c.LichChay?.GaDi?.ten_ga,
        gaDen: c.LichChay?.GaDen?.ten_ga,
        gioKhoiHanh: parseHHMM(c.LichChay?.gio_khoi_hanh),
        trangThai: c.trang_thai,
        ghiChu: c.ghi_chu,
      })),
    },
    tomorrowCount,
    recentEvents: recentEventsRaw.map(e => ({
      id: e.id_dieu_phoi,
      idChuyen: e.id_chuyen,
      maTau: e.ma_tau,
      loaiSuKien: e.loai_su_kien,
      moTa: e.mo_ta,
      delayPhut: e.delay_phut,
      gaAnhHuong: e.ga_anh_huong,
      thoiGian: e.thoi_gian_tao,
    })),
  }
}

// ─── Danh sách chuyến ─────────────────────────────────────────────────────────

const getChuyenTauList = async ({ ngay, ngayDen, trangThai, idTau, idLichChay, page = 1, limit = 20 }) => {
  const pg = Math.max(1, parseInt(page) || 1)
  const lm = Math.min(100, Math.max(1, parseInt(limit) || 20))
  const offset = (pg - 1) * lm

  const { rows, count } = await DieuPhoiRepo.getChuyenTauList({ ngay, ngayDen, trangThai, idTau, idLichChay, offset, limit: lm })

  const ids = rows.map(r => r.id_chuyen)
  const [veMap, evMap] = await Promise.all([
    DieuPhoiRepo.demVeTheoListChuyen(ids),
    DieuPhoiRepo.getSuKienMoiNhatTheoListChuyen(ids),
  ])

  return {
    total: count,
    page: pg,
    limit: lm,
    items: rows.map(c => ({
      idChuyen: c.id_chuyen,
      idLichChay: c.id_lich_chay,
      ngayChay: c.ngay_chay,
      trangThai: c.trang_thai,
      ghiChu: c.ghi_chu,
      tau: { id_tau: c.id_tau, so_hieu: c.ma_tau, ten_tau: c.ten_tau },
      gaDi: { id_ga: c.id_ga_di, ten_ga: c.ten_ga_di, ma_ga_viet_tat: c.vt_ga_di },
      gaDen: { id_ga: c.id_ga_den, ten_ga: c.ten_ga_den, ma_ga_viet_tat: c.vt_ga_den },
      gioKhoiHanh: c.gio_khoi_hanh,
      gioDuKienDen: c.gio_du_kien_den,
      vesBan: veMap[c.id_chuyen] || 0,
      suKienMoiNhat: evMap[c.id_chuyen] || null,
    })),
  }
}

// ─── Chi tiết chuyến ──────────────────────────────────────────────────────────

const getChuyenTauDetail = async (idChuyen) => {
  const chuyen = await DieuPhoiRepo.findChuyenById(idChuyen)
  if (!chuyen) throw { status: 404, message: 'Không tìm thấy chuyến tàu' }

  const idTau = chuyen.LichChay?.id_tau

  const [toaList, events, banByToa, lichTrinh] = await Promise.all([
    DieuPhoiRepo.ensureAndGetToaChuyen(idChuyen, idTau),
    DieuPhoiRepo.getEventsByChuyen(idChuyen),
    DieuPhoiRepo.demVeTheoToa(idChuyen),
    chuyen.LichChay
      ? DieuPhoiRepo.getLichTrinhByLichChay(chuyen.LichChay.id_lich_chay)
      : Promise.resolve([]),
  ])

  return {
    idChuyen: chuyen.id_chuyen,
    ngayChay: chuyen.ngay_chay,
    trangThai: chuyen.trang_thai,
    ghiChu: chuyen.ghi_chu,
    lichChay: chuyen.LichChay,
    toaList: toaList.map(t => ({
      idToaChuyen: t.id_toa_chuyen,
      soToaThuTu: parseInt(t.so_toa_thu_tu),
      idLoaiToa: t.id_loai_toa,
      soGheToidDa: t.so_ghe_toi_da || t.loai_so_cho_toi_da,
      loaiToa: { ten_loai_toa: t.ten_loai_toa, so_cho_toi_da: t.loai_so_cho_toi_da },
      vesBan: banByToa[parseInt(t.so_toa_thu_tu)] || 0,
    })),
    events: events.map(e => ({
      id: e.id_dieu_phoi,
      loaiSuKien: e.loai_su_kien,
      moTa: e.mo_ta,
      delayPhut: e.delay_phut,
      gaAnhHuong: e.GaAnhHuong?.ten_ga,
      trangThai: e.trang_thai,
      thoiGian: e.thoi_gian_tao,
    })),
    tongVeBan: Object.values(banByToa).reduce((s, v) => s + v, 0),
    lichTrinh: lichTrinh.map(s => ({
      idGa: s.id_ga,
      tenGa: s.GaTau?.ten_ga,
      maGa: s.GaTau?.ma_ga_viet_tat,
      thuTuDung: s.thu_tu_dung,
      gioDen: s.gio_den,
      gioDi: s.gio_di,
    })),
  }
}

// ─── Cập nhật trạng thái chuyến ───────────────────────────────────────────────

const updateTrangThai = async (idChuyen, trangThai, ghiChu, nguoiTao) => {
  const valid = ['dung_gio', 'da_chay', 'huy', 'dieu_chinh', 'sap_den']
  if (!valid.includes(trangThai)) throw { status: 400, message: 'Trạng thái không hợp lệ' }

  const chuyen = await DieuPhoiRepo.updateTrangThaiChuyen(idChuyen, trangThai, ghiChu)
  if (!chuyen) throw { status: 404, message: 'Không tìm thấy chuyến tàu' }

  if (trangThai === 'huy') {
    await DieuPhoiRepo.ghiSuKien({
      idChuyen, loaiSuKien: 'cancel',
      moTa: ghiChu || 'Hủy chuyến tàu',
      nguoiTao,
    })
  }

  return { idChuyen: parseInt(idChuyen), trangThai }
}

// ─── Ghi nhận sự kiện điều phối ───────────────────────────────────────────────

const logSuKien = async (idChuyen, { loaiSuKien, moTa, delayPhut, idGaAnhHuong, soToa }, nguoiTao) => {
  if (!loaiSuKien) throw { status: 400, message: 'Thiếu loại sự kiện' }

  const chuyenCheck = await DieuPhoiRepo.findChuyenById(idChuyen)
  if (!chuyenCheck) throw { status: 404, message: 'Không tìm thấy chuyến tàu' }
  if (chuyenCheck.trang_thai === 'da_chay') {
    throw { status: 400, message: 'Chuyến tàu đã chạy, không thể ghi nhận sự kiện điều phối' }
  }

  const result = await DieuPhoiRepo.ghiSuKien({ idChuyen, loaiSuKien, moTa, delayPhut, idGaAnhHuong, soToa, nguoiTao })

  const chuyen = await DieuPhoiRepo.findChuyenWithLichChay(idChuyen)
  const soHieuTau = chuyen?.LichChay?.Tau?.so_hieu || 'Chuyến tàu'
  const tenGaDi = chuyen?.LichChay?.GaDi?.ten_ga || ''
  const ngayChay = chuyen ? fmtDateVN(chuyen.ngay_chay) : ''

  if (loaiSuKien === 'delay' && delayPhut && chuyen?.LichChay) {
    const idGaTarget = idGaAnhHuong ? parseInt(idGaAnhHuong) : chuyen.LichChay.id_ga_di
    await DieuPhoiRepo.capNhatLichTrinhTheoDelay({
      idChuyen, idLichChay: chuyen.LichChay.id_lich_chay,
      idGaTarget, delayInt: parseInt(delayPhut), moTa,
    })
  }

  if (loaiSuKien === 'cancel') {
    await DieuPhoiRepo.updateTrangThaiChuyen(idChuyen, 'huy', null)
  }

  const thongBao = _buildThongBao({ loaiSuKien, delayPhut, moTa, soHieuTau, tenGaDi, ngayChay, chuyen })
  if (thongBao) {
    await DieuPhoiRepo.notifyAffectedCustomers(idChuyen, { ...thongBao, loai: loaiSuKien }).catch(() => {})
  }

  return { id: result?.id_dieu_phoi, message: result?.message || 'Ghi nhận sự kiện thành công' }
}

const _buildThongBao = ({ loaiSuKien, delayPhut, moTa, soHieuTau, tenGaDi, ngayChay, chuyen }) => {
  let tieuDe = null, noiDung = null
  if (loaiSuKien === 'delay' && delayPhut && chuyen?.LichChay) {
    const { orig, adjusted } = calcDelayedTime(chuyen.LichChay.gio_khoi_hanh, delayPhut)
    tieuDe = `Chuyến ${soHieuTau} bị chậm giờ`
    noiDung = `Chuyến tàu ${soHieuTau} xuất phát ${orig} ngày ${ngayChay}`
      + (tenGaDi ? ` tại ga ${tenGaDi}` : '')
      + ` sẽ khởi hành muộn hơn dự kiến ${parseInt(delayPhut)} phút, dự kiến lúc ${adjusted}`
      + (moTa ? `. Lý do: ${moTa}` : '') + '.'
  } else if (loaiSuKien === 'cancel') {
    tieuDe = `Chuyến ${soHieuTau} đã bị hủy`
    noiDung = `Chuyến tàu ${soHieuTau} xuất phát ngày ${ngayChay}`
      + (tenGaDi ? ` tại ga ${tenGaDi}` : '') + ' đã bị hủy'
      + (moTa ? `. Lý do: ${moTa}` : '') + '. Quý khách vui lòng liên hệ tổng đài để được hỗ trợ đổi/trả vé.'
  } else if (loaiSuKien === 'maintenance') {
    tieuDe = `Chuyến ${soHieuTau} có thông báo bảo trì kỹ thuật`
    noiDung = `Chuyến tàu ${soHieuTau} ngày ${ngayChay} có thể bị ảnh hưởng do bảo trì kỹ thuật`
      + (moTa ? `: ${moTa}` : '') + '. Quý khách vui lòng theo dõi các thông báo tiếp theo.'
  } else if (loaiSuKien === 'info' && moTa) {
    tieuDe = `Thông báo về chuyến ${soHieuTau}`
    noiDung = moTa
  }
  return tieuDe && noiDung ? { tieuDe, noiDung } : null
}

// ─── Quản lý toa ──────────────────────────────────────────────────────────────

const addToaChuyen = async (idChuyen, { soToaThuTu, idLoaiToa, soGheToidDa }) => {
  if (!soToaThuTu || !idLoaiToa) throw { status: 400, message: 'Thiếu soToaThuTu hoặc idLoaiToa' }

  const loaiToa = await DieuPhoiRepo.findLoaiToaById(idLoaiToa)
  if (!loaiToa) throw { status: 404, message: 'Loại toa không tồn tại' }

  await DieuPhoiRepo.triggerEnsureToaChuyen(idChuyen)

  const exists = await DieuPhoiRepo.findToaBySoToa(idChuyen, soToaThuTu)
  if (exists) throw { status: 400, message: `Toa số ${soToaThuTu} đã tồn tại trong chuyến này` }

  const tc = await DieuPhoiRepo.createToaChuyen({
    idChuyen, soToaThuTu, idLoaiToa,
    soGheToidDa: soGheToidDa ? parseInt(soGheToidDa) : loaiToa.so_cho_toi_da,
  })

  await DieuPhoiRepo.dongBoGheChuyen(idChuyen)

  return { idToaChuyen: tc.id_toa_chuyen }
}

const updateToaChuyen = async (toaId, { soToaThuTu, idLoaiToa, soGheToidDa, idChuyen }) => {
  let tc = await DieuPhoiRepo.findToaById(toaId)

  if (!tc && idChuyen && soToaThuTu) {
    await DieuPhoiRepo.triggerEnsureToaChuyen(idChuyen)
    tc = await DieuPhoiRepo.findToaBySoToa(idChuyen, soToaThuTu)
  }
  if (!tc) throw { status: 404, message: 'Không tìm thấy toa — vui lòng tải lại trang và thử lại' }

  const veCnt = await DieuPhoiRepo.demVeTheoTuaToa(tc.id_chuyen, tc.so_toa_thu_tu)
  if (veCnt > 0) {
    throw { status: 400, message: `Không thể chỉnh sửa toa ${tc.so_toa_thu_tu} — đã có ${veCnt} vé đặt. Chỉ điều chỉnh toa ngay khi sinh chuyến (trước khi có vé).` }
  }

  const newSoToa = soToaThuTu ? parseInt(soToaThuTu) : tc.so_toa_thu_tu
  const newIdLoai = idLoaiToa ? parseInt(idLoaiToa) : tc.id_loai_toa
  const newSoGhe = soGheToidDa ? parseInt(soGheToidDa) : tc.so_ghe_toi_da
  const oldSoToa = tc.so_toa_thu_tu

  if (newSoToa !== oldSoToa) {
    const dup = await DieuPhoiRepo.findToaBySoToa(tc.id_chuyen, newSoToa)
    if (dup) {
      const veCountDup = await DieuPhoiRepo.demVeTheoTuaToa(tc.id_chuyen, dup.so_toa_thu_tu)
      if (veCountDup > 0) {
        throw { status: 400, message: `Không thể hoán đổi — toa ${dup.so_toa_thu_tu} đã có ${veCountDup} vé đặt` }
      }
      await DieuPhoiRepo.hoanDoiToa({
        idToaChuyen1: tc.id_toa_chuyen, soToaCu1: oldSoToa,
        idToaChuyen2: dup.id_toa_chuyen, soToaCu2: newSoToa,
      })
      return { swapped: true, toa1: oldSoToa, toa2: newSoToa }
    }
  }

  await DieuPhoiRepo.updateToa(tc, { newSoToa, newIdLoai, newSoGhe })
  return { idToaChuyen: tc.id_toa_chuyen }
}

const removeToaChuyen = async (toaId) => {
  const tc = await DieuPhoiRepo.findToaById(toaId)
  if (!tc) throw { status: 404, message: 'Không tìm thấy toa' }

  const veCnt = await DieuPhoiRepo.demVeTheoTuaToa(tc.id_chuyen, tc.so_toa_thu_tu)
  if (veCnt > 0) throw { status: 400, message: `Không thể xóa toa ${tc.so_toa_thu_tu} vì đã có ${veCnt} vé đặt` }

  await tc.destroy()
}

const reorderToa = async (idChuyen, order) => {
  if (!Array.isArray(order) || order.length === 0) throw { status: 400, message: 'Danh sách sắp xếp không được rỗng' }

  const veCnt = await DieuPhoiRepo.demVeTheoChuyen(idChuyen)
  if (veCnt > 0) {
    throw { status: 400, message: `Không thể sắp xếp lại toa — chuyến đã có ${veCnt} vé đặt. Chỉ điều chỉnh toa ngay khi sinh chuyến.` }
  }

  await DieuPhoiRepo.reorderToa(idChuyen, order)
}

// ─── Quản lý lịch chạy ────────────────────────────────────────────────────────

const getLichChayList = async (idTau) => DieuPhoiRepo.getLichChayList(idTau || null)

const createLichChay = async ({ idTau, idGaDi, idGaDen, gioKhoiHanh, gioDuKienDen, thuTrongTuan }) => {
  if (!idTau || !idGaDi || !idGaDen || !gioKhoiHanh || !gioDuKienDen) {
    throw { status: 400, message: 'Thiếu thông tin bắt buộc' }
  }
  const lc = await DieuPhoiRepo.createLichChay({ idTau, idGaDi, idGaDen, gioKhoiHanh, gioDuKienDen, thuTrongTuan })
  return { idLichChay: lc.id_lich_chay }
}

const updateLichChay = async (idLichChay, { gioKhoiHanh, gioDuKienDen, thuTrongTuan, idTau, idGaDi, idGaDen }) => {
  const lc = await DieuPhoiRepo.findLichChayById(idLichChay)
  if (!lc) throw { status: 404, message: 'Không tìm thấy lịch chạy' }
  await DieuPhoiRepo.updateLichChay(lc, {
    gio_khoi_hanh: gioKhoiHanh ?? lc.gio_khoi_hanh,
    gio_du_kien_den: gioDuKienDen ?? lc.gio_du_kien_den,
    thu_trong_tuan: thuTrongTuan ?? lc.thu_trong_tuan,
    id_tau: idTau ? parseInt(idTau) : lc.id_tau,
    id_ga_di: idGaDi ? parseInt(idGaDi) : lc.id_ga_di,
    id_ga_den: idGaDen ? parseInt(idGaDen) : lc.id_ga_den,
  })
}

const deleteLichChay = async (idLichChay) => {
  const lc = await DieuPhoiRepo.findLichChayById(idLichChay)
  if (!lc) throw { status: 404, message: 'Không tìm thấy lịch chạy' }

  const soChuyen = await DieuPhoiRepo.countChuyenByLichChay(idLichChay)
  if (soChuyen > 0) throw { status: 400, message: 'Không thể xóa lịch trình vì đã có chuyến tàu' }

  await DieuPhoiRepo.deleteLichChay(lc)
}

// ─── Quản lý ga dừng ──────────────────────────────────────────────────────────

const getGaDungList = async (idLichChay) => {
  const list = await DieuPhoiRepo.getGaDungList(idLichChay)
  return list.map(s => ({
    idLichTrinh: s.id_lich_trinh,
    idLichChay: s.id_lich_chay,
    thuTuDung: s.thu_tu_dung,
    idGa: s.id_ga,
    ga: s.GaTau,
    gioDen: s.gio_den,
    gioDi: s.gio_di,
    khoangCachKm: s.khoang_cach_km,
    thoiGianDung: s.thoi_gian_dung,
  }))
}

const validateGaDung = (existing, { thuTuDung, gioDen, gioDi, khoangCachKm }) => {
  if (String(gioDen) > String(gioDi)) return 'Thời gian đến phải nhỏ hơn hoặc bằng thời gian đi'
  if (existing.some(s => s.thu_tu_dung === thuTuDung)) return `Thứ tự dừng ${thuTuDung} đã tồn tại`
  for (const s of existing) {
    const km = parseFloat(s.khoang_cach_km)
    if (s.thu_tu_dung < thuTuDung && km >= khoangCachKm) return 'Khoảng cách phải tăng dần theo thứ tự ga dừng'
    if (s.thu_tu_dung > thuTuDung && km <= khoangCachKm) return 'Khoảng cách phải tăng dần theo thứ tự ga dừng'
  }
  return null
}

const addGaDung = async (idLichChay, { thuTuDung, idGa, gioDen, gioDi, khoangCachKm, thoiGianDung }) => {
  if (!thuTuDung || !idGa || !gioDen || !gioDi || khoangCachKm == null || thoiGianDung == null) {
    throw { status: 400, message: 'Vui lòng nhập đầy đủ thông tin ga dừng' }
  }

  const lc = await DieuPhoiRepo.findLichChayById(idLichChay)
  if (!lc) throw { status: 404, message: 'Không tìm thấy lịch chạy' }

  const existing = await DieuPhoiRepo.getAllGaDungRaw(idLichChay)
  const errMsg = validateGaDung(existing, { thuTuDung: parseInt(thuTuDung), gioDen, gioDi, khoangCachKm: parseFloat(khoangCachKm) })
  if (errMsg) throw { status: 400, message: errMsg }

  const row = await DieuPhoiRepo.createGaDung({ idLichChay, idGa, thuTuDung, gioDen, gioDi, khoangCachKm, thoiGianDung })
  return { idLichTrinh: row.id_lich_trinh }
}

const updateGaDung = async (idLichTrinh, { thuTuDung, idGa, gioDen, gioDi, khoangCachKm, thoiGianDung }) => {
  if (!thuTuDung || !idGa || !gioDen || !gioDi || khoangCachKm == null || thoiGianDung == null) {
    throw { status: 400, message: 'Vui lòng nhập đầy đủ thông tin ga dừng' }
  }

  const row = await DieuPhoiRepo.findGaDungById(idLichTrinh)
  if (!row) throw { status: 404, message: 'Không tìm thấy ga dừng' }

  const existing = await DieuPhoiRepo.getAllGaDungRaw(row.id_lich_chay, row.id_lich_trinh)
  const errMsg = validateGaDung(existing, { thuTuDung: parseInt(thuTuDung), gioDen, gioDi, khoangCachKm: parseFloat(khoangCachKm) })
  if (errMsg) throw { status: 400, message: errMsg }

  const deltaMin = timeToMinutes(gioDi) - timeToMinutes(row.gio_di)
  await DieuPhoiRepo.updateGaDung(row, { idGa, thuTuDung, gioDen, gioDi, khoangCachKm, thoiGianDung, deltaMin })
  return { deltaMin }
}

const removeGaDung = async (idLichTrinh) => {
  const row = await DieuPhoiRepo.findGaDungById(idLichTrinh)
  if (!row) throw { status: 404, message: 'Không tìm thấy ga dừng' }
  await row.destroy()
}

// ─── Sinh chuyến tàu ─────────────────────────────────────────────────────────

const sinhChuyenTau = async ({ idLichChay, tuNgay, denNgay }) => {
  if (!idLichChay || !tuNgay || !denNgay) throw { status: 400, message: 'Thiếu thông tin bắt buộc' }

  const lichChay = await DieuPhoiRepo.findLichChayById(idLichChay)
  if (!lichChay) throw { status: 400, message: 'Lịch chạy không tồn tại' }

  const start = new Date(tuNgay)
  const end = new Date(denNgay)
  if (isNaN(start) || isNaN(end) || start > end) throw { status: 400, message: 'Khoảng ngày không hợp lệ' }

  const diffDays = Math.round((end - start) / 86400000)
  if (diffDays > 90) throw { status: 400, message: 'Tối đa 90 ngày mỗi lần sinh chuyến' }

  const existingDates = await DieuPhoiRepo.getExistingNgayChay(idLichChay, tuNgay, denNgay)

  const toCreate = []
  let createdCount = 0, skippedCount = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ngay = d.toISOString().slice(0, 10)
    if (existingDates.has(ngay)) { skippedCount++ } else {
      toCreate.push({ id_lich_chay: parseInt(idLichChay), ngay_chay: ngay, trang_thai: 'dung_gio' })
      createdCount++
    }
  }

  await DieuPhoiRepo.bulkCreateChuyen(toCreate)
  return { created: createdCount, skipped: skippedCount }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

const getTauList = async () => DieuPhoiRepo.getAllTau()
const getGaList = async () => DieuPhoiRepo.getAllGa()
const getLoaiToaList = async () => DieuPhoiRepo.getAllLoaiToa()

module.exports = {
  getDashboard,
  getChuyenTauList,
  getChuyenTauDetail,
  updateTrangThai,
  logSuKien,
  addToaChuyen, updateToaChuyen, removeToaChuyen, reorderToa,
  getLichChayList, createLichChay, updateLichChay, deleteLichChay,
  getGaDungList, addGaDung, updateGaDung, removeGaDung,
  sinhChuyenTau,
  getTauList, getGaList, getLoaiToaList,
}
