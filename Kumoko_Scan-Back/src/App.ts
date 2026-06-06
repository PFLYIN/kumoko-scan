import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './swaggerDocs';
import express from 'express';
import cors from 'cors';
import path from 'path';

import livroRoutes from './routes/livro';
import uploadRoutes from './routes/upload';
import mangaRoutes from './routes/manga';
import capituloRoutes from './routes/capitulo';
import authRoutes from './routes/auth';

class App {
  public server: express.Application;

  constructor() {
    this.server = express(); 
    this.middlewares();
    this.routes();
  }

  private middlewares() {
    this.server.use(cors());
    this.server.use(express.json());
    this.server.use('/files', express.static(path.resolve(__dirname, '..', 'uploads')));
  }

  private routes() {
    const swaggerOptions = {
      customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css'
    };

    this.server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
    this.server.use(authRoutes); 
    this.server.use(uploadRoutes);
    this.server.use('/mangas', mangaRoutes);
    this.server.use('/capitulos', capituloRoutes);
    this.server.use('/livros', livroRoutes);
  } 
}

export default new App().server;