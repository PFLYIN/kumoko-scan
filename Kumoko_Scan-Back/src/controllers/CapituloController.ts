import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import Capitulo from '../models/Capitulo';

class CapituloController {
    public async create(req: Request, res: Response) {
        try {
            const { manga_id, numero, titulo } = req.body;
            if (!manga_id || numero === undefined) 
                return res.status(400).json({ error: 'Mangá ID e número são obrigatórios.' });

            const novoCapitulo = await Capitulo.create({ manga_id, numero, titulo });
            return res.status(201).json(novoCapitulo);
        } catch (error) {
            return res.status(500).json({ error: 'Erro interno.' });
        }
    }
    
    public async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { numero, titulo } = req.body;
      
      const [linhasAfetadas] = await Capitulo.update({ numero, titulo }, { where: { id } });
      if (linhasAfetadas === 0) return res.status(404).json({ error: 'Capítulo não encontrado.' });
      
      return res.status(200).json({ message: 'Capítulo atualizado com sucesso!' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar.' });
    }
  }

    public async listByManga(req: Request, res: Response) {
    try {
      const { manga_id } = req.params;
      const capitulos = await Capitulo.findAll({ where: { manga_id } });
      return res.status(200).json(capitulos);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar capítulos.' });
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const capitulo = await Capitulo.findByPk(id);
      
      if (!capitulo) return res.status(404).json({ error: 'Capítulo não encontrado.' });

      const pastaCapitulo = path.resolve(__dirname, '..', '..', 'uploads', 'pages', `manga_${capitulo.manga_id}`, `capitulo_${id}`);
      if (fs.existsSync(pastaCapitulo)) {
        fs.rmSync(pastaCapitulo, { recursive: true, force: true });
      }

      await capitulo.destroy();
      
      return res.status(200).json({ message: 'Capítulo e suas páginas foram varridos!' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar.' });
    }
  }
}

export default new CapituloController();