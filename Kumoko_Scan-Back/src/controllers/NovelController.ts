import { Request, Response } from 'express';
import Novel from '../models/Novel';

class NovelController {
  async index(req: Request, res: Response) {
    try {
      const novels = await Novel.findAll();
      return res.status(200).json(novels);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar novels' });
    }
  }

  async store(req: Request, res: Response) {
    try {
      const { nome, preco, descricao, avaliacao } = req.body;

      if (!nome || preco === undefined) {
        return res.status(400).json({ error: 'Nome e Preço são obrigatórios.' });
      }

      const novaNovel = await Novel.create({
        nome,
        preco,
        descricao,
        avaliacao: avaliacao || 5.0
      });

      return res.status(201).json(novaNovel);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Falha interna ao criar a novel.' });
    }
  }
}

export default new NovelController();