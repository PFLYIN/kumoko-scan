import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

class AuthController {
  async registrar(req: Request, res: Response) {
    try {
      const { nome, email, cpf, senha } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
      }

      const usuarioExistente = await User.findOne({ where: { email } });
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Este e-mail já está em uso.' });
      }

      const salt = await bcrypt.genSalt(12);
      const senhaHash = await bcrypt.hash(senha, salt);

      const novoUsuario = await User.create({
        nome,
        email,
        cpf,
        senha: senhaHash,
        is_admin: false,
        total_gasto: 0.00
      });

      return res.status(201).json({
        message: 'Usuário cadastrado com sucesso!',
        userId: novoUsuario.id
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro interno ao registrar usuário.', details: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      const usuario = await User.findOne({ where: { email } });
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
      }

      const token = jwt.sign(
        { id: usuario.id, email: usuario.email, is_admin: usuario.is_admin },
        process.env.JWT_SECRET || 'secret_key_kumoko',
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        message: 'Autenticação realizada com sucesso!',
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          is_admin: usuario.is_admin,
          total_gasto: usuario.total_gasto
        }
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro interno ao realizar login.', details: error.message });
    }
  }
}

export default new AuthController();