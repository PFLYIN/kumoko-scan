import app from './App';
import sequelize, { startDB } from './config/database/index'; 

const PORT = process.env.PORT || 3000;

const bootstrap = async () => {
  try {
    await startDB();

    await sequelize.sync({ alter: true });
    console.log('📦 Tabelas do banco sincronizadas com sucesso!');
    
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('💥 ERRO CAPTURADO PELO SISTEMA:', err.stack);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'O arquivo enviado é muito grande. O limite máximo é 5MB.' });
      }

      if (err.message && err.message.includes('arquivo')) {
        return res.status(400).json({ error: err.message });
      }

      return res.status(500).json({ 
        error: 'Ocorreu um erro interno no servidor.', 
        message: err.message 
      });
    });

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Servidor Kumoko_Backend ativo na porta ${PORT}`);
    });

  } catch (error) {
    console.error('💥 Erro fatal ao iniciar o servidor:', error);
    process.exit(1);
  }
};

bootstrap();