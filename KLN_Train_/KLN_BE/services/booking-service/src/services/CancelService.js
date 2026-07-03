const { sequelize } = require('../config/database')
const { Op } = require('sequelize')
const fmtDt = (d) => sequelize.literal(`'${new Date(d).toISOString().replace('T', ' ').slice(0, 23)}'`)

const toDateStr = (v) => {
  if (!v) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  const m = String(v).match(/(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : String(v).slice(0, 10)
}
const toTimeStr = (v) => {
  if (!v) return '00:00:00'
  if (v instanceof Date) return `${String(v.getUTCHours()).padStart(2, '0')}:${String(v.getUTCMinutes()).padStart(2, '0')}:00`
  const s = String(v)
  const iso = s.match(/T(\d{2}:\d{2}:\d{2})/)
  if (iso) return iso[1]
  if (/^\d{2}:\d{2}/.test(s)) return s.slice(0, 8)
  return '00:00:00'
}

const { DonDatVe, Ve, ChinhSachHuy, ChuyenTau, LichChay, TamGiuGhe } = require('../models')
const RailwaySeat = require('../services/RailwaySeatClient')
const { serviceClient } = require('@kln/shared')

// Tính phí hủy vé theo chính sách trong DB
const tinhPhiHuy = async (idVe) => {
  const ve = await Ve.findByPk(idVe, {
    include: [{ model: ChuyenTau, include: [{ model: LichChay, attributes: ['gio_khoi_hanh'] }] }],
  })
  if (!ve) throw { status: 404, message: 'Không tìm thấy vé' }

  const chuyen = ve.ChuyenTau
  const ngayChay = toDateStr(chuyen.ngay_chay)
  const gioChay = toTimeStr(chuyen.LichChay.gio_khoi_hanh)
  const departAt = new Date(`${ngayChay}T${gioChay}+07:00`)
  const gioConLai = (departAt.getTime() - Date.now()) / (1000 * 60 * 60)

  const csHuy = await ChinhSachHuy.findOne({
    where: { gio_truoc_gio_chay: { [Op.lte]: gioConLai } },
    order: [['gio_truoc_gio_chay', 'DESC'], ['id_cs_huy', 'ASC']],
  })

  const canCancel = gioConLai >= 4
  const phiHuyPct = csHuy ? parseFloat(csHuy.phi_huy) : 100
  const giaVe = parseFloat(ve.gia_ve)
  const phiHuy = Math.floor(giaVe * phiHuyPct / 100)
  const tienHoan = giaVe - phiHuy

  return {
    idVe, giaVe, phiHuyPct, phiHuy, tienHoan,
    gioConLai: Math.max(0, gioConLai),
    canCancel,
    idCsHuy: csHuy?.id_cs_huy || null,
  }
}

// Hủy vé (một hoặc nhiều vé trong đơn)
const cancelTickets = async (maDatCho, idVeList, lyDo = '') => {
  const result = await sequelize.transaction(async (t) => {
    const don = await DonDatVe.findOne({
      where: { ma_dat_cho: maDatCho },
      include: [{ model: Ve, where: { id_ve: { [Op.in]: idVeList } } }],
      transaction: t,
    })
    if (!don) throw { status: 404, message: 'Không tìm thấy đơn đặt vé' }
    if (!['da_thanh_toan', 'da_xac_nhan'].includes(don.trang_thai))
      throw { status: 400, message: 'Chỉ có thể hủy vé đã thanh toán' }

    const cancelledVe = []
    for (const ve of don.Ves) {
      const phiInfo = await tinhPhiHuy(ve.id_ve)
      if (!phiInfo.canCancel) throw { status: 400, message: `Vé #${ve.id_ve} không thể hủy (tàu đã khởi hành hoặc dưới 4 giờ)` }

      await ve.update({ trang_thai: 'da_huy', id_cs_huy: phiInfo.idCsHuy }, { transaction: t })

      await TamGiuGhe.update(
        { trang_thai: 'da_giai_phong' },
        {
          where: {
            id_chuyen: ve.id_chuyen, so_toa_thu_tu: ve.so_toa_thu_tu,
            so_ghe_trong_toa: ve.so_ghe_trong_toa, id_don_dat_ve: ve.id_don_dat_ve,
            trang_thai: 'da_dat',
          },
          transaction: t,
        }
      )

      cancelledVe.push({ ve, phiInfo })
    }

    const allVe = await Ve.findAll({ where: { id_don_dat_ve: don.id_don_dat_ve }, transaction: t })
    const allHuy = allVe.every(v => v.trang_thai === 'da_huy')
    if (allHuy) await don.update({ trang_thai: 'da_huy' }, { transaction: t })

    return { don, cancelledVe }
  })

  // Giải phóng GheChang (railway) — best-effort, ngoài transaction local.
  for (const { ve } of result.cancelledVe) {
    await RailwaySeat.freeByVeId(ve.id_ve).catch(() => {})
  }

  // Tạo HoanTien (payment-service) — best-effort qua internal API.
  let tongTienHoan = 0
  for (const { ve, phiInfo } of result.cancelledVe) {
    tongTienHoan += phiInfo.tienHoan
    await serviceClient.post('payment', '/internal/refunds', {
      idVe: ve.id_ve,
      idDonDatVe: result.don.id_don_dat_ve,
      tienGoc: phiInfo.giaVe,
      phiHuy: phiInfo.phiHuy,
      tienHoan: phiInfo.tienHoan,
      lyDo: lyDo || 'Khách hàng hủy vé',
    }).catch(() => {})
  }

  return { tongTienHoan, soVeHuy: idVeList.length }
}

module.exports = { tinhPhiHuy, cancelTickets }
