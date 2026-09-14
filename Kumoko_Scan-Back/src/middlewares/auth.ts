import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado! Cadastre-se ou faça login.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'KUMOKO_SECRET';
    // Decodifica o token e descobre quem é o usuário (incluindo o is_admin)
    const decoded = jwt.verify(token, secret);
    
    // Injeta os dados do usuário na requisição para o próximo passo
    (req as any).user = decoded;
    
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// 🎯 TRAVA EXCLUSIVA PARA O MESTRE (Admin)
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (user && user.is_admin) {
    return next(); // Pode passar, é o admin
  }
  
  return res.status(403).json({ error: 'Acesso restrito! Apenas o Mestre das Sombras pode fazer isso.' });
};