import { Request, Response } from 'express';
import Compra from '../models/Compra';
import User from '../models/User';

class CompraController {
  async finalizar(req: Request, res: Response) {
    // A transação recebe quem está comprando, a lista de itens e o valor total
    const { usuario_id, itens, total_compra } = req.body;

    if (!usuario_id || !itens || itens.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio ou usuário não identificado.' });
    }

    try {
      // 1. Grava cada item comprado no histórico
      for (const item of itens) {
        // Multiplica os registros pela quantidade que a pessoa escolheu
        for (let i = 0; i < item.quantidade; i++) {
          await Compra.create({
            usuario_id,
            produto_id: item.id,
            tipo_produto: item.tipo_produto || 'manga', // Define via Mobile
            preco_pago: item.preco
          });
        }
      }

      // 2. Localiza o usuário e incrementa o que ele gastou
      const usuario = await User.findByPk(usuario_id);
      if (usuario) {
        const gastoAnterior = parseFloat(usuario.total_gasto.toString());
        const gastoNovo = parseFloat(total_compra.toString());
        
        usuario.total_gasto = gastoAnterior + gastoNovo;
        await usuario.save();
      }

      return res.status(201).json({ message: 'Compra finalizada com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao processar a compra.' });
    }
  }
}

export default new CompraController(); 