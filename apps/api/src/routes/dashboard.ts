/**
 * @fileoverview Dashboard and statistics routes
 * @description Analytics and overview data for the Family Loyalty Program
 */

import express from 'express';
import { query, validationResult } from 'express-validator';
import { 
  authenticateToken, 
  requireFamilyMember
} from '../auth/middleware';
import { pool } from '../database/legacy-client';

const router = express.Router();

/**
 * GET /dashboard/overview
 * Get dashboard overview statistics for authenticated user
 */
router.get('/overview',
  authenticateToken,
  requireFamilyMember,
  async (req: express.Request, res: express.Response) => {
    try {
      const user = req.user!;
      const isAdmin = user.role === 'admin';
      
      // Different queries based on user role
      if (isAdmin) {
        // Admin sees system-wide statistics
        const statsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM family_members WHERE is_active = true) as total_members,
            (SELECT COUNT(*) FROM member_programs WHERE is_active = true) as active_programs,
            (SELECT COALESCE(SUM(points_balance), 0) FROM member_programs WHERE is_active = true) as total_points,
            (SELECT COUNT(*) FROM mile_transactions WHERE created_at >= NOW() - INTERVAL '30 days') as recent_transactions
        `;
        
        const result = await pool.query(statsQuery);
        const stats = result.rows[0];
        
        // Calculate estimated total value
        const valueQuery = `
          SELECT COALESCE(SUM(
            CAST(REPLACE(REPLACE(mp.estimated_value, 'R$ ', ''), ',', '.') AS NUMERIC)
          ), 0) as total_value
          FROM member_programs mp 
          WHERE mp.is_active = true AND mp.estimated_value IS NOT NULL
        `;
        
        const valueResult = await pool.query(valueQuery);
        const totalValue = parseFloat(valueResult.rows[0].total_value) || 0;
        
        // Get expiring points (next 90 days)
        const expiringQuery = `
          SELECT COALESCE(SUM(mp.points_balance), 0) as expiring_points
          FROM member_programs mp
          WHERE mp.expiration_date BETWEEN NOW() AND NOW() + INTERVAL '90 days'
          AND mp.is_active = true
        `;
        
        const expiringResult = await pool.query(expiringQuery);
        const expiringPoints = parseInt(expiringResult.rows[0].expiring_points) || 0;
        
        res.json({
          success: true,
          data: {
            totalMembers: parseInt(stats.total_members),
            activePrograms: parseInt(stats.active_programs),
            totalPoints: parseInt(stats.total_points),
            estimatedValue: `R$ ${totalValue.toFixed(2)}`,
            expiringPoints,
            recentTransactions: parseInt(stats.recent_transactions)
          },
          timestamp: new Date().toISOString()
        });
        
      } else {
        // Family member sees only their family's statistics
        const statsQuery = `
          SELECT 
            (SELECT COUNT(*) FROM family_members fm WHERE fm.family_id = $1 AND fm.is_active = true) as total_members,
            (SELECT COUNT(*) FROM member_programs mp 
             JOIN family_members fm ON mp.member_id = fm.id 
             WHERE fm.family_id = $1 AND mp.is_active = true) as active_programs,
            (SELECT COALESCE(SUM(mp.points_balance), 0) FROM member_programs mp 
             JOIN family_members fm ON mp.member_id = fm.id 
             WHERE fm.family_id = $1 AND mp.is_active = true) as total_points,
            (SELECT COUNT(*) FROM mile_transactions mt
             JOIN member_programs mp ON mt.member_program_id = mp.id
             JOIN family_members fm ON mp.member_id = fm.id
             WHERE fm.family_id = $1 AND mt.created_at >= NOW() - INTERVAL '30 days') as recent_transactions
        `;
        
        const result = await pool.query(statsQuery, [user.familyId]);
        const stats = result.rows[0];
        
        // Calculate estimated total value for family
        const valueQuery = `
          SELECT COALESCE(SUM(
            CAST(REPLACE(REPLACE(mp.estimated_value, 'R$ ', ''), ',', '.') AS NUMERIC)
          ), 0) as total_value
          FROM member_programs mp 
          JOIN family_members fm ON mp.member_id = fm.id
          WHERE fm.family_id = $1 AND mp.is_active = true AND mp.estimated_value IS NOT NULL
        `;
        
        const valueResult = await pool.query(valueQuery, [user.familyId]);
        const totalValue = parseFloat(valueResult.rows[0].total_value) || 0;
        
        // Get expiring points for family
        const expiringQuery = `
          SELECT COALESCE(SUM(mp.points_balance), 0) as expiring_points
          FROM member_programs mp
          JOIN family_members fm ON mp.member_id = fm.id
          WHERE fm.family_id = $1 
          AND mp.expiration_date BETWEEN NOW() AND NOW() + INTERVAL '90 days'
          AND mp.is_active = true
        `;
        
        const expiringResult = await pool.query(expiringQuery, [user.familyId]);
        const expiringPoints = parseInt(expiringResult.rows[0].expiring_points) || 0;
        
        res.json({
          success: true,
          data: {
            totalMembers: parseInt(stats.total_members),
            activePrograms: parseInt(stats.active_programs),
            totalPoints: parseInt(stats.total_points),
            estimatedValue: `R$ ${totalValue.toFixed(2)}`,
            expiringPoints,
            recentTransactions: parseInt(stats.recent_transactions)
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Dashboard overview error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /dashboard/recent-activity
 * Get recent activity for the user's family or system-wide (admin)
 */
router.get('/recent-activity',
  authenticateToken,
  requireFamilyMember,
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
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

      const limit = parseInt(req.query.limit as string) || 20;
      const user = req.user!;
      const isAdmin = user.role === 'admin';

      let activityQuery: string;
      let params: any[];

      if (isAdmin) {
        // Admin sees all activity
        activityQuery = `
          SELECT 
            al.id,
            al.action,
            al.category,
            al.description,
            al.timestamp,
            u.name as user_name,
            fm.name as member_name
          FROM activity_log al
          LEFT JOIN users u ON al.user_id = u.id
          LEFT JOIN family_members fm ON al.member_id = fm.id
          ORDER BY al.timestamp DESC
          LIMIT $1
        `;
        params = [limit];
      } else {
        // Family member sees only their family's activity
        activityQuery = `
          SELECT 
            al.id,
            al.action,
            al.category,
            al.description,
            al.timestamp,
            u.name as user_name,
            fm.name as member_name
          FROM activity_log al
          LEFT JOIN users u ON al.user_id = u.id
          LEFT JOIN family_members fm ON al.member_id = fm.id
          WHERE (u.family_id = $1 OR fm.family_id = $1)
          ORDER BY al.timestamp DESC
          LIMIT $2
        `;
        params = [user.familyId, limit];
      }

      const result = await pool.query(activityQuery, params);

      res.json({
        success: true,
        data: result.rows,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Recent activity error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /dashboard/points-summary
 * Get points summary by program type
 */
router.get('/points-summary',
  authenticateToken,
  requireFamilyMember,
  async (req: express.Request, res: express.Response) => {
    try {
      const user = req.user!;
      const isAdmin = user.role === 'admin';

      let summaryQuery: string;
      let params: any[];

      if (isAdmin) {
        // Admin sees system-wide summary
        summaryQuery = `
          SELECT 
            lp.program_type,
            lp.category,
            COUNT(mp.id) as program_count,
            COALESCE(SUM(mp.points_balance), 0) as total_points
          FROM member_programs mp
          JOIN loyalty_programs lp ON mp.program_id = lp.id
          WHERE mp.is_active = true
          GROUP BY lp.program_type, lp.category
          ORDER BY total_points DESC
        `;
        params = [];
      } else {
        // Family member sees only their family's summary
        summaryQuery = `
          SELECT 
            lp.program_type,
            lp.category,
            COUNT(mp.id) as program_count,
            COALESCE(SUM(mp.points_balance), 0) as total_points
          FROM member_programs mp
          JOIN loyalty_programs lp ON mp.program_id = lp.id
          JOIN family_members fm ON mp.member_id = fm.id
          WHERE fm.family_id = $1 AND mp.is_active = true
          GROUP BY lp.program_type, lp.category
          ORDER BY total_points DESC
        `;
        params = [user.familyId];
      }

      const result = await pool.query(summaryQuery, params);

      res.json({
        success: true,
        data: result.rows,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Points summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /dashboard/expiring-points
 * Get points expiring in the next specified days
 */
router.get('/expiring-points',
  authenticateToken,
  requireFamilyMember,
  [
    query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
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

      const days = parseInt(req.query.days as string) || 90;
      const user = req.user!;
      const isAdmin = user.role === 'admin';

      let expiringQuery: string;
      let params: any[];

      if (isAdmin) {
        // Admin sees system-wide expiring points
        expiringQuery = `
          SELECT 
            mp.id,
            mp.points_balance,
            mp.expiration_date,
            lp.name as program_name,
            lp.company,
            fm.name as member_name,
            f.name as family_name
          FROM member_programs mp
          JOIN loyalty_programs lp ON mp.program_id = lp.id
          JOIN family_members fm ON mp.member_id = fm.id
          JOIN families f ON fm.family_id = f.id
          WHERE mp.expiration_date BETWEEN NOW() AND NOW() + INTERVAL '$1 days'
          AND mp.is_active = true
          AND mp.points_balance > 0
          ORDER BY mp.expiration_date ASC
        `;
        params = [days];
      } else {
        // Family member sees only their family's expiring points
        expiringQuery = `
          SELECT 
            mp.id,
            mp.points_balance,
            mp.expiration_date,
            lp.name as program_name,
            lp.company,
            fm.name as member_name
          FROM member_programs mp
          JOIN loyalty_programs lp ON mp.program_id = lp.id
          JOIN family_members fm ON mp.member_id = fm.id
          WHERE fm.family_id = $1
          AND mp.expiration_date BETWEEN NOW() AND NOW() + INTERVAL '$2 days'
          AND mp.is_active = true
          AND mp.points_balance > 0
          ORDER BY mp.expiration_date ASC
        `;
        params = [user.familyId, days];
      }

      const result = await pool.query(expiringQuery, params);

      res.json({
        success: true,
        data: result.rows,
        filters: { days },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Expiring points error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;