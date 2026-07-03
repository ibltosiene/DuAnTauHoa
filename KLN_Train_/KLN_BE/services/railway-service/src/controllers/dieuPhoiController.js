const DieuPhoiService = require('../services/DieuPhoiService')
const { response: { ok, created, badRequest, notFound } } = require('@kln/shared')

const getDashboard = async (req, res, next) => {
  try { ok(res, await DieuPhoiService.getDashboard()) } catch (err) { next(err) }
}

const getChuyenTauList = async (req, res, next) => {
  try {
    const { ngay, ngayDen, trangThai, idTau, idLichChay, page, limit } = req.query
    ok(res, await DieuPhoiService.getChuyenTauList({ ngay, ngayDen, trangThai, idTau, idLichChay, page, limit }))
  } catch (err) { next(err) }
}

const getChuyenTauDetail = async (req, res, next) => {
  try {
    ok(res, await DieuPhoiService.getChuyenTauDetail(parseInt(req.params.id)))
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const updateTrangThai = async (req, res, next) => {
  try {
    const { trangThai, ghiChu } = req.body
    const data = await DieuPhoiService.updateTrangThai(req.params.id, trangThai, ghiChu, req.user.userId)
    ok(res, data, 'Cập nhật trạng thái thành công')
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const logSuKien = async (req, res, next) => {
  try {
    const { loaiSuKien, moTa, delayPhut, idGaAnhHuong, soToa } = req.body
    const data = await DieuPhoiService.logSuKien(
      req.params.id,
      { loaiSuKien, moTa, delayPhut, idGaAnhHuong, soToa },
      req.user.userId
    )
    created(res, { id: data.id }, data.message)
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const addToaChuyen = async (req, res, next) => {
  try {
    const { soToaThuTu, idLoaiToa, soGheToidDa } = req.body
    const data = await DieuPhoiService.addToaChuyen(req.params.id, { soToaThuTu, idLoaiToa, soGheToidDa })
    created(res, data, `Thêm toa ${soToaThuTu} thành công`)
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const updateToaChuyen = async (req, res, next) => {
  try {
    const { soToaThuTu, idLoaiToa, soGheToidDa, idChuyen } = req.body
    const data = await DieuPhoiService.updateToaChuyen(req.params.toaId, { soToaThuTu, idLoaiToa, soGheToidDa, idChuyen })
    if (data.swapped) {
      return ok(res, { swapped: true, toa1: data.toa1, toa2: data.toa2 }, `Hoán đổi thứ tự toa ${data.toa1} ↔ ${data.toa2} thành công`)
    }
    ok(res, { idToaChuyen: data.idToaChuyen }, 'Cập nhật toa thành công')
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const removeToaChuyen = async (req, res, next) => {
  try {
    await DieuPhoiService.removeToaChuyen(req.params.toaId)
    ok(res, null, 'Xóa toa thành công')
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const reorderToa = async (req, res, next) => {
  try {
    await DieuPhoiService.reorderToa(req.params.id, req.body.order)
    ok(res, null, 'Sắp xếp lại toa thành công')
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    next(err)
  }
}

const getLichChayList = async (req, res, next) => {
  try { ok(res, await DieuPhoiService.getLichChayList(req.query.idTau)) } catch (err) { next(err) }
}

const createLichChay = async (req, res, next) => {
  try {
    const { idTau, idGaDi, idGaDen, gioKhoiHanh, gioDuKienDen, thuTrongTuan } = req.body
    const data = await DieuPhoiService.createLichChay({ idTau, idGaDi, idGaDen, gioKhoiHanh, gioDuKienDen, thuTrongTuan })
    created(res, data, 'Tạo lịch chạy thành công')
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    next(err)
  }
}

const updateLichChay = async (req, res, next) => {
  try {
    const { gioKhoiHanh, gioDuKienDen, thuTrongTuan, idTau, idGaDi, idGaDen } = req.body
    await DieuPhoiService.updateLichChay(req.params.id, { gioKhoiHanh, gioDuKienDen, thuTrongTuan, idTau, idGaDi, idGaDen })
    ok(res, null, 'Cập nhật lịch chạy thành công')
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const deleteLichChay = async (req, res, next) => {
  try {
    await DieuPhoiService.deleteLichChay(parseInt(req.params.id))
    ok(res, null, 'Xóa lịch chạy thành công')
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const getGaDungList = async (req, res, next) => {
  try { ok(res, await DieuPhoiService.getGaDungList(parseInt(req.params.id))) } catch (err) { next(err) }
}

const addGaDung = async (req, res, next) => {
  try {
    const { thuTuDung, idGa, gioDen, gioDi, khoangCachKm, thoiGianDung } = req.body
    const data = await DieuPhoiService.addGaDung(parseInt(req.params.id), { thuTuDung, idGa, gioDen, gioDi, khoangCachKm, thoiGianDung })
    created(res, data, 'Thêm ga dừng thành công')
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const updateGaDung = async (req, res, next) => {
  try {
    const { thuTuDung, idGa, gioDen, gioDi, khoangCachKm, thoiGianDung } = req.body
    const { deltaMin } = await DieuPhoiService.updateGaDung(req.params.id, { thuTuDung, idGa, gioDen, gioDi, khoangCachKm, thoiGianDung })
    ok(res, null, 'Cập nhật ga dừng thành công' + (deltaMin !== 0 ? ' (đã cập nhật giờ các ga sau)' : ''))
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const removeGaDung = async (req, res, next) => {
  try {
    await DieuPhoiService.removeGaDung(req.params.id)
    ok(res, null, 'Xóa ga dừng thành công')
  } catch (err) {
    if (err.status === 404) return notFound(res, err.message)
    next(err)
  }
}

const sinhChuyenTau = async (req, res, next) => {
  try {
    const { idLichChay, tuNgay, denNgay } = req.body
    const data = await DieuPhoiService.sinhChuyenTau({ idLichChay, tuNgay, denNgay })
    ok(res, data, `Sinh ${data.created} chuyến thành công`)
  } catch (err) {
    if (err.status === 400) return badRequest(res, err.message)
    next(err)
  }
}

const getTauList = async (req, res, next) => {
  try { ok(res, await DieuPhoiService.getTauList()) } catch (err) { next(err) }
}

const getGaList = async (req, res, next) => {
  try { ok(res, await DieuPhoiService.getGaList()) } catch (err) { next(err) }
}

const getLoaiToaList = async (req, res, next) => {
  try { ok(res, await DieuPhoiService.getLoaiToaList()) } catch (err) { next(err) }
}

module.exports = {
  getDashboard, getChuyenTauList, getChuyenTauDetail,
  updateTrangThai, logSuKien,
  addToaChuyen, updateToaChuyen, removeToaChuyen, reorderToa,
  getLichChayList, createLichChay, updateLichChay, deleteLichChay, sinhChuyenTau,
  getGaDungList, addGaDung, updateGaDung, removeGaDung,
  getTauList, getGaList, getLoaiToaList,
}
