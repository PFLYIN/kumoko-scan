import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ error: 'Erro no formato do token.' });
  }

  const [scheme, token] = parts;
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: 'Token mal formatado.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key_kumoko', (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    req.user = decoded; // Injeta os dados do usuário decodificados (id, email, is_admin)
    return next();
  });
};