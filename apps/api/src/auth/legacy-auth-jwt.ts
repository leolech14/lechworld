import jwt from 'jsonwebtoken';
import { db } from '../database/legacy-client.js';
import { users } from '@monorepo/database';
import { eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';

// Extend Request interface for legacy compatibility
declare global {
  namespace Express {
    interface Request {
      session?: {
        userId: number;
        user: {
          id: number;
          email: string;
          name: string;
        };
      };
      user?: any;
    }
  }
}

export default async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Set user info on request for compatibility with existing code
    req.session = {
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    };
    
    // Also set user directly
    req.user = user;
    
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

// Optional middleware - allows unauthenticated requests
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    if (user) {
      req.session = {
        userId: user.id,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      };
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Ignore errors and continue without authentication
    next();
  }
}

// Helper function to generate JWT tokens
export function generateAuthToken(userId: number) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' } // 7 days
  );
}