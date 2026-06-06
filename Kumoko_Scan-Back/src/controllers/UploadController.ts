import { Request, Response } from 'express';
import Pagina from '../models/Pagina';

class UploadController {
  public async page(req: Request, res: Response) {
    try {
      const { manga_id, capitulo_id, numero_pagina } = req.params;
      const imagem_url = req.file ? req.file.path : null;

      if (!imagem_url) {
        return res.status(400).json({ error: 'Nenhuma imagem foi enviada!' });
      }

      const novaPagina = await Pagina.create({
        manga_id: Number(manga_id),
        capitulo_id: Number(capitulo_id),
        numero_pagina: Number(numero_pagina),
        imagem_url
      });

      return res.status(201).json(novaPagina);
    } catch (error) {
      console.error('Erro ao salvar página:', error);
      return res.status(500).json({ error: 'Erro interno ao salvar a página.' });
    }
  }

  public async getPaginaPorCapitulo(req: Request, res: Response) {
    try {
      const { capitulo_id } = req.params;
      const pagina = await Pagina.findOne({ where: { capitulo_id } });
      return res.status(200).json(pagina);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar página.' });
    }
  }
}

export default new UploadController();