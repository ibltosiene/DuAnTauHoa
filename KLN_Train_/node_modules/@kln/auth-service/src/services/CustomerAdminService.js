const CustomerAdminRepo = require('../repositories/CustomerAdminRepository')

const getAllCustomers = () => CustomerAdminRepo.getAll()
const getCustomerById = (id) => CustomerAdminRepo.getById(id)
const getCustomerTickets = (id) => CustomerAdminRepo.getTickets(id)
const updateCustomer = (id, data) => CustomerAdminRepo.update(id, data)
const deleteCustomer = (id) => CustomerAdminRepo.remove(id)

module.exports = { getAllCustomers, getCustomerById, getCustomerTickets, updateCustomer, deleteCustomer }
