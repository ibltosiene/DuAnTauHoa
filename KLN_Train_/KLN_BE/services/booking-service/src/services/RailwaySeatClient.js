const { serviceClient } = require('@kln/shared')

// Booking KHÔNG tự sửa GheChuyen/GheChang — luôn hỏi railway-service qua
// /internal/seats/*. Đây là điểm nối duy nhất giữa Booking và tài nguyên
// vận hành (đúng nguyên tắc "Booking chỉ hỏi ghế còn không?").

const ensureGheChuyen = (idChuyen) =>
  serviceClient.post('railway', '/internal/seats/ensure', { idChuyen })

const cleanupExpired = (idChuyen, soToaThuTu, soGheList) =>
  serviceClient.post('railway', '/internal/seats/cleanup-expired', { idChuyen, soToaThuTu, soGheList })

const checkSeatsAvailable = async (idChuyen, soToaThuTu, soGheList, idGaLen = null, idGaXuong = null, excludeSessionId = null) => {
  const res = await serviceClient.post('railway', '/internal/seats/check-available', {
    idChuyen, soToaThuTu, soGheList, idGaLen, idGaXuong, excludeSessionId,
  })
  return res.data.available
}

const holdSeats = (idChuyen, soToaThuTu, soGheList, sessionId, idGaLen = null, idGaXuong = null) =>
  serviceClient.post('railway', '/internal/seats/hold', { idChuyen, soToaThuTu, soGheList, sessionId, idGaLen, idGaXuong })

const releaseHoldBySession = (sessionId) =>
  serviceClient.post('railway', '/internal/seats/release', { sessionId })

const linkVe = ({ idChuyen, soToaThuTu, soGheTrongToa, idVe, idGaLen, idGaXuong, sessionId }) =>
  serviceClient.post('railway', '/internal/seats/link-ve', { idChuyen, soToaThuTu, soGheTrongToa, idVe, idGaLen, idGaXuong, sessionId })

const confirmByVeIds = (veIds) =>
  serviceClient.post('railway', '/internal/seats/confirm', { veIds })

const freeByVeId = (idVe) =>
  serviceClient.post('railway', '/internal/seats/free', { idVe })

module.exports = { ensureGheChuyen, cleanupExpired, checkSeatsAvailable, holdSeats, releaseHoldBySession, linkVe, confirmByVeIds, freeByVeId }
