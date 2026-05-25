import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  // SSE connections send token via query param (EventSource doesn't support headers)
  const token = req.headers.authorization?.replace('Bearer ', '') || (req.query.token as string);
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação necessário' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}
