// Exigimos o dotenv aqui para caso você vá rodar a CLI localmente por fora do Docker em algum teste
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kumoko_scan',
    host: process.env.DB_HOST || 'database', // Aponta para o serviço do docker-compose
    dialect: 'mysql',
    logging: console.log
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
};