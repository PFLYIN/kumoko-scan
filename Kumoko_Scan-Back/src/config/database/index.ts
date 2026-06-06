import { Sequelize } from 'sequelize';

const db = new Sequelize('kumoko_scan', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log,
});

const startDB = async () => {
  try {
    await db.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
  } catch (error) {
    console.error('Erro no banco:', error);
  }
};

startDB();

export default db;