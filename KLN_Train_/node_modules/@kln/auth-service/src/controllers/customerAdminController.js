const CustomerService = require('../services/CustomerAdminService')

const getAllCustomers = async (req, res) => {
  try { res.json({ success: true, data: await CustomerService.getAllCustomers() }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getCustomerById = async (req, res) => {
  try {
    const data = await CustomerService.getCustomerById(req.params.id)
    if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' })
    res.json({ success: true, data })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const getCustomerTickets = async (req, res) => {
  try { res.json({ success: true, data: await CustomerService.getCustomerTickets(req.params.id) }) }
  catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const updateCustomer = async (req, res) => {
  try {
    await CustomerService.updateCustomer(req.params.id, req.body)
    res.json({ success: true, message: 'Cập nhật thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

const deleteCustomer = async (req, res) => {
  try {
    await CustomerService.deleteCustomer(req.params.id)
    res.json({ success: true, message: 'Xóa thành công' })
  } catch (err) { res.status(500).json({ success: false, message: err.message }) }
}

module.exports = { getAllCustomers, getCustomerById, getCustomerTickets, updateCustomer, deleteCustomer }
