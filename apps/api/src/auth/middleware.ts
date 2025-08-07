import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { pool } from '../database/legacy-client';

// JWT secret
const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
  familyId: number;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware - verifies JWT token and loads user data
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        timestamp: new Date().toISOString()
      });
    }

    // Verify and decode JWT
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Get user from database
    const userQuery = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND email = $2',
      [decoded.userId, decoded.email]
    );

    const user = userQuery.rows[0];
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token. User not found.',
        timestamp: new Date().toISOString()
      });
    }

    // Get associated family member info
    const familyMemberQuery = await pool.query(
      'SELECT * FROM family_members WHERE user_id = $1',
      [user.id]
    );

    const familyMember = familyMemberQuery.rows[0];

    // Attach user to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      familyId: user.family_id,
      isFirstLogin: user.is_first_login,
      lastLogin: user.last_login,
      passwordHash: user.password_hash,
      familyMember: familyMember ? {
        id: familyMember.id,
        name: familyMember.name,
        email: familyMember.email,
        role: familyMember.role,
        profileEmoji: familyMember.profile_emoji,
        frameColor: familyMember.frame_color,
        frameBorderColor: familyMember.frame_border_color
      } : null
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Invalid token.',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Optional authentication - loads user if token is present but doesn't fail if absent
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // No token, continue without user
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    const userQuery = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND email = $2',
      [decoded.userId, decoded.email]
    );

    const user = userQuery.rows[0];
    if (user) {
      const familyMemberQuery = await pool.query(
        'SELECT * FROM family_members WHERE user_id = $1',
        [user.id]
      );

      const familyMember = familyMemberQuery.rows[0];

      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.family_id,
        isFirstLogin: user.is_first_login,
        lastLogin: user.last_login,
        passwordHash: user.password_hash,
        familyMember: familyMember ? {
          id: familyMember.id,
          name: familyMember.name,
          email: familyMember.email,
          role: familyMember.role,
          profileEmoji: familyMember.profile_emoji,
          frameColor: familyMember.frame_color,
          frameBorderColor: familyMember.frame_border_color
        } : null
      };
    }

    next();
  } catch (error) {
    // Invalid token, but optional - continue without user
    next();
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        timestamp: new Date().toISOString()
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required roles: ${roles.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

/**
 * Require admin role
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Require staff or admin role
 */
export const requireStaffOrAdmin = requireRole(['staff', 'admin']);

/**
 * Require family member (non-guest users)
 */
export function requireFamilyMember(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.familyId) {
    return res.status(403).json({
      error: 'Access denied. Family membership required.',
      timestamp: new Date().toISOString()
    });
  }
  next();
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: any): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    familyId: user.familyId || user.family_id
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * Rate limiting for auth endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per window
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General rate limiting
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: {
    error: 'Too many requests. Please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});