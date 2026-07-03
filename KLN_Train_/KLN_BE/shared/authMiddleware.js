const jwt = require('jsonwebtoken')
const { unauthorized, forbidden } = require('./response')

// JWT phát ra bởi auth-service có 2 hình dạng payload khác nhau tùy endpoint
// đăng nhập (giữ nguyên như backend cũ, để không phải sửa localStorage/redirect
// logic của 3 frontend):
//   - /api/auth/login          → { id, email, role }
//   - /api/admin/auth/login    → { id_tai_khoan, email, vai_tro }
// normalizeUser() gắn thêm 2 field chung (userId, role) để middleware/route
// nào cũng dùng được mà không cần quan tâm token đến từ luồng nào.
const normalizeUser = (decoded) => ({
  ...decoded,
  userId: decoded.id ?? decoded.id_tai_khoan,
  role: decoded.role ?? decoded.vai_tro,
})

const authenticate = (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer '))
    return unauthorized(res, 'Vui lòng đăng nhập')

  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    req.user = normalizeUser(decoded)
    next()
  } catch {
    return unauthorized(res, 'Token không hợp lệ hoặc đã hết hạn')
  }
}

const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = normalizeUser(jwt.verify(header.slice(7), process.env.JWT_SECRET))
    } catch {}
  }
  next()
}

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role))
    return forbidden(res, 'Không có quyền truy cập')
  next()
}

const requireAdmin = requireRole('quan_tri')

module.exports = { authenticate, optionalAuth, requireRole, requireAdmin }
