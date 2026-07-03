// Bảo vệ các route /internal/* — chỉ service khác (qua serviceClient) mới gọi
// được, không đi qua Gateway, không dùng JWT người dùng.
const requireInternalKey = (req, res, next) => {
  const key = req.headers['x-internal-key']
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ success: false, message: 'Forbidden: internal endpoint' })
  }
  next()
}

module.exports = { requireInternalKey }
