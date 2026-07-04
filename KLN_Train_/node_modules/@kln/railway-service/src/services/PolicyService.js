const PolicyRepository = require('../repositories/PolicyRepository')

const getOccasionPolicies = () => PolicyRepository.getOccasionPolicies()
const updateOccasionPolicy = (id, he_so_tang) => PolicyRepository.updateOccasionPolicy(id, he_so_tang)

const createOccasionPolicy = ({ ten_dip, he_so_tang, ngay_bat_dau, ngay_ket_thuc, don_gia_km_goc }) => {
  if (!ten_dip || he_so_tang === undefined || !ngay_bat_dau || !ngay_ket_thuc) {
    throw { status: 400, message: 'Thiếu thông tin biểu giá' }
  }
  return PolicyRepository.createOccasionPolicy({ ten_dip, he_so_tang, ngay_bat_dau, ngay_ket_thuc, don_gia_km_goc })
}

const getBasePrice = async () => {
  const row = await PolicyRepository.getBasePrice()
  return row || { don_gia: 1500, tu_ngay: '2024-01-01' }
}

const getSeatFactors = () => PolicyRepository.getSeatFactors()

module.exports = { getOccasionPolicies, updateOccasionPolicy, createOccasionPolicy, getBasePrice, getSeatFactors }
