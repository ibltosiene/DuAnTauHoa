const { sequelize } = require('../config/database')
const { TaiKhoan } = require('../models')

// "Khách hàng" (FR_Admin) = TaiKhoan lọc vai_tro='khach_hang', kèm thống kê
// Ve/DonDatVe (thuộc Booking Service) — đọc read-only qua raw SQL (ngoại lệ
// thực dụng dùng chung CSDL, giống railway-service đọc Ve để tính chỗ trống).

const getAll = () => sequelize.query(`
    SELECT tk.id_tai_khoan, tk.ho_ten, tk.email, tk.so_dien_thoai,
           tk.ngay_sinh, tk.gioi_tinh, tk.trang_thai, tk.ngay_tao,
           (SELECT COUNT(*) FROM Ve v JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
            WHERE d.id_tai_khoan = tk.id_tai_khoan) AS tong_ve,
           (SELECT ISNULL(SUM(v.gia_ve), 0) FROM Ve v JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
            WHERE d.id_tai_khoan = tk.id_tai_khoan) AS tong_tien
    FROM TaiKhoan tk
    WHERE tk.vai_tro = 'khach_hang'
    ORDER BY tk.ngay_tao DESC
  `, { type: sequelize.QueryTypes.SELECT })

const getById = async (id) => {
  const rows = await sequelize.query(`
    SELECT tk.id_tai_khoan, tk.ho_ten, tk.email, tk.so_dien_thoai,
           tk.ngay_sinh, tk.gioi_tinh, tk.trang_thai, tk.ngay_tao,
           (SELECT COUNT(*) FROM Ve v JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
            WHERE d.id_tai_khoan = tk.id_tai_khoan) AS tong_ve,
           (SELECT ISNULL(SUM(v.gia_ve), 0) FROM Ve v JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
            WHERE d.id_tai_khoan = tk.id_tai_khoan) AS tong_tien
    FROM TaiKhoan tk
    WHERE tk.id_tai_khoan = :id AND tk.vai_tro = 'khach_hang'
  `, { replacements: { id }, type: sequelize.QueryTypes.SELECT })
  return rows[0] || null
}

const getTickets = (id) => sequelize.query(`
    SELECT v.id_ve, t.so_hieu AS chuyen_tau, gd.ten_ga AS ga_len, gc.ten_ga AS ga_xuong,
           ct.ngay_chay, v.gia_ve, v.trang_thai
    FROM Ve v
    JOIN DonDatVe d ON d.id_don_dat_ve = v.id_don_dat_ve
    JOIN ChuyenTau ct ON ct.id_chuyen = v.id_chuyen
    JOIN LichChay lc ON lc.id_lich_chay = ct.id_lich_chay
    JOIN Tau t ON t.id_tau = lc.id_tau
    JOIN GaTau gd ON gd.id_ga = v.id_ga_len
    JOIN GaTau gc ON gc.id_ga = v.id_ga_xuong
    WHERE d.id_tai_khoan = :id
    ORDER BY ct.ngay_chay DESC
  `, { replacements: { id }, type: sequelize.QueryTypes.SELECT })

const update = (id, { ho_ten, so_dien_thoai, ngay_sinh, gioi_tinh, trang_thai }) =>
  TaiKhoan.update({ ho_ten, so_dien_thoai, ngay_sinh, gioi_tinh, trang_thai }, { where: { id_tai_khoan: id } })

const remove = (id) => TaiKhoan.destroy({ where: { id_tai_khoan: id } })

module.exports = { getAll, getById, getTickets, update, remove }
