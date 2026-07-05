const { sequelize } = require('../config/database')
const { DonDatVe, ThanhToan, HoaDon } = require('../models')
const { serviceClient } = require('@kln/shared')

const fmtDt = (d) => sequelize.literal(`'${new Date(d).toISOString().replace('T', ' ').slice(0, 23)}'`)
const { genTransactionCode, genInvoiceNumber } = require('../utils/helpers')

// Map phuong_thuc frontend → giá trị CHECK constraint DB
const mapPhuongThuc = (pt) => {
  if (pt === 'qr_bank' || pt === 'chuyen_khoan') return 'the_ngan_hang'
  const valid = ['tien_mat', 'the_ngan_hang', 'zalopay', 'momo', 'vnpay']
  return valid.includes(pt) ? pt : 'the_ngan_hang'
}

const mapGateway = (pt) => {
  const map = { zalopay: 'zalopay', momo: 'momo', vnpay: 'vnpay', the_ngan_hang: 'vietqr', qr_bank: 'vietqr', chuyen_khoan: 'vietqr' }
  return map[pt] || null
}

// Phí phụ thu theo phương thức thanh toán (đồng bộ với frontend PaymentMethod.jsx)
const tinhPhiThanhToan = () => 0

const buildQrUrl = (amount, maDon) =>
  `https://img.vietqr.io/image/BIDV-9630630005144911-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(maDon)}&accountName=KLN%20TRAIN`

// Tạo giao dịch thanh toán
const createPayment = async (idDonDatVe, phuongThuc = 'the_ngan_hang') => {
  const don = await DonDatVe.findByPk(idDonDatVe)
  if (!don) throw { status: 404, message: 'Không tìm thấy đơn đặt vé' }
  if (don.trang_thai !== 'cho_thanh_toan')
    throw { status: 400, message: 'Đơn đặt vé không ở trạng thái chờ thanh toán' }
  if (Date.now() > new Date(don.thoi_gian_het_han).getTime())
    throw { status: 400, message: 'Đơn đặt vé đã hết thời gian thanh toán' }

  const maGD = genTransactionCode()
  const pt = mapPhuongThuc(phuongThuc)
  const phi = tinhPhiThanhToan(phuongThuc)
  const soTien = parseFloat(don.tien_thanh_toan) + phi
  const qrUrl = buildQrUrl(soTien, don.ma_don)

  const tt = await ThanhToan.create({
    ma_giao_dich: maGD,
    id_don_dat_ve: idDonDatVe,
    phuong_thuc: pt,
    so_tien: soTien,
    trang_thai: 'dang_xu_ly',
    payment_gateway: mapGateway(phuongThuc),
    so_lan_thu: 1,
    thoi_gian_tao: fmtDt(new Date()),
    thoi_gian_het_han: fmtDt(don.thoi_gian_het_han),
  })

  return { idThanhToan: tt.id_thanh_toan, maGiaoDich: maGD, qrUrl, soTien, phi, maDon: don.ma_don }
}

// Tạo 1 giao dịch nội bộ (dùng bởi booking-service khi thu phí chênh lệch đổi vé)
const createInternalPayment = async ({ maGiaoDich, idDonDatVe, phuongThuc, soTien, paymentGateway }) => {
  const tt = await ThanhToan.create({
    ma_giao_dich: maGiaoDich || genTransactionCode(),
    id_don_dat_ve: idDonDatVe,
    phuong_thuc: mapPhuongThuc(phuongThuc),
    so_tien: soTien,
    trang_thai: 'dang_xu_ly',
    payment_gateway: paymentGateway || null,
    so_lan_thu: 1,
    thoi_gian_tao: fmtDt(new Date()),
  })
  return tt
}

// Xác nhận thanh toán thành công — Payment ghi ThanhToan+HoaDon (local),
// rồi báo booking-service cập nhật DonDatVe/Ve/TamGiuGhe + chốt GheChang.
const confirmPayment = async (idThanhToan) => {
  const { tt, isFirstTime } = await sequelize.transaction(async (t) => {
    const tt = await ThanhToan.findByPk(idThanhToan, { transaction: t })
    if (!tt) throw { status: 404, message: 'Không tìm thấy giao dịch' }
    if (tt.trang_thai === 'thanh_cong') return { tt, isFirstTime: false }

    await tt.update({ trang_thai: 'thanh_cong', thoi_gian_thanh_toan: fmtDt(new Date()) }, { transaction: t })
    return { tt, isFirstTime: true }
  })

  if (!isFirstTime) {
  const don = await DonDatVe.findByPk(tt.id_don_dat_ve)
  const hd = await HoaDon.findOne({ where: { id_don_dat_ve: tt.id_don_dat_ve }, order: [['id_hoa_don', 'DESC']] })
  const orderDetail = await serviceClient.get('booking', `/internal/orders/${tt.id_don_dat_ve}/ve-details`)
  return {
    message: 'Đã xác nhận trước đó',
    soHoaDon: hd?.so_hoa_don,
    maDatCho: don?.ma_dat_cho,
    idDon: don?.id_don_dat_ve,
    tongThanhToan: parseFloat(tt.so_tien),
    veList: orderDetail.data.veList || [],
  }
}

  const don = await DonDatVe.findByPk(tt.id_don_dat_ve)
  if (!don) throw { status: 404, message: 'Không tìm thấy đơn đặt vé' }

  // Báo booking-service cập nhật Ve/DonDatVe/TamGiuGhe + chốt GheChang (railway).
  // Đây là bước quan trọng nên KHÔNG catch-and-ignore — nếu lỗi, trả lỗi rõ ràng
  // (khách đã thanh toán, cần vận hành xử lý thủ công) thay vì âm thầm bỏ qua.
  const orderResult = await serviceClient.post('booking', `/internal/orders/${tt.id_don_dat_ve}/mark-paid`, {})

  const soHD = genInvoiceNumber()
  const hd = await HoaDon.create({
    so_hoa_don: soHD,
    id_don_dat_ve: don.id_don_dat_ve,
    id_thanh_toan: tt.id_thanh_toan,
    ho_ten_khach: don.ho_ten_lien_lac,
    email_khach: don.email_dat_cho,
    tong_tien_truoc_giam: don.tong_tien,
    tien_giam: don.tien_giam,
    tong_tien_thanh_toan: tt.so_tien,
    ngay_xuat: fmtDt(new Date()),
    da_gui_email: false,
  })

  // Thông báo khách hàng (best-effort, notification-service).
  await serviceClient.post('notification', '/internal/notify', {
    idTaiKhoan: don.id_tai_khoan,
    tieuDe: 'Thanh toán thành công',
    noiDung: `Đơn hàng ${don.ma_don} đã thanh toán thành công. Mã đặt chỗ: ${don.ma_dat_cho}.`,
    loai: 'dat_ve',
    lienKet: '/tra-cuu-don',
  }).catch(() => {})

  // Gửi email xác nhận đặt vé (best-effort).
  await serviceClient.post('notification', '/internal/send-booking-email', {
    email: don.email_dat_cho,
    hoTen: don.ho_ten_lien_lac,
    maDon: don.ma_don,
    maDatCho: orderResult.data.maDatCho,
    tongThanhToan: parseFloat(tt.so_tien),
    soHoaDon: hd.so_hoa_don,
    veList: orderResult.data.veList || [],
  }).catch(() => {})
  
  return {
    soHoaDon: hd.so_hoa_don,
    maDatCho: orderResult.data.maDatCho,
    idDon: don.id_don_dat_ve,
    tongThanhToan: parseFloat(tt.so_tien),
    veList: orderResult.data.veList,
  }
}

const getPaymentStatus = async (idThanhToan) => {
  const tt = await ThanhToan.findByPk(idThanhToan, {
    include: [{ model: DonDatVe, attributes: ['ma_dat_cho', 'ma_don', 'trang_thai', 'id_don_dat_ve'] }],
  })
  if (!tt) throw { status: 404, message: 'Không tìm thấy giao dịch' }
  return tt
}

// Xử lý webhook SePay / ngân hàng
const processWebhook = async (body) => {
  const content = String(body.content || body.description || body.addInfo || '').toUpperCase()
  const match = content.match(/KLN\d{6}/)
  if (!match) return null

  const maDon = match[0]
  const soTien = parseFloat(body.transferAmount || body.amount || 0)

  const don = await DonDatVe.findOne({ where: { ma_don: maDon } })
  if (!don || don.trang_thai !== 'cho_thanh_toan') return null

  const tt = await ThanhToan.findOne({
    where: { id_don_dat_ve: don.id_don_dat_ve, trang_thai: 'dang_xu_ly' },
    order: [['id_thanh_toan', 'DESC']],
  })
  if (!tt) return null

  if (soTien > 0 && Math.abs(soTien - parseFloat(tt.so_tien)) > 2000) return null

  return confirmPayment(tt.id_thanh_toan)
}

// Dùng trong môi trường phát triển/kiểm thử — không dùng trên production.
const devConfirmByMaDon = async (maDon) => {
  const don = await DonDatVe.findOne({ where: { ma_don: maDon.toUpperCase() } })
  if (!don) throw { status: 400, message: 'Không tìm thấy đơn' }

  const tt = await ThanhToan.findOne({
    where: { id_don_dat_ve: don.id_don_dat_ve, trang_thai: 'dang_xu_ly' },
    order: [['id_thanh_toan', 'DESC']],
  })
  if (!tt) throw { status: 400, message: 'Không tìm thấy giao dịch đang xử lý' }

  return confirmPayment(tt.id_thanh_toan)
}

module.exports = { createPayment, createInternalPayment, confirmPayment, getPaymentStatus, processWebhook, buildQrUrl, devConfirmByMaDon }
