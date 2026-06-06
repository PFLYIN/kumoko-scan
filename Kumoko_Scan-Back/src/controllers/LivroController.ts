import { Request, Response } from 'express';
import Livro from '../models/Livro';

class LivroController {
  public async create(req: Request, res: Response) {
    try {
      const { nome } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });

      const capa_url = req.file ? req.file.path : null;

      const novoLivro = await Livro.create({ nome, capa_url });
      return res.status(201).json(novoLivro);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar livro.' });
    }
  }

  public async list(req: Request, res: Response) {
    try {
      const livros = await Livro.findAll();
      return res.status(200).json(livros);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar livros.' });
    }
  }
}

export default new LivroController();