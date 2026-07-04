const { error } = require('./response')

const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message || err)

  if (err.status && err.message) {
    return res.status(err.status).json({ success: false, message: err.message })
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ success: false, message: 'Dữ liệu đã tồn tại', errors: err.errors?.map(e => e.message) })
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: err.errors?.map(e => e.message) })
  }

  return error(res, 'Lỗi máy chủ nội bộ', 500)
}

const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Không tìm thấy route: ${req.method} ${req.path}` })
}

module.exports = { errorHandler, notFoundHandler }
