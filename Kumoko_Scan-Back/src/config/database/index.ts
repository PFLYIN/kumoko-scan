import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'kumoko_scan',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'database', // Conecta no serviço do compose
    dialect: 'mysql',
    logging: console.log, 
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export const startDB = async () => {
  const maxRetries = 10;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexão com o MariaDB estabelecida com sucesso!');
      return;
    } catch (error: any) {
      retries++;
      console.error(`❌ Erro no banco (Tentativa ${retries}/${maxRetries}):`, error.message);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  console.error('💥 Falha crítica: Não foi possível conectar ao banco de dados.');
  process.exit(1);
};

export default sequelize;