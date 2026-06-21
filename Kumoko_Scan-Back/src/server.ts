import app from './App';
// 🎯 CAMINHO CORRIGIDO: Importa a conexão e a função do local correto
import sequelize, { startDB } from './config/database/index'; 

const PORT = process.env.PORT || 3000;

const bootstrap = async () => {
  // 1. Aguarda o container do MariaDB aceitar conexões
  await startDB();

  // 2. Sincroniza as tabelas automaticamente
  try {
    await sequelize.sync({ alter: true });
    console.log('📦 Tabelas do banco sincronizadas com sucesso!');
    
    // 3. Inicia o servidor Express de fato (escutando em 0.0.0.0 para o Docker)
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Servidor Kumoko_Backend ativo na porta ${PORT}`);
    });
  } catch (error) {
    console.error('💥 Erro fatal ao sincronizar tabelas:', error);
    process.exit(1);
  }
};

// 🎯 CHAMADA REAL DA FUNÇÃO (Sem aspas de string)
bootstrap();