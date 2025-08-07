import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
// import { db } from '../database/connection'; // Commented out - depends on @monorepo/database
// import { users } from '@monorepo/database'; // Commented out - package doesn't exist
// import { eq } from 'drizzle-orm'; // Commented out - depends on users schema

// Extend Request interface to support legacy session format
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

export default async function legacyAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    // TODO: Re-implement user lookup once database schema is available
    // const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    // Temporary mock user for build compatibility
    const user = {
      id: decoded.userId,
      email: decoded.email || 'user@example.com',
      name: decoded.name || decoded.email || 'User'
    };

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
export async function optionalLegacyAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    // TODO: Re-implement user lookup once database schema is available
    // const [user] = await db.select().from(users).where(eq(users.id, decoded.userId));
    
    // Temporary mock user for build compatibility
    const user = {
      id: decoded.userId,
      email: decoded.email || 'user@example.com',
      name: decoded.name || decoded.email || 'User'
    };
    
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