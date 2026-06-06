import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ error: 'E-mail não cadastrado!' });

      const senhaValida = await bcrypt.compare(senha, user.senha);
      if (!senhaValida) return res.status(401).json({ error: 'Senha incorreta!' });

      const token = jwt.sign({ id: user.id }, 'KUMOKO_SECRET', { expiresIn: '1d' });

      return res.status(200).json({ 
        message: 'Login com sucesso',
        token, 
        user: { nome: user.nome, email: user.email } 
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno no login.' });
    }
  }
}

export default new AuthController();