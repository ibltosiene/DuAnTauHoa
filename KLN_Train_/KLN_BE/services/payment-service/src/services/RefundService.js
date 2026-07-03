const { sequelize } = require('../config/database')
const RefundRepository = require('../repositories/RefundRepository')
const { HoanTien, ThanhToan } = require('../models')

// Tránh lỗi "Conversion failed when converting date and/or time from
// character string" của driver mssql khi để Sequelize tự convert Date qua
// defaultValue — cùng cách khắc phục đã dùng trong BookingRepository cũ.
const fmtDt = (d) => sequelize.literal(`'${new Date(d).toISOString().replace('T', ' ').slice(0, 23)}'`)

const getAllRefunds = () => RefundRepository.getAll()
const confirmRefund = (id) => RefundRepository.confirm(id)
const rejectRefund = (id) => RefundRepository.reject(id)
const getRefundStats = () => RefundRepository.getStats()
const getRefundById = (id) => RefundRepository.getById(id)

// Tạo yêu cầu hoàn tiền — gọi bởi booking-service khi hủy vé (CancelService).
// Tự tra ThanhToan thành công gần nhất của đơn (HoanTien yêu cầu id_thanh_toan).
const createRefund = async ({ idVe, idDonDatVe, tienGoc, phiHuy, tienHoan, lyDo }) => {
  const tt = await ThanhToan.findOne({
    where: { id_don_dat_ve: idDonDatVe, trang_thai: 'thanh_cong' },
    order: [['id_thanh_toan', 'DESC']],
  })
  if (!tt) return null // Đơn chưa từng thanh toán thành công — không có gì để hoàn

  return HoanTien.create({
    id_ve: idVe,
    id_thanh_toan: tt.id_thanh_toan,
    tien_goc: tienGoc,
    phi_huy: phiHuy,
    tien_hoan: tienHoan,
    ly_do: lyDo,
    trang_thai_hoan: 'dang_xu_ly',
    thoi_gian_hoan: fmtDt(new Date()),
  })
}

module.exports = { getAllRefunds, getRefundById, confirmRefund, rejectRefund, getRefundStats, createRefund }
