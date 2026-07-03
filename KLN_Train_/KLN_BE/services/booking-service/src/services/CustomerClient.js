const { serviceClient } = require('@kln/shared')

// Tìm/tạo hành khách qua customer-service — Booking không tự ghi bảng
// HanhKhach (thuộc Customer Service), chỉ lưu id_hanh_khach trả về vào Ve.
const findOrCreatePassenger = async (data) => {
  const res = await serviceClient.post('customer', '/internal/passengers/find-or-create', data)
  return res.data
}

module.exports = { findOrCreatePassenger }
