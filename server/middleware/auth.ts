import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}