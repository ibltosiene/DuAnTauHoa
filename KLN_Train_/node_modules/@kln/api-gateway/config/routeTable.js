// Bảng định tuyến Gateway. THỨ TỰ QUAN TRỌNG: prefix cụ thể hơn phải đứng trước
// prefix tổng quát hơn (Express match theo thứ tự đăng ký app.use, không tự sắp
// xếp theo độ dài path). Giữ nguyên path hiện có của 3 frontend (KLN_FR).
const routeTable = [
  // --- Policies bị chẻ theo path con (BieuGia vs ChinhSachGia/Huy) ---
  { prefix: '/api/admin/policies/customer-discounts', service: 'booking' },
  { prefix: '/api/admin/policies/cancel-fees', service: 'booking' },
  { prefix: '/api/admin/policies/occasion-policies', service: 'railway' },
  { prefix: '/api/admin/policies/base-price', service: 'railway' },
  { prefix: '/api/admin/policies/seat-factors', service: 'railway' },

  // --- Auth Service ---
  // audit-logs đọc bảng AuditLog (thuộc Notification Service) nên tách riêng
  // khỏi phần còn lại của /api/admin/users (TaiKhoan, thuộc Auth Service).
  { prefix: '/api/admin/users/audit-logs', service: 'notification' },
  { prefix: '/api/admin/auth', service: 'auth' },
  { prefix: '/api/admin/users', service: 'auth' },
  { prefix: '/api/auth', service: 'auth' },

  // --- Railway Operation Service ---
  { prefix: '/api/admin/stations', service: 'railway' },
  { prefix: '/api/admin/trains', service: 'railway' },
  { prefix: '/api/admin/carriages', service: 'railway' },
  { prefix: '/api/admin/schedules', service: 'railway' },
  { prefix: '/api/admin/seats', service: 'railway' },
  { prefix: '/api/trains', service: 'railway' },
  { prefix: '/api/dispatch', service: 'railway' },

  // --- Booking Service ---
  { prefix: '/api/admin/tickets', service: 'booking' },
  { prefix: '/api/admin/coupons', service: 'booking' },
  { prefix: '/api/bookings', service: 'booking' },
  { prefix: '/api/cancel', service: 'booking' },
  { prefix: '/api/exchange', service: 'booking' },

  // --- Payment Service ---
  { prefix: '/api/admin/refunds', service: 'payment' },
  { prefix: '/api/payments', service: 'payment' },

  // --- Customer Service (HanhKhach/PhanHoi only) ---
  { prefix: '/api/admin/customers', service: 'auth' },
  // Ghi chú: màn "Khách hàng" của FR_Admin thao tác trên bảng TaiKhoan (lọc
  // vai_tro='khach_hang') + thống kê Ve — bản chất là CRUD tài khoản, nên
  // thuộc Auth Service (chủ sở hữu TaiKhoan), KHÔNG phải Customer Service
  // (chỉ quản lý HanhKhach/PhanHoi — hành khách đi cùng & phản hồi).

  // --- Notification Service ---
  { prefix: '/api/admin/notifications', service: 'notification' },
  { prefix: '/api/notifications', service: 'notification' },

  // --- Report Service ---
  { prefix: '/api/admin/dashboard', service: 'dashboard' },
  { prefix: '/api/admin/reports', service: 'report' },
]

module.exports = { routeTable }
