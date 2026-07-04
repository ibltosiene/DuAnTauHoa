const { sequelize } = require('../config/database')
const { DonDatVe, Ve, DoiVe, HanhKhach, ChuyenTau, LichChay, TamGiuGhe } = require('../models')
const fmtDt = (d) => sequelize.literal(`'${new Date(d).toISOString().replace('T', ' ').slice(0, 23)}'`)
const VN_OFFSET = 7 * 60 * 60 * 1000
const fmtVN = (d) => sequelize.literal(`'${new Date(new Date(d).getTime() + VN_OFFSET).toISOString().replace('T', ' ').slice(0, 23)}'`)
const BookingRepo = require('../repositories/BookingRepository')
const RailwaySeat = require('../services/RailwaySeatClient')
const { calcExchangeFee, genTransactionCode } = require('../utils/helpers')
const { serviceClient } = require('@kln/shared')

const toDateStr = (v) => {
  if (!v) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  const m = String(v).match(/(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : String(v).slice(0, 10)
}
const toTimeStr = (v) => {
  if (!v) return '00:00:00'
  if (v instanceof Date) {
    return `${String(v.getUTCHours()).padStart(2, '0')}:${String(v.getUTCMinutes()).padStart(2, '0')}:00`
  }
  const s = String(v)
  const iso = s.match(/T(\d{2}:\d{2}:\d{2})/)
  if (iso) return iso[1]
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 8)
  return '00:00:00'
}

// Kiểm tra vé có thể đổi không (cần trước giờ chạy ≥ 24h)
const checkExchangeable = async (idVe) => {
  const ve = await Ve.findByPk(idVe, {
    include: [{ model: ChuyenTau, include: [{ model: LichChay }] }],
  })
  if (!ve) throw { status: 404, message: 'Không tìm thấy vé' }
  if (ve.trang_thai !== 'da_xac_nhan') throw { status: 400, message: 'Chỉ có thể đổi vé đã xác nhận' }

  const ngayChay = toDateStr(ve.ChuyenTau.ngay_chay)
  const gioChay = toTimeStr(ve.ChuyenTau.LichChay.gio_khoi_hanh)
  const departAt = new Date(`${ngayChay}T${gioChay}+07:00`)
  const gioConLai = (departAt.getTime() - Date.now()) / (1000 * 60 * 60)

  if (gioConLai < 24) throw { status: 400, message: 'Chỉ có thể đổi vé trước 24 giờ khởi hành' }

  const phiDoi = calcExchangeFee(parseFloat(ve.gia_ve))
  return { idVe, giaVe: parseFloat(ve.gia_ve), phiDoi, gioConLai }
}

// Thực hiện đổi vé
const exchangeTicket = async (idVeCu, newTicketData) => {
  const available = await BookingRepo.checkSeatsAvailable(
    newTicketData.idChuyen, newTicketData.soToa, [newTicketData.soGhe]
  )
  if (!available) throw { status: 409, message: 'Ghế đã được đặt. Vui lòng chọn ghế khác.' }

  const result = await sequelize.transaction(async (t) => {
    const veCu = await Ve.findByPk(idVeCu, { include: [{ model: ChuyenTau }], transaction: t })
    if (!veCu) throw { status: 404, message: 'Không tìm thấy vé cũ' }

    const phiDoi = calcExchangeFee(parseFloat(veCu.gia_ve))
    const chenhLech = Math.max(0, newTicketData.giaVeMoi - parseFloat(veCu.gia_ve))
    const tongPhaitra = phiDoi + chenhLech

    const trangThaiVeMoi = tongPhaitra > 0 ? 'cho_xac_nhan' : 'da_xac_nhan'
    const veMoi = await Ve.create({
      id_don_dat_ve: veCu.id_don_dat_ve,
      id_hanh_khach: veCu.id_hanh_khach,
      id_chuyen: newTicketData.idChuyen,
      so_toa_thu_tu: newTicketData.soToa,
      so_ghe_trong_toa: newTicketData.soGhe,
      id_ga_len: newTicketData.idGaLen,
      id_ga_xuong: newTicketData.idGaXuong,
      loai_hanh_khach: veCu.loai_hanh_khach,
      gia_ve: newTicketData.giaVeMoi,
      trang_thai: trangThaiVeMoi,
      ngay_xuat_ve: fmtDt(new Date()),
    }, { transaction: t })

    const doi = await DoiVe.create({
      id_ve_cu: idVeCu,
      id_ve_moi: veMoi.id_ve,
      phi_doi: phiDoi,
      chenh_lech_gia: chenhLech,
      tong_phai_tra: tongPhaitra,
      trang_thai: 'da_doi',
      thoi_gian_doi: fmtDt(new Date()),
    }, { transaction: t })

    await veCu.update({ trang_thai: 'da_doi' }, { transaction: t })

    await TamGiuGhe.update(
      { trang_thai: 'da_giai_phong' },
      {
        where: {
          id_chuyen: veCu.id_chuyen, so_toa_thu_tu: veCu.so_toa_thu_tu,
          so_ghe_trong_toa: veCu.so_ghe_trong_toa, id_don_dat_ve: veCu.id_don_dat_ve,
          trang_thai: 'da_dat',
        },
        transaction: t,
      }
    )

    const now = new Date()
    const hetHan = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    await TamGiuGhe.create({
      id_chuyen: newTicketData.idChuyen,
      so_toa_thu_tu: newTicketData.soToa,
      so_ghe_trong_toa: newTicketData.soGhe,
      id_don_dat_ve: veCu.id_don_dat_ve,
      trang_thai: tongPhaitra > 0 ? 'dang_giu' : 'da_dat',
      thoi_gian_giu: fmtVN(now),
      thoi_gian_het_han: fmtVN(hetHan),
    }, { transaction: t })

    let idThanhToan = null
    let qrUrl = null
    if (tongPhaitra > 0) {
      const don = await DonDatVe.findByPk(veCu.id_don_dat_ve, { transaction: t })
      const maGD = genTransactionCode()
      qrUrl = `https://img.vietqr.io/image/BIDV-9630630005144911-compact2.png?amount=${tongPhaitra}&addInfo=${encodeURIComponent(don.ma_don)}&accountName=KLN%20TRAIN`
      const payRes = await serviceClient.post('payment', '/internal/payments', {
        maGiaoDich: maGD,
        idDonDatVe: veCu.id_don_dat_ve,
        phuongThuc: 'the_ngan_hang',
        soTien: tongPhaitra,
        paymentGateway: 'vietqr',
      }).catch(() => null)
      idThanhToan = payRes?.data?.id_thanh_toan || null
      if (idThanhToan) await doi.update({ id_thanh_toan: idThanhToan }, { transaction: t })
    }

    return { doi, veMoi, veCu, phiDoi, chenhLech, tongPhaitra, idThanhToan, qrUrl, idDon: veCu.id_don_dat_ve }
  })

  // GheChang (railway) — ngoài transaction local, best-effort.
  await RailwaySeat.freeByVeId(idVeCu).catch(() => {})
  if (newTicketData.idGaLen && newTicketData.idGaXuong) {
    await RailwaySeat.ensureGheChuyen(newTicketData.idChuyen).catch(() => {})
    await RailwaySeat.linkVe({
      idChuyen: newTicketData.idChuyen,
      soToaThuTu: newTicketData.soToa,
      soGheTrongToa: newTicketData.soGhe,
      idVe: result.veMoi.id_ve,
      idGaLen: newTicketData.idGaLen,
      idGaXuong: newTicketData.idGaXuong,
      sessionId: null,
    }).catch(() => {})
  }

  return result
}

module.exports = { checkExchangeable, exchangeTicket }
