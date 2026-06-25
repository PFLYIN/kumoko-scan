import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado! Cadastre-se ou faça login.' });
  }

  try {
    // 🎯 Puxando a chave mestra de forma dinâmica e segura do .env
    const secret = process.env.JWT_SECRET || 'KUMOKO_SECRET';
    jwt.verify(token, secret);
    
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};