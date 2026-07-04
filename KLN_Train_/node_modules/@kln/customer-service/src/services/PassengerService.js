const PassengerRepo = require('../repositories/PassengerRepository')

// Tìm hoặc tạo hành khách — dùng bởi booking-service khi tạo đơn đặt vé
// (port từ đoạn "Tìm hoặc tạo HanhKhach" trong BookingService.createBooking cũ).
const findOrCreate = async ({ id_tai_khoan, ho_ten, ngay_sinh, cccd, loai_hanh_khach, so_dien_thoai, la_chinh }) => {
  let hk = await PassengerRepo.findByHoTenNgaySinh(ho_ten, ngay_sinh)
  if (!hk) {
    hk = await PassengerRepo.create({
      id_tai_khoan: id_tai_khoan || null,
      ho_ten,
      ngay_sinh,
      cccd: cccd || null,
      loai_hanh_khach,
      so_dien_thoai: so_dien_thoai || null,
      la_chinh: !!la_chinh,
    })
  }
  return hk
}

const getById = (id) => PassengerRepo.findById(id)
const getByTaiKhoan = (id_tai_khoan) => PassengerRepo.findByTaiKhoan(id_tai_khoan)

module.exports = { findOrCreate, getById, getByTaiKhoan }
