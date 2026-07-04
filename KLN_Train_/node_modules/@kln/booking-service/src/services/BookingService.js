const { sequelize } = require('../config/database')
const { Op } = require('sequelize')
const fmtDt = (d) => sequelize.literal(`'${new Date(d).toISOString().replace('T', ' ').slice(0, 23)}'`)
const { DonDatVe, Ve, TamGiuGhe, KhuyenMai } = require('../models')
const BookingRepo = require('../repositories/BookingRepository')
const RailwaySeat = require('../services/RailwaySeatClient')
const CustomerClient = require('../services/CustomerClient')
const { genBookingCode, genOrderCode } = require('../utils/helpers')

// Giữ ghế tạm khi user bắt đầu điền form (trước khi đặt vé chính thức)
const holdSeatsForCheckout = async ({ trips }) => {
  const sessionId = require('crypto').randomBytes(8).toString('hex').toUpperCase()
  const hetHan = new Date(Date.now() + 15 * 60 * 1000)

  for (const trip of trips) {
    const toaMap = {}
    trip.passengerSeats.forEach(ps => {
      if (!toaMap[ps.soToaThuTu]) toaMap[ps.soToaThuTu] = []
      toaMap[ps.soToaThuTu].push(ps.seatNumber)
    })
    for (const [soToa, soGheList] of Object.entries(toaMap)) {
      const ok = await BookingRepo.checkSeatsAvailable(
        trip.idChuyen, parseInt(soToa), soGheList,
        trip.idGaLen, trip.idGaXuong
      )
      if (!ok) throw { status: 409, message: `Ghế đã được đặt trong chuyến #${trip.idChuyen}. Vui lòng chọn lại.` }
    }
    for (const [soToa, soGheList] of Object.entries(toaMap)) {
      await BookingRepo.holdSeats(
        trip.idChuyen, parseInt(soToa), soGheList, sessionId, null,
        trip.idGaLen || null, trip.idGaXuong || null
      )
    }
  }

  return { sessionId, hetHan }
}

// Tạo đơn đặt vé (gồm giữ ghế + tạo Ve; HanhKhach lấy từ customer-service)
const createBooking = async ({ trips, passengers, contactInfo, idTaiKhoan = null, maKhuyenMai = null }) => {
  // 1. Validate khuyến mãi
  let khuyenMai = null
  let tienGiam = 0
  if (maKhuyenMai) {
    khuyenMai = await KhuyenMai.findOne({ where: { ma_khuyen_mai: maKhuyenMai.toUpperCase() } })
    if (!khuyenMai) throw { status: 400, message: 'Mã khuyến mãi không hợp lệ' }
    const today = new Date().toISOString().slice(0, 10)
    if (today < khuyenMai.ngay_bat_dau || today > khuyenMai.ngay_het_han)
      throw { status: 400, message: 'Mã khuyến mãi đã hết hạn' }
    if (khuyenMai.so_luong && khuyenMai.da_dung >= khuyenMai.so_luong)
      throw { status: 400, message: 'Mã khuyến mãi đã hết lượt sử dụng' }
  }

  // 2. Tính tổng tiền
  const tongTienVe = trips.reduce((s, trip) =>
    s + trip.passengerSeats.reduce((ps, p) => ps + p.seatPrice, 0), 0)
 const tongTruocGiam = tongTienVe

  if (khuyenMai && tongTruocGiam >= parseFloat(khuyenMai.gia_tri_don_toi_thieu)) {
    if (khuyenMai.loai_giam === 'phan_tram') {
      tienGiam = Math.floor(tongTruocGiam * parseFloat(khuyenMai.gia_tri) / 100)
      if (khuyenMai.giam_toi_da) tienGiam = Math.min(tienGiam, parseFloat(khuyenMai.giam_toi_da))
    } else {
      tienGiam = Math.min(parseFloat(khuyenMai.gia_tri), tongTruocGiam)
    }
  }
  const tongThanhToan = tongTruocGiam - tienGiam

  // 3. Kiểm tra ghế còn trống (segment-aware) — hỏi railway-service
  for (const trip of trips) {
    const tripSessionId = trip.sessionId || null
    const toaMap = {}
    trip.passengerSeats.forEach(ps => {
      const soToa = ps.soToaThuTu ?? trip.soToaThuTu
      if (!toaMap[soToa]) toaMap[soToa] = []
      toaMap[soToa].push(ps.seatNumber)
    })
    for (const [soToa, soGheList] of Object.entries(toaMap)) {
      const available = await BookingRepo.checkSeatsAvailable(
        trip.idChuyen, parseInt(soToa), soGheList,
        trip.idGaLen || null, trip.idGaXuong || null, tripSessionId
      )
      if (!available) throw { status: 409, message: `Ghế đã được đặt trong chuyến #${trip.idChuyen}. Vui lòng chọn lại.` }
    }
  }

  // 4. Sinh mã đơn
  let maDatCho, maDon
  do { maDatCho = genBookingCode() } while (await DonDatVe.findOne({ where: { ma_dat_cho: maDatCho } }))
  maDon = genOrderCode()

  const hetHan = new Date(Date.now() + 15 * 60 * 1000)

  return sequelize.transaction(async (t) => {
    // 5. Tạo DonDatVe
    const don = await DonDatVe.create({
      ma_don: maDon,
      ma_dat_cho: maDatCho,
      id_tai_khoan: idTaiKhoan,
      ho_ten_lien_lac: contactInfo.hoTen || passengers[0]?.hoTen || '',
      email_dat_cho: contactInfo.email,
      sdt_dat_cho: contactInfo.phone.replace(/\s/g, ''),
      cccd: passengers[0]?.cccd || '000000000',
      loai_ve: trips.length > 1 ? 'khu_hoi' : 'mot_chieu',
      tong_tien: tongTruocGiam,
      tien_giam: tienGiam,
      tien_thanh_toan: tongThanhToan,
      id_khuyen_mai: khuyenMai?.id_khuyen_mai || null,
      trang_thai: 'cho_thanh_toan',
      thoi_gian_dat: fmtDt(new Date()),
      thoi_gian_het_han: fmtDt(hetHan),
    }, { transaction: t })

    // 6. Tạo Ve cho mỗi chuyến (HanhKhach: tìm/tạo qua customer-service)
    const veList = []
    let passengerIdx = 0
    for (const trip of trips) {
      for (let i = 0; i < trip.passengerSeats.length; i++) {
        const ps = trip.passengerSeats[i]
        const p = passengers[passengerIdx++] ?? passengers[passengers.length - 1]

        const loaiHK = p.isChild ? 'tre_em'
          : p.isElderly ? 'nguoi_cao_tuoi'
          : p.isStudent ? 'sinh_vien'
          : 'nguoi_lon'

        const hk = await CustomerClient.findOrCreatePassenger({
          id_tai_khoan: idTaiKhoan,
          ho_ten: p.hoTen,
          ngay_sinh: p.ngaySinh,
          cccd: p.cccd || null,
          loai_hanh_khach: loaiHK,
          so_dien_thoai: contactInfo.phone.replace(/\s/g, ''),
          la_chinh: passengerIdx === 1,
        })

        const ve = await Ve.create({
          id_don_dat_ve: don.id_don_dat_ve,
          id_hanh_khach: hk.id_hanh_khach,
          id_chuyen: trip.idChuyen,
          so_toa_thu_tu: ps.soToaThuTu ?? trip.soToaThuTu,
          so_ghe_trong_toa: ps.seatNumber,
          id_ga_len: trip.idGaLen,
          id_ga_xuong: trip.idGaXuong,
          loai_hanh_khach: loaiHK,
          gia_ve: ps.seatPrice,
          trang_thai: 'cho_xac_nhan',
          ngay_xuat_ve: fmtDt(new Date()),
        }, { transaction: t })

        veList.push({ ve, trip })
      }

      // Giữ ghế tạm thời (nhóm theo toa)
      const holdToaMap = {}
      trip.passengerSeats.forEach(ps => {
        const soToa = ps.soToaThuTu ?? trip.soToaThuTu
        if (!holdToaMap[soToa]) holdToaMap[soToa] = []
        holdToaMap[soToa].push(ps.seatNumber)
      })
      const tripSessionId = trip.sessionId || null
      for (const [soToa, soGheList] of Object.entries(holdToaMap)) {
        if (tripSessionId) {
          await TamGiuGhe.update(
            {
              id_don_dat_ve: don.id_don_dat_ve,
              id_ga_len: trip.idGaLen || null,
              id_ga_xuong: trip.idGaXuong || null,
              thoi_gian_het_han: fmtDt(new Date(Date.now() + 15 * 60 * 1000)),
            },
            {
              where: {
                id_chuyen: trip.idChuyen,
                so_toa_thu_tu: parseInt(soToa),
                so_ghe_trong_toa: { [Op.in]: soGheList },
                session_id: tripSessionId,
                trang_thai: 'dang_giu',
              },
              transaction: t,
            }
          )
        } else {
          await BookingRepo.holdSeats(
            trip.idChuyen, parseInt(soToa), soGheList, maDatCho, don.id_don_dat_ve,
            trip.idGaLen || null, trip.idGaXuong || null
          )
        }
      }
    }

    // 7. Cập nhật số lần dùng khuyến mãi
    if (khuyenMai) {
      await KhuyenMai.increment('da_dung', { by: 1, where: { id_khuyen_mai: khuyenMai.id_khuyen_mai }, transaction: t })
    }

    // 8. Gắn id_ve vào GheChang (railway) — best-effort, Ve local đã là
    // nguồn sự thật dự phòng cho việc kiểm tra ghế trống nếu bước này lỗi.
    for (const { ve, trip } of veList) {
      if (trip.idGaLen && trip.idGaXuong) {
        await RailwaySeat.linkVe({
          idChuyen: trip.idChuyen,
          soToaThuTu: ve.so_toa_thu_tu,
          soGheTrongToa: ve.so_ghe_trong_toa,
          idVe: ve.id_ve,
          idGaLen: trip.idGaLen,
          idGaXuong: trip.idGaXuong,
          sessionId: trip.sessionId || null,
        }).catch(() => {})
      }
    }

    return { don, maDon, maDatCho, tongThanhToan, tienGiam, veList: veList.map(v => v.ve) }
  })
}

// Tra cứu đơn đặt vé (theo mã đặt chỗ + email + phone)
const lookupBooking = async (maDatCho, email = '', phone = '') => {
  let don = await BookingRepo.findByMaDatCho(maDatCho)
  if (!don) return null

  const emailMatch = don.email_dat_cho.toLowerCase() === email.trim().toLowerCase()
  const phoneClean = don.sdt_dat_cho.replace(/\D/g, '')
  const inputPhone = phone.trim().replace(/\D/g, '')
  const phoneMatch = phoneClean === inputPhone || phoneClean.slice(-9) === inputPhone.slice(-9)

  if (!emailMatch || !phoneMatch) return null

  if (don.trang_thai === 'cho_thanh_toan') {
    const hetHanMs = new Date(don.thoi_gian_het_han).getTime()
    if (Date.now() > hetHanMs) {
      await Ve.update({ trang_thai: 'da_huy' }, { where: { id_don_dat_ve: don.id_don_dat_ve, trang_thai: 'cho_xac_nhan' } })
      await DonDatVe.update({ trang_thai: 'het_han' }, { where: { id_don_dat_ve: don.id_don_dat_ve } })
      don = await BookingRepo.findByMaDatCho(maDatCho)
    }
  }

  return don
}

const getBookingByCode = async (maDatCho) => {
  const don = await BookingRepo.findByMaDatCho(maDatCho)
  if (!don) throw { status: 404, message: 'Không tìm thấy đơn đặt vé' }
  return don
}

const releaseHold = async (sessionId) => {
  if (!sessionId) throw { status: 400, message: 'Thiếu sessionId' }
  await BookingRepo.releaseHoldBySession(sessionId)
}

const getBookingHistory = async (idTaiKhoan, { page = 1, limit = 5 } = {}) => {
  const { rows, count } = await BookingRepo.findByTaiKhoan(idTaiKhoan, { page, limit })
  return {
    items: rows,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    limit,
  }
}
const formatDon = (don) => {
  if (!don) return null
  return {
    idDon: don.id_don_dat_ve,
    maDon: don.ma_don,
    maDatCho: don.ma_dat_cho,
    trangThai: don.trang_thai,
    loaiVe: don.loai_ve,
    tongTien: don.tong_tien,
    tienGiam: don.tien_giam,
    tienThanhToan: don.tien_thanh_toan,
    hoTenLienLac: don.ho_ten_lien_lac,
    emailDatCho: don.email_dat_cho,
    sdtDatCho: don.sdt_dat_cho,
    thoiGianDat: don.thoi_gian_dat,
    thoiGianHetHan: don.thoi_gian_het_han,
    ve: (don.Ves || []).map(ve => ({
      idVe: ve.id_ve,
      idChuyen: ve.id_chuyen,
      soToa: ve.so_toa_thu_tu,
      soGhe: ve.so_ghe_trong_toa,
      giaVe: ve.gia_ve,
      qrVe: ve.qr_ve || null,
      loaiHanhKhach: ve.loai_hanh_khach,
      trangThai: ve.trang_thai,
      hanhKhach: ve.HanhKhach ? {
        hoTen: ve.HanhKhach.ho_ten,
        ngaySinh: ve.HanhKhach.ngay_sinh,
        cccd: ve.HanhKhach.cccd,
      } : null,
      chuyen: ve.ChuyenTau ? {
        ngayChay: ve.ChuyenTau.ngay_chay,
        gioKhoiHanh: ve.ChuyenTau.LichChay?.gio_khoi_hanh,
        gioDen: ve.ChuyenTau.LichChay?.gio_du_kien_den,
        maTau: ve.ChuyenTau.LichChay?.Tau?.so_hieu,
        gaDi: ve.GaLen?.ten_ga || ve.ChuyenTau.LichChay?.GaDi?.ten_ga || '',
        gaDen: ve.GaXuong?.ten_ga || ve.ChuyenTau.LichChay?.GaDen?.ten_ga || '',
      } : null,
    })),
    thanhToan: (don.ThanhToans || []).map(tt => ({
      idThanhToan: tt.id_thanh_toan,
      maGiaoDich: tt.ma_giao_dich,
      phuongThuc: tt.phuong_thuc,
      soTien: tt.so_tien,
      trangThai: tt.trang_thai,
      thoiGianTao: tt.thoi_gian_tao,
      thoiGianTT: tt.thoi_gian_thanh_toan,
    })),
  }
}

module.exports = { holdSeatsForCheckout, createBooking, lookupBooking, getBookingByCode, releaseHold, getBookingHistory, formatDon }
