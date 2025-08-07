import express from 'express';
import { body, validationResult } from 'express-validator';
import * as bcrypt from 'bcryptjs';
import { 
  authenticateToken, 
  authRateLimit,
  optionalAuth,
  generateToken 
} from '../auth/middleware';
import { pool } from '../database/legacy-client';

const router = express.Router();

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login',
  authRateLimit,
  [
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
      }

      const { email, password } = req.body;
      
      // Find user by email
      const userQuery = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
      const user = userQuery.rows[0];

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
      }

      // Check if account is locked
      if (user.locked_until && user.locked_until > new Date()) {
        return res.status(423).json({
          success: false,
          error: 'Account is temporarily locked due to too many failed login attempts',
          timestamp: new Date().toISOString()
        });
      }

      // Check if first-time login (no password set)
      if (user.is_first_login && !user.password_hash) {
        return res.status(202).json({
          success: false,
          error: 'First-time login detected. Please set your password first.',
          requirePasswordSetup: true,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      }

      // Verify password
      if (!user.password_hash || !await bcrypt.compare(password, user.password_hash)) {
        // Increment failed login attempts
        const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
        let updateQuery = 'UPDATE users SET failed_login_attempts = $1';
        let params: any[] = [newFailedAttempts];
        
        // Lock account after 5 failed attempts
        if (newFailedAttempts >= 5) {
          const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          updateQuery += ', locked_until = $2';
          params.push(lockUntil);
        }
        
        updateQuery += ' WHERE id = $' + (params.length + 1);
        params.push(user.id);
        
        await pool.query(updateQuery, params);

        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        });
      }

      // Reset failed login attempts and update last login
      await pool.query(`
        UPDATE users 
        SET failed_login_attempts = 0, last_login = NOW(), locked_until = NULL 
        WHERE id = $1
      `, [user.id]);

      // Generate JWT token
      const tokenUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.family_id
      };
      const token = generateToken(tokenUser);

      // Log successful login
      await pool.query(`
        INSERT INTO activity_log (user_id, action, category, description, metadata) 
        VALUES ($1, $2, $3, $4, $5)
      `, [
        user.id,
        'login',
        'auth',
        'User logged in successfully',
        JSON.stringify({ 
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent')
        })
      ]);

      // Get family member info
      const familyMemberQuery = await pool.query(
        'SELECT * FROM family_members WHERE user_id = $1 LIMIT 1', 
        [user.id]
      );
      const familyMember = familyMemberQuery.rows[0];

      // Return success response
      res.json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          familyId: user.family_id,
          isFirstLogin: user.is_first_login,
          familyMember: familyMember ? {
            id: familyMember.id,
            name: familyMember.name,
            role: familyMember.role,
            profileEmoji: familyMember.profile_emoji
          } : null
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /auth/first-login
 * Set password for first-time users
 */
router.post('/first-login',
  [
    body('userId')
      .isInt({ min: 1 })
      .withMessage('User ID is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      })
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
      }

      const { userId, password } = req.body;

      // Find user and verify it's a first-time login
      const userQuery = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      const user = userQuery.rows[0];

      if (!user || !user.is_first_login || user.password_hash) {
        return res.status(400).json({
          success: false,
          error: 'Invalid first-login request',
          timestamp: new Date().toISOString()
        });
      }

      // Hash password and update user
      const hashedPassword = await bcrypt.hash(password, 12);
      await pool.query(`
        UPDATE users 
        SET password_hash = $1, is_first_login = false, password_changed_at = NOW(), updated_at = NOW()
        WHERE id = $2
      `, [hashedPassword, userId]);

      // Log activity
      await pool.query(`
        INSERT INTO activity_log (user_id, action, category, description) 
        VALUES ($1, $2, $3, $4)
      `, [userId, 'password_set', 'auth', 'User set password for first-time login']);

      res.json({
        success: true,
        message: 'Password set successfully. You can now log in.',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('First login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /auth/verify
 * Verify current token and get user info
 */
router.post('/verify', 
  authenticateToken,
  (req: express.Request, res: express.Response) => {
    const user = req.user!;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.familyId,
        familyMember: user.familyMember ? {
          id: user.familyMember.id,
          name: user.familyMember.name,
          role: user.familyMember.role,
          profileEmoji: user.familyMember.profileEmoji
        } : null
      },
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * POST /auth/refresh
 * Refresh JWT token for authenticated users
 */
router.post('/refresh',
  authenticateToken,
  (req: express.Request, res: express.Response) => {
    const user = req.user!;
    
    // Generate new token
    const newToken = generateToken(user);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * GET /auth/me
 * Get current user information
 */
router.get('/me',
  authenticateToken,
  (req: express.Request, res: express.Response) => {
    const user = req.user!;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        familyId: user.familyId,
        isFirstLogin: user.isFirstLogin,
        lastLogin: user.lastLogin,
        familyMember: user.familyMember ? {
          id: user.familyMember.id,
          name: user.familyMember.name,
          email: user.familyMember.email,
          role: user.familyMember.role,
          profileEmoji: user.familyMember.profileEmoji,
          frameColor: user.familyMember.frameColor,
          frameBorderColor: user.familyMember.frameBorderColor
        } : null
      },
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * POST /auth/logout
 * Logout endpoint (client should discard token)
 */
router.post('/logout',
  optionalAuth,
  async (req: express.Request, res: express.Response) => {
    try {
      const userName = req.user?.name || 'Guest';
      
      // Log logout activity if user is authenticated
      if (req.user) {
        await pool.query(`
          INSERT INTO activity_log (user_id, action, category, description) 
          VALUES ($1, $2, $3, $4)
        `, [req.user.id, 'logout', 'auth', 'User logged out']);
      }
      
      res.json({
        success: true,
        message: `Goodbye, ${userName}! Please discard your token.`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.json({
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /auth/status
 * Check authentication status without requiring auth
 */
router.get('/status',
  optionalAuth,
  (req: express.Request, res: express.Response) => {
    if (req.user) {
      res.json({
        authenticated: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          name: req.user.name,
          role: req.user.role,
          familyId: req.user.familyId
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        authenticated: false,
        message: 'No valid authentication token provided',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /auth/change-password
 * Change password for authenticated users
 */
router.post('/change-password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match new password');
        }
        return true;
      })
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = req.user!;

      // Get current password hash
      const userQuery = await pool.query('SELECT password_hash FROM users WHERE id = $1', [user.id]);
      const userData = userQuery.rows[0];

      // Verify current password
      if (!userData.password_hash || !await bcrypt.compare(currentPassword, userData.password_hash)) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
          timestamp: new Date().toISOString()
        });
      }

      // Hash new password and update
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      await pool.query(`
        UPDATE users 
        SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW()
        WHERE id = $2
      `, [hashedNewPassword, user.id]);

      // Log activity
      await pool.query(`
        INSERT INTO activity_log (user_id, action, category, description) 
        VALUES ($1, $2, $3, $4)
      `, [user.id, 'password_changed', 'security', 'User changed password']);

      res.json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;