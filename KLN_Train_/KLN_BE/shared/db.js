const { Sequelize } = require('sequelize')

// Mỗi service tự gọi createSequelize() với env riêng của nó (nhưng cùng trỏ
// tới 1 CSDL SQL Server 'Trainn' — xem csdl.sql). Giữ nguyên cấu hình kết nối
// đã hoạt động ổn định ở DuAnTauHoaCom/backend/src/config/database.js.
const createSequelize = () => {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_SERVER.split('\\')[0],
      port: parseInt(process.env.DB_PORT) || 1433,
      dialect: 'mssql',
      dialectOptions: {
        options: {
          encrypt: false,
          trustServerCertificate: true,
          requestTimeout: 60000,
          trustedTimeout: false,
          ...(process.env.DB_SERVER.includes('\\') && {
            instanceName: process.env.DB_SERVER.split('\\')[1],
          }),
        },
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    }
  )

  const connectDB = async () => {
    await sequelize.authenticate()
    console.log(`Kết nối SQL Server thành công (${process.env.SERVICE_NAME || 'service'}).`)
  }

  return { sequelize, connectDB }
}

module.exports = { createSequelize }
