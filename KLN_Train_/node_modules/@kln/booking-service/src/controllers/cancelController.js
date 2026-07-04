const CancelService = require('../services/CancelService')
const { response: { ok, badRequest } } = require('@kln/shared')

const getCancelFee = async (req, res, next) => {
  try {
    const result = await CancelService.tinhPhiHuy(parseInt(req.params.idVe))
    ok(res, result)
  } catch (err) { next(err) }
}

const cancelTickets = async (req, res, next) => {
  try {
    const { maDatCho, idVeList, lyDo } = req.body
    if (!maDatCho || !idVeList?.length) return badRequest(res, 'Thiếu maDatCho hoặc danh sách vé')
    const result = await CancelService.cancelTickets(maDatCho, idVeList, lyDo)
    ok(res, result, `Hủy ${result.soVeHuy} vé thành công. Hoàn tiền: ${result.tongTienHoan.toLocaleString('vi-VN')}đ`)
  } catch (err) { next(err) }
}

module.exports = { getCancelFee, cancelTickets }
