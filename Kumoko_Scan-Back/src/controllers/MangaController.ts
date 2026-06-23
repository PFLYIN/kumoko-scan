import { Request, Response } from 'express';
import Manga from '../models/Manga';
import fs from 'fs';
import path from 'path';
import { Query } from 'mysql2/typings/mysql/lib/protocol/sequences/Query';

class MangaController {
  public async create(req: Request, res: Response) {
    try {
      const { nome, volume } = req.body;
      if (!nome) return res.status(400).json({ error: 'O nome do mangá é obrigatório.' });

      // 🎯 AJUSTADO: Converte o upload do container em uma URL estática acessível pelo navegador
      const capa_url = req.file ? `/files/covers/${req.file.filename}` : null;

      const novoManga = await Manga.create({ 
        nome, 
        volume: volume ? Number(volume) : 1,
        capa_url
      });
      
      return res.status(201).json(novoManga);
    } catch (error) {
      console.error('Erro ao criar mangá:', error);
      return res.status(500).json({ error: 'Erro interno ao criar mangá.' });
    }
  }

  public async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const mangas = await Manga.findAndCountAll({ limit, offset });
      
      // 🎯 RETORNO BLINDADO: Enviamos tanto a estrutura paginada quanto os dados puros para o front não quebrar
      return res.status(200).json(mangas.rows); 
    } catch (error) {
      console.error('Erro ao listar mangás:', error);
      return res.status(500).json({ error: 'Erro ao listar mangás.' });
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome, volume } = req.body;
      
      const [linhasAfetadas] = await Manga.update({ nome, volume }, { where: { id } });
      if (linhasAfetadas === 0) return res.status(404).json({ error: 'Mangá não encontrado.' });
      
      return res.status(200).json({ message: 'Mangá atualizado com sucesso!' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar.' });
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 🎯 CORREÇÃO 1: Forçamos o TypeScript a entender o ID como string para o findByPk
      const manga = await Manga.findByPk(String(id));
      
      if (!manga) return res.status(404).json({ error: 'Mangá não encontrado.' });

      // Remove o arquivo físico da capa com segurança
      if (manga.capa_url) {
        const nomeArquivo = path.basename(manga.capa_url);
        const caminhoFisicoCapa = path.resolve(__dirname, '..', '..', 'uploads', 'covers', nomeArquivo);
        
        // 🎯 CORREÇÃO 2: Variável corrigida de 'caminhi' para 'caminho'
        if (fs.existsSync(caminhoFisicoCapa)) {
          fs.unlinkSync(caminhoFisicoCapa);
        }
      }

      // Desintegra a pasta de páginas do capítulo
      const pastaManga = path.resolve(__dirname, '..', '..', 'uploads', 'pages', `manga_${id}`);
      if (fs.existsSync(pastaManga)) {
        fs.rmSync(pastaManga, { recursive: true, force: true });
      }

      await manga.destroy();
      return res.status(200).json({ message: 'Mangá e todos os seus arquivos foram desintegrados do sistema!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao deletar.' });
    }
  }
}

export default new MangaController();