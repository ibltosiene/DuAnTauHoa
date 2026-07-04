const router = require('express').Router()
const { authenticate } = require('@kln/shared')
const C = require('../controllers/dieuPhoiController')

// Mounted ở /api/dispatch — FR_Dispatcher.
const requireStaff = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' })
  const allowed = ['quan_tri', 'nhan_vien', 'dieu_phoi']
  if (!allowed.includes(req.user.role))
    return res.status(403).json({ success: false, message: 'Không có quyền điều phối viên' })
  next()
}

router.use(authenticate, requireStaff)

router.get('/dashboard', C.getDashboard)

router.get('/tau', C.getTauList)
router.get('/ga', C.getGaList)
router.get('/loai-toa', C.getLoaiToaList)

router.get('/lich-chay', C.getLichChayList)
router.post('/lich-chay', C.createLichChay)
router.put('/lich-chay/:id', C.updateLichChay)
router.delete('/lich-chay/:id', C.deleteLichChay)
router.post('/sinh-chuyen', C.sinhChuyenTau)

router.get('/lich-chay/:id/ga-dung', C.getGaDungList)
router.post('/lich-chay/:id/ga-dung', C.addGaDung)
router.put('/ga-dung/:id', C.updateGaDung)
router.delete('/ga-dung/:id', C.removeGaDung)

router.get('/chuyen-tau', C.getChuyenTauList)
router.get('/chuyen-tau/:id', C.getChuyenTauDetail)
router.put('/chuyen-tau/:id/trang-thai', C.updateTrangThai)
router.post('/chuyen-tau/:id/su-kien', C.logSuKien)

router.post('/chuyen-tau/:id/toa', C.addToaChuyen)
router.put('/chuyen-tau/:id/sap-xep-toa', C.reorderToa)
router.put('/toa/:toaId', C.updateToaChuyen)
router.delete('/toa/:toaId', C.removeToaChuyen)

module.exports = router
