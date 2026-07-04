const { sequelize } = require('../config/database')

// Sở hữu (ghi được)
const DonDatVe = require('./DonDatVe')
const Ve = require('./Ve')
const DonKhuHoi = require('./DonKhuHoi')
const TamGiuGhe = require('./TamGiuGhe')
const DoiVe = require('./DoiVe')
const ChinhSachGia = require('./ChinhSachGia')
const ChinhSachHuy = require('./ChinhSachHuy')
const KhuyenMai = require('./KhuyenMai')

// Tham chiếu READ-ONLY (thuộc railway/customer/payment service khác)
const GaTau = require('./ref/GaTau')
const Tau = require('./ref/Tau')
const LichChay = require('./ref/LichChay')
const ChuyenTau = require('./ref/ChuyenTau')
const HanhKhach = require('./ref/HanhKhach')
const ThanhToan = require('./ref/ThanhToan')

// ─── Associations (chỉ để phục vụ include/eager-load, không ràng buộc FK
// thật giữa các service — foreignKey vẫn khớp cột DB sẵn có) ──────────────

DonDatVe.hasMany(Ve, { foreignKey: 'id_don_dat_ve' })
Ve.belongsTo(DonDatVe, { foreignKey: 'id_don_dat_ve' })
DonDatVe.hasMany(TamGiuGhe, { foreignKey: 'id_don_dat_ve' })
DonDatVe.belongsTo(KhuyenMai, { foreignKey: 'id_khuyen_mai' })
DonDatVe.hasMany(ThanhToan, { foreignKey: 'id_don_dat_ve' })
ThanhToan.belongsTo(DonDatVe, { foreignKey: 'id_don_dat_ve' })

Ve.belongsTo(HanhKhach, { foreignKey: 'id_hanh_khach' })
Ve.belongsTo(ChuyenTau, { foreignKey: 'id_chuyen' })
Ve.belongsTo(GaTau, { foreignKey: 'id_ga_len', as: 'GaLen' })
Ve.belongsTo(GaTau, { foreignKey: 'id_ga_xuong', as: 'GaXuong' })

ChuyenTau.belongsTo(LichChay, { foreignKey: 'id_lich_chay' })
LichChay.belongsTo(Tau, { foreignKey: 'id_tau' })
LichChay.belongsTo(GaTau, { foreignKey: 'id_ga_di', as: 'GaDi' })
LichChay.belongsTo(GaTau, { foreignKey: 'id_ga_den', as: 'GaDen' })

DoiVe.belongsTo(Ve, { foreignKey: 'id_ve_cu', as: 'VeCu' })
DoiVe.belongsTo(Ve, { foreignKey: 'id_ve_moi', as: 'VeMoi' })

DonKhuHoi.belongsTo(DonDatVe, { foreignKey: 'id_don_di', as: 'DonDi' })
DonKhuHoi.belongsTo(DonDatVe, { foreignKey: 'id_don_ve', as: 'DonVe' })

module.exports = {
  sequelize,
  DonDatVe, Ve, DonKhuHoi, TamGiuGhe, DoiVe, ChinhSachGia, ChinhSachHuy, KhuyenMai,
  GaTau, Tau, LichChay, ChuyenTau, HanhKhach, ThanhToan,
}
