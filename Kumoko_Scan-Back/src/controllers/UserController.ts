import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { isEmailValid, isPasswordStrong, isCpfValid } from '../utils/validators';

class UserController {
  async create(req: Request, res: Response) {
    try {
      const { nome, email, cpf, senha } = req.body;
      if (!isEmailValid(email)) return res.status(400).json({ error: 'E-mail inválido.' });
      if (!isCpfValid(cpf)) return res.status(400).json({ error: 'CPF inválido.' });
      if (!isPasswordStrong(senha)) return res.status(400).json({ error: 'Senha fraca.' });

      const userExists = await User.findOne({ where: { email } });
      if (userExists) return res.status(400).json({ error: 'E-mail já cadastrado!' });

      const senhaHash = await bcrypt.hash(senha, 10);
      await User.create({ nome, email, cpf, senha: senhaHash });

      return res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro interno ao cadastrar.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const userId = (req as any).userId; 
      const { nome, cpf, senha } = req.body;

      if (!isCpfValid(cpf)) return res.status(400).json({ error: 'CPF inválido.' });
      if (!isPasswordStrong(senha)) return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres.' });

      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const senhaHash = await bcrypt.hash(senha, 10);
      await user.update({ nome, cpf, senha: senhaHash });

      return res.status(200).json({ 
        message: 'Perfil atualizado!', 
        user: { nome: user.nome, email: user.email } 
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar perfil.' });
    }
  }
}

export default new UserController();