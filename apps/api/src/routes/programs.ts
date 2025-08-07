/**
 * @fileoverview Loyalty programs management routes
 * @description CRUD operations for loyalty programs with proper authentication and authorization
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { 
  authenticateToken, 
  requireAdmin
} from '../auth/middleware';
import { pool } from '../database/legacy-client';

const router = express.Router();

/**
 * GET /programs
 * Get all loyalty programs with optional filtering
 */
router.get('/',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().trim(),
    query('category').optional().isIn(['airline', 'hotel', 'credit_card', 'retail']).withMessage('Invalid category'),
    query('type').optional().isIn(['miles', 'points', 'cashback']).withMessage('Invalid type'),
    query('active').optional().isBoolean().withMessage('Active must be a boolean'),
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const type = req.query.type as string;
      const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = [];
      const params: any[] = [];
      
      if (search) {
        conditions.push(`(lp.name ILIKE $${params.length + 1} OR lp.company ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }
      
      if (category) {
        conditions.push(`lp.category = $${params.length + 1}`);
        params.push(category);
      }
      
      if (type) {
        conditions.push(`lp.program_type = $${params.length + 1}`);
        params.push(type);
      }
      
      if (active !== undefined) {
        conditions.push(`lp.is_active = $${params.length + 1}`);
        params.push(active);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get programs with member counts
      const programsQuery = `
        SELECT 
          lp.id,
          lp.name,
          lp.company,
          lp.code,
          lp.program_type,
          lp.category,
          lp.logo_color,
          lp.point_value,
          lp.transfer_enabled,
          lp.is_active,
          lp.created_at,
          lp.updated_at,
          COUNT(mp.id) as member_count,
          COALESCE(SUM(mp.points_balance), 0) as total_points
        FROM loyalty_programs lp
        LEFT JOIN member_programs mp ON lp.id = mp.program_id AND mp.is_active = true
        ${whereClause}
        GROUP BY lp.id, lp.name, lp.company, lp.code, lp.program_type, lp.category, 
                 lp.logo_color, lp.point_value, lp.transfer_enabled, lp.is_active, 
                 lp.created_at, lp.updated_at
        ORDER BY lp.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);
      const programsResult = await pool.query(programsQuery, params);

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM loyalty_programs lp ${whereClause}`;
      const countParams = params.slice(0, -2); // Remove limit and offset
      const countResult = await pool.query(countQuery, countParams);

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: programsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get programs error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /programs/:id
 * Get specific loyalty program details
 */
router.get('/:id',
  authenticateToken,
  async (req: express.Request, res: express.Response) => {
    try {
      const programId = parseInt(req.params.id);
      
      if (isNaN(programId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid program ID',
          timestamp: new Date().toISOString()
        });
      }

      // Get program details with statistics
      const programQuery = `
        SELECT 
          lp.*,
          COUNT(mp.id) as member_count,
          COALESCE(SUM(mp.points_balance), 0) as total_points
        FROM loyalty_programs lp
        LEFT JOIN member_programs mp ON lp.id = mp.program_id AND mp.is_active = true
        WHERE lp.id = $1
        GROUP BY lp.id
      `;

      const result = await pool.query(programQuery, [programId]);
      const program = result.rows[0];

      if (!program) {
        return res.status(404).json({
          success: false,
          error: 'Program not found',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: program,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get program error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /programs
 * Create new loyalty program (admin only)
 */
router.post('/',
  authenticateToken,
  requireAdmin,
  [
    body('name')
      .notEmpty()
      .withMessage('Program name is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Program name must be between 1 and 255 characters')
      .trim(),
    body('company')
      .notEmpty()
      .withMessage('Company name is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Company name must be between 1 and 255 characters')
      .trim(),
    body('program_type')
      .isIn(['miles', 'points', 'cashback'])
      .withMessage('Program type must be miles, points, or cashback'),
    body('category')
      .isIn(['airline', 'hotel', 'credit_card', 'retail'])
      .withMessage('Category must be airline, hotel, credit_card, or retail'),
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

      // Create program
      const insertQuery = `
        INSERT INTO loyalty_programs (
          name, company, code, program_type, category, logo_color, point_value,
          transfer_enabled, website, phone_number, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        req.body.name,
        req.body.company,
        req.body.code || null,
        req.body.program_type,
        req.body.category,
        req.body.logo_color || '#3B82F6',
        req.body.point_value || '0.01',
        req.body.transfer_enabled || false,
        req.body.website || null,
        req.body.phone_number || null,
        true
      ];

      const result = await pool.query(insertQuery, values);
      const newProgram = result.rows[0];

      // Log activity
      await pool.query(`
        INSERT INTO activity_log (user_id, action, category, description, metadata) 
        VALUES ($1, $2, $3, $4, $5)
      `, [
        req.user!.id,
        'program_created',
        'account',
        `Created new loyalty program: ${newProgram.name}`,
        JSON.stringify({ programId: newProgram.id, programName: newProgram.name })
      ]);

      res.status(201).json({
        success: true,
        message: 'Loyalty program created successfully',
        data: newProgram,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Create program error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;