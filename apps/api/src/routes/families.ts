/**
 * @fileoverview Family management routes
 * @description CRUD operations for families with proper authentication and authorization
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { 
  authenticateToken, 
  requireAdmin,
  requireStaffOrAdmin,
  requireFamilyMember
} from '../auth/middleware';
import { pool } from '../database/legacy-client';

const router = express.Router();

/**
 * GET /families
 * Get all families (admin/staff only) with pagination and search
 */
router.get('/',
  authenticateToken,
  requireStaffOrAdmin,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().trim(),
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
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const offset = (page - 1) * limit;

      // Build query conditions
      let whereClause = '';
      let countWhereClause = '';
      let queryParams: any[] = [limit, offset];
      let countParams: any[] = [];

      if (search) {
        whereClause = 'WHERE f.name ILIKE $3';
        countWhereClause = 'WHERE name ILIKE $1';
        queryParams.push(`%${search}%`);
        countParams.push(`%${search}%`);
      }

      // Get families with member counts
      const familiesQuery = `
        SELECT 
          f.id, 
          f.name, 
          f.created_at, 
          f.updated_at,
          COUNT(fm.id) as member_count
        FROM families f
        LEFT JOIN family_members fm ON f.id = fm.family_id
        ${whereClause}
        GROUP BY f.id, f.name, f.created_at, f.updated_at
        ORDER BY f.created_at DESC
        LIMIT $1 OFFSET $2
      `;

      const familiesResult = await pool.query(familiesQuery, queryParams);

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM families ${countWhereClause}`;
      const countResult = await pool.query(countQuery, countParams);

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: familiesResult.rows,
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
      console.error('Get families error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /families/:id
 * Get specific family details with members
 */
router.get('/:id',
  authenticateToken,
  requireFamilyMember,
  async (req: express.Request, res: express.Response) => {
    try {
      const familyId = parseInt(req.params.id);
      
      if (isNaN(familyId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid family ID',
          timestamp: new Date().toISOString()
        });
      }

      // Check authorization - users can only view their own family unless admin
      if (req.user!.role !== 'admin' && req.user!.familyId !== familyId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only view your own family.',
          timestamp: new Date().toISOString()
        });
      }

      // Get family details
      const familyQuery = await pool.query('SELECT * FROM families WHERE id = $1', [familyId]);
      const family = familyQuery.rows[0];

      if (!family) {
        return res.status(404).json({
          success: false,
          error: 'Family not found',
          timestamp: new Date().toISOString()
        });
      }

      // Get family members with program counts
      const membersQuery = `
        SELECT 
          fm.id,
          fm.name,
          fm.email,
          fm.role,
          fm.profile_emoji,
          fm.frame_color,
          fm.frame_border_color,
          fm.is_active,
          fm.created_at,
          COUNT(mp.id) as program_count
        FROM family_members fm
        LEFT JOIN member_programs mp ON fm.id = mp.member_id
        WHERE fm.family_id = $1
        GROUP BY fm.id, fm.name, fm.email, fm.role, fm.profile_emoji, 
                 fm.frame_color, fm.frame_border_color, fm.is_active, fm.created_at
        ORDER BY fm.created_at
      `;

      const membersResult = await pool.query(membersQuery, [familyId]);
      const members = membersResult.rows;

      // Get family statistics
      const statsQuery = `
        SELECT 
          COUNT(mp.id) as total_programs,
          COALESCE(SUM(mp.points_balance), 0) as total_points
        FROM member_programs mp
        JOIN family_members fm ON mp.member_id = fm.id
        WHERE fm.family_id = $1
      `;

      const statsResult = await pool.query(statsQuery, [familyId]);
      const stats = statsResult.rows[0];

      res.json({
        success: true,
        data: {
          ...family,
          members,
          stats: {
            totalMembers: members.length,
            activeMembers: members.filter(m => m.is_active).length,
            totalPrograms: parseInt(stats.total_programs) || 0,
            totalPoints: parseInt(stats.total_points) || 0,
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get family error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /families
 * Create a new family (admin only)
 */
router.post('/',
  authenticateToken,
  requireAdmin,
  [
    body('name')
      .notEmpty()
      .withMessage('Family name is required')
      .isLength({ min: 2, max: 255 })
      .withMessage('Family name must be between 2 and 255 characters')
      .trim(),
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

      const { name } = req.body;

      // Create family
      const insertQuery = `
        INSERT INTO families (name, created_at, updated_at) 
        VALUES ($1, NOW(), NOW()) 
        RETURNING *
      `;
      const result = await pool.query(insertQuery, [name]);
      const newFamily = result.rows[0];

      // Log activity
      await pool.query(`
        INSERT INTO activity_log (user_id, action, category, description, metadata) 
        VALUES ($1, $2, $3, $4, $5)
      `, [
        req.user!.id,
        'family_created',
        'account',
        `Created new family: ${name}`,
        JSON.stringify({ familyId: newFamily.id, name })
      ]);

      res.status(201).json({
        success: true,
        message: 'Family created successfully',
        data: newFamily,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Create family error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * PUT /families/:id
 * Update family information (admin or family primary member only)
 */
router.put('/:id',
  authenticateToken,
  [
    body('name')
      .notEmpty()
      .withMessage('Family name is required')
      .isLength({ min: 2, max: 255 })
      .withMessage('Family name must be between 2 and 255 characters')
      .trim(),
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

      const familyId = parseInt(req.params.id);
      
      if (isNaN(familyId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid family ID',
          timestamp: new Date().toISOString()
        });
      }

      // Check authorization
      if (req.user!.role !== 'admin' && req.user!.familyId !== familyId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only edit your own family.',
          timestamp: new Date().toISOString()
        });
      }

      // Check if family exists
      const existingFamilyQuery = await pool.query('SELECT * FROM families WHERE id = $1', [familyId]);
      const existingFamily = existingFamilyQuery.rows[0];

      if (!existingFamily) {
        return res.status(404).json({
          success: false,
          error: 'Family not found',
          timestamp: new Date().toISOString()
        });
      }

      const { name } = req.body;

      // Update family
      const updateQuery = `
        UPDATE families 
        SET name = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [name, familyId]);
      const updatedFamily = result.rows[0];

      // Log activity
      await pool.query(`
        INSERT INTO activity_log (user_id, action, category, description, metadata) 
        VALUES ($1, $2, $3, $4, $5)
      `, [
        req.user!.id,
        'family_updated',
        'account',
        `Updated family name from "${existingFamily.name}" to "${name}"`,
        JSON.stringify({ familyId, oldName: existingFamily.name, newName: name })
      ]);

      res.json({
        success: true,
        message: 'Family updated successfully',
        data: updatedFamily,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Update family error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * DELETE /families/:id
 * Delete family and all associated data (admin only)
 * WARNING: This is a destructive operation
 */
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const familyId = parseInt(req.params.id);
      
      if (isNaN(familyId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid family ID',
          timestamp: new Date().toISOString()
        });
      }

      // Check if family exists
      const familyQuery = await pool.query('SELECT * FROM families WHERE id = $1', [familyId]);
      const family = familyQuery.rows[0];

      if (!family) {
        return res.status(404).json({
          success: false,
          error: 'Family not found',
          timestamp: new Date().toISOString()
        });
      }

      // Get count of members for logging
      const memberCountQuery = await pool.query('SELECT COUNT(*) as count FROM family_members WHERE family_id = $1', [familyId]);
      const memberCount = parseInt(memberCountQuery.rows[0].count);

      // Delete family (cascade will handle related data)
      await pool.query('DELETE FROM families WHERE id = $1', [familyId]);

      // Log activity
      await pool.query(`
        INSERT INTO activity_log (user_id, action, category, description, metadata) 
        VALUES ($1, $2, $3, $4, $5)
      `, [
        req.user!.id,
        'family_deleted',
        'account',
        `Deleted family "${family.name}" with ${memberCount} members`,
        JSON.stringify({ familyId, familyName: family.name, memberCount })
      ]);

      res.json({
        success: true,
        message: 'Family and all associated data deleted successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Delete family error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;