const router = require('express').Router()
const { requireInternalKey, response: { ok, notFound } } = require('@kln/shared')
const { DonDatVe, Ve, TamGiuGhe, sequelize, HanhKhach, GaTau, ChuyenTau, LichChay } = require('../models')
const RailwaySeat = require('../services/RailwaySeatClient')

const parseTime = (t) => {
  if (!t) return ''
  if (t instanceof Date) {
    return t.getUTCHours().toString().padStart(2, '0') 
      + ':' + t.getUTCMinutes().toString().padStart(2, '0')
  }
  const s = String(t)
  const m = s.match(/(\d{2}:\d{2})/)
  return m ? m[1] : ''
}
// Gọi bởi payment-service khi xác nhận thanh toán thành công.
router.use(requireInternalKey)

router.post('/:idDon/mark-paid', async (req, res, next) => {
  try {
    const idDon = parseInt(req.params.idDon)
    const don = await DonDatVe.findByPk(idDon)
    if (!don) return notFound(res, 'Không tìm thấy đơn đặt vé')

    const veList = await sequelize.transaction(async (t) => {
      await don.update({ trang_thai: 'da_thanh_toan' }, { transaction: t })
      await Ve.update(
        { trang_thai: 'da_xac_nhan' },
        { where: { id_don_dat_ve: idDon, trang_thai: 'cho_xac_nhan' }, transaction: t }
      )
      await TamGiuGhe.update(
        { trang_thai: 'da_dat' },
        { where: { id_don_dat_ve: idDon, trang_thai: 'dang_giu' }, transaction: t }
      )
      return Ve.findAll({
        where: { id_don_dat_ve: idDon },
        attributes: ['id_ve', 'ma_ve','id_chuyen', 'so_toa_thu_tu', 'so_ghe_trong_toa', 'gia_ve', 'loai_hanh_khach'],
         include: [
          { model: HanhKhach, attributes: ['ho_ten'] },
          { model: GaTau, as: 'GaLen', attributes: ['ten_ga'] },
          { model: GaTau, as: 'GaXuong', attributes: ['ten_ga'] },
          { model: ChuyenTau, attributes: ['ngay_chay'], include: [
            { model: LichChay, attributes: ['gio_khoi_hanh'] },
          ]},
        ],
        transaction: t,
      })
    })

    await RailwaySeat.confirmByVeIds(veList.map(v => v.id_ve)).catch(() => {})

    ok(res, {
      idDon,
      maDatCho: don.ma_dat_cho,
      hoTenLienLac: don.ho_ten_lien_lac,
      emailDatCho: don.email_dat_cho,
      tongTien: don.tong_tien,
      tienGiam: don.tien_giam,
      veList: veList.map(v => ({
        idVe: v.id_ve,                    // ← thêm
        idChuyen: v.id_chuyen,
        maVe: v.ma_ve, 
        hanhKhach: v.HanhKhach?.ho_ten || '',
        gaDi: v.GaLen?.ten_ga || '',
        gaDen: v.GaXuong?.ten_ga || '',
        soToa: v.so_toa_thu_tu,
        soGhe: v.so_ghe_trong_toa,
        giaVe: parseFloat(v.gia_ve),
        ngayChay: v.ChuyenTau?.ngay_chay || '',
        gioKhoiHanh: parseTime(v.ChuyenTau?.LichChay?.gio_khoi_hanh),
      })),
    })
  } catch (err) { next(err) }
})

router.get('/:idDon', async (req, res, next) => {
  try {
    const don = await DonDatVe.findByPk(req.params.idDon)
    if (!don) return notFound(res, 'Không tìm thấy đơn đặt vé')
    ok(res, don)
  } catch (err) { next(err) }
})

module.exports = router
