const { createSequelize } = require('@kln/shared')

// Report Service chỉ ĐỌC (không định nghĩa model sở hữu nào) — tổng hợp
// dữ liệu qua raw SQL trên toàn bộ CSDL dùng chung, đúng vai trò
// "Đọc dữ liệu. Không ghi." đã mô tả trong kiến trúc.
module.exports = createSequelize()
