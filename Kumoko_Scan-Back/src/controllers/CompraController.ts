import { Request, Response } from 'express';
import Compra from '../models/Compra';
import { User } from '../models/User';

class CompraController {
  public async finalizar(req: Request, res: Response) {
    try {
      // 🎯 SEGURANÇA: Pega o ID do usuário direto do Token JWT validado!
      const usuario = (req as any).user;
      const usuario_id = usuario.id; 
      
      const { produtos, total } = req.body; 
      
      if (!produtos || produtos.length === 0) {
         return res.status(400).json({ error: 'O carrinho está vazio.' });
      }

      // 🎯 Salva cada mangá/livro comprado no histórico do banco
      for (const prod of produtos) {
         await Compra.create({
            usuario_id,
            produto_id: prod.id,
            tipo_produto: prod.tipo_produto || 'manga',
            preco_pago: prod.preco
         });
      }

      // 🎯 Atualiza a "Fortuna Investida" do usuário
      const userDb = await User.findByPk(usuario_id);
      if (userDb) {
         const novoTotal = Number(userDb.total_gasto) + Number(total);
         await userDb.update({ total_gasto: novoTotal });
      }

      return res.status(200).json({ message: 'Compra finalizada com sucesso!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao processar o pagamento.' });
    }
  }

  // 🎯 ROTA NOVA: Devolve as compras apenas do usuário logado
  public async historico(req: Request, res: Response) {
    try {
      const usuario_id = (req as any).user.id;
      const compras = await Compra.findAll({ where: { usuario_id } });
      return res.status(200).json(compras);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar o histórico.' });
    }
  }
}

export default new CompraController();