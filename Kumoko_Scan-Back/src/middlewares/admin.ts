import { Response, NextFunction } from 'express';

export const adminMiddleware = (req: any, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Acesso negado. Recurso exclusivo para o Mestre das Sombras.' });
  }

  return next();
};