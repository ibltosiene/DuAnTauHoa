const { sequelize } = require('../config/database')

const GaTau = require('./GaTau')
const Tau = require('./Tau')
const LoaiToa = require('./LoaiToa')
const LoaiGhe = require('./LoaiGhe')
const CauHinhToa = require('./CauHinhToa')
const CauHinhGhe = require('./CauHinhGhe')
const LichChay = require('./LichChay')
const LichTrinhChuyen = require('./LichTrinhChuyen')
const ChuyenTau = require('./ChuyenTau')
const ToaChuyen = require('./ToaChuyen')
const GheChuyen = require('./GheChuyen')
const GheChang = require('./GheChang')
const DieuPhoi = require('./DieuPhoi')
const LichTrinhThucTe = require('./LichTrinhThucTe')
const BieuGia = require('./BieuGia')

// Tau → CauHinhToa → LoaiToa
Tau.hasMany(CauHinhToa, { foreignKey: 'id_tau' })
CauHinhToa.belongsTo(Tau, { foreignKey: 'id_tau' })
CauHinhToa.belongsTo(LoaiToa, { foreignKey: 'id_loai_toa' })
LoaiToa.hasMany(CauHinhToa, { foreignKey: 'id_loai_toa' })

// LoaiToa → LoaiGhe → CauHinhGhe
LoaiToa.hasMany(LoaiGhe, { foreignKey: 'id_loai_toa' })
LoaiGhe.belongsTo(LoaiToa, { foreignKey: 'id_loai_toa' })
LoaiToa.hasMany(CauHinhGhe, { foreignKey: 'id_loai_toa' })
CauHinhGhe.belongsTo(LoaiToa, { foreignKey: 'id_loai_toa' })
CauHinhGhe.belongsTo(LoaiGhe, { foreignKey: 'id_loai_ghe' })

// LichChay
Tau.hasMany(LichChay, { foreignKey: 'id_tau' })
LichChay.belongsTo(Tau, { foreignKey: 'id_tau' })
GaTau.hasMany(LichChay, { foreignKey: 'id_ga_di', as: 'GaDi' })
GaTau.hasMany(LichChay, { foreignKey: 'id_ga_den', as: 'GaDen' })
LichChay.belongsTo(GaTau, { foreignKey: 'id_ga_di', as: 'GaDi' })
LichChay.belongsTo(GaTau, { foreignKey: 'id_ga_den', as: 'GaDen' })
LichChay.hasMany(LichTrinhChuyen, { foreignKey: 'id_lich_chay' })
LichTrinhChuyen.belongsTo(LichChay, { foreignKey: 'id_lich_chay' })
LichTrinhChuyen.belongsTo(GaTau, { foreignKey: 'id_ga' })

// ChuyenTau
LichChay.hasMany(ChuyenTau, { foreignKey: 'id_lich_chay' })
ChuyenTau.belongsTo(LichChay, { foreignKey: 'id_lich_chay' })

// ToaChuyen
ChuyenTau.hasMany(ToaChuyen, { foreignKey: 'id_chuyen' })
ToaChuyen.belongsTo(ChuyenTau, { foreignKey: 'id_chuyen' })
ToaChuyen.belongsTo(LoaiToa, { foreignKey: 'id_loai_toa' })
LoaiToa.hasMany(ToaChuyen, { foreignKey: 'id_loai_toa' })

// DieuPhoi + LichTrinhThucTe
ChuyenTau.hasMany(DieuPhoi, { foreignKey: 'id_chuyen' })
DieuPhoi.belongsTo(ChuyenTau, { foreignKey: 'id_chuyen' })
DieuPhoi.belongsTo(GaTau, { foreignKey: 'id_ga_anh_huong', as: 'GaAnhHuong' })
ChuyenTau.hasMany(LichTrinhThucTe, { foreignKey: 'id_chuyen' })
LichTrinhThucTe.belongsTo(ChuyenTau, { foreignKey: 'id_chuyen' })
LichTrinhThucTe.belongsTo(GaTau, { foreignKey: 'id_ga' })

// GheChuyen + GheChang
ChuyenTau.hasMany(GheChuyen, { foreignKey: 'id_chuyen' })
GheChuyen.belongsTo(ChuyenTau, { foreignKey: 'id_chuyen' })
GheChuyen.belongsTo(LoaiGhe, { foreignKey: 'id_loai_ghe' })
GheChuyen.hasMany(GheChang, { foreignKey: 'id_ghe_chuyen' })
GheChang.belongsTo(GheChuyen, { foreignKey: 'id_ghe_chuyen' })

// BieuGia
BieuGia.belongsTo(LoaiGhe, { foreignKey: 'id_loai_ghe' })

module.exports = {
  sequelize,
  GaTau, Tau, LoaiToa, LoaiGhe, CauHinhToa, CauHinhGhe,
  LichChay, LichTrinhChuyen, ChuyenTau, ToaChuyen,
  GheChuyen, GheChang, DieuPhoi, LichTrinhThucTe, BieuGia,
}
