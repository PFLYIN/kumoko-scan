import { Request, Response } from 'express';
import Livro from '../models/Livro';

class LivroController {
  public async create(req: Request, res: Response) {
    try {
      const { nome, preco, descricao, avaliacao } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });

      const capa_url = req.file ? `/files/covers/${req.file.filename}` : null;

      const novoLivro = await Livro.create({ 
        nome, 
        preco: preco ? parseFloat(preco) : 0.00,
        descricao: descricao || '',
        avaliacao: avaliacao ? parseFloat(avaliacao) : 5.0,
        capa_url 
      });
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

  public async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome, preco, descricao, avaliacao } = req.body;

      const livro = await Livro.findByPk(id as string);
      if (!livro) return res.status(404).json({ error: 'Livro não encontrado.' });

      await livro.update({ 
        nome,
        preco: preco ? parseFloat(preco) : 0.00,
        descricao: descricao || '',
        avaliacao: avaliacao ? parseFloat(avaliacao) : 5.0
      });
      
      return res.status(200).json(livro);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar livro.' });
    }
  }

  public async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const livro = await Livro.findByPk(id as string);
      
      if (!livro) return res.status(404).json({ error: 'Livro não encontrado.' });
      return res.status(200).json(livro);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar livro.' });
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const livro = await Livro.findByPk(id as string);
      
      if (!livro) return res.status(404).json({ error: 'Livro não encontrado.' });

      await livro.destroy();
      return res.status(200).json({ message: 'Livro excluído com sucesso.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao excluir livro.' });
    }
  }
}

export default new LivroController();