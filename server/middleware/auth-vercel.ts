import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Check for token in cookies or Authorization header
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Add user info to request
    (req as any).userId = decoded.userId;
    (req as any).session = { userId: decoded.userId, familyId: decoded.familyId };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}