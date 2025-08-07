/**
 * @fileoverview Family members management routes
 * @description CRUD operations for family members with proper authentication and authorization
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { 
  authenticateToken, 
  requireFamilyMember
} from '../auth/middleware';
import { pool } from '../database/legacy-client';

const router = express.Router();

/**
 * GET /members
 * Get family members (filtered by user's family unless admin)
 */
router.get('/',
  authenticateToken,
  requireFamilyMember,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().isString().trim(),
    query('role').optional().isIn(['primary', 'extended', 'view_only']).withMessage('Invalid role'),
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
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const role = req.query.role as string;
      const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = [];
      const params: any[] = [];
      
      // Family restriction (unless admin)
      if (req.user!.role !== 'admin') {
        conditions.push(`fm.family_id = $${params.length + 1}`);
        params.push(req.user!.familyId);
      }
      
      if (search) {
        conditions.push(`fm.name ILIKE $${params.length + 1}`);
        params.push(`%${search}%`);
      }
      
      if (role) {
        conditions.push(`fm.role = $${params.length + 1}`);
        params.push(role);
      }
      
      if (active !== undefined) {
        conditions.push(`fm.is_active = $${params.length + 1}`);
        params.push(active);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get members with program counts and total points
      const membersQuery = `
        SELECT 
          fm.id,
          fm.name,
          fm.email,
          fm.role,
          fm.profile_emoji,
          fm.frame_color,
          fm.frame_border_color,
          fm.cpf,
          fm.phone,
          fm.birthdate,
          fm.is_active,
          fm.created_at,
          fm.updated_at,
          fm.family_id,
          COUNT(mp.id) as program_count,
          COALESCE(SUM(mp.points_balance), 0) as total_points
        FROM family_members fm
        LEFT JOIN member_programs mp ON fm.id = mp.member_id AND mp.is_active = true
        ${whereClause}
        GROUP BY fm.id, fm.name, fm.email, fm.role, fm.profile_emoji, 
                 fm.frame_color, fm.frame_border_color, fm.cpf, fm.phone, 
                 fm.birthdate, fm.is_active, fm.created_at, fm.updated_at, fm.family_id
        ORDER BY fm.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);
      const membersResult = await pool.query(membersQuery, params);

      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM family_members fm ${whereClause}`;
      const countParams = params.slice(0, -2); // Remove limit and offset
      const countResult = await pool.query(countQuery, countParams);

      const total = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: membersResult.rows,
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
      console.error('Get members error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /members/:id
 * Get specific family member with detailed program information
 */
router.get('/:id',
  authenticateToken,
  requireFamilyMember,
  async (req: express.Request, res: express.Response) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid member ID',
          timestamp: new Date().toISOString()
        });
      }

      // Get member details
      const memberQuery = await pool.query('SELECT * FROM family_members WHERE id = $1', [memberId]);
      const member = memberQuery.rows[0];

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Member not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check authorization
      if (req.user!.role !== 'admin' && req.user!.familyId !== member.family_id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only view members from your family.',
          timestamp: new Date().toISOString()
        });
      }

      // Get member programs with loyalty program details
      const programsQuery = `
        SELECT 
          mp.id,
          mp.account_number,
          mp.points_balance,
          mp.elite_tier,
          mp.status_level,
          mp.yearly_earnings,
          mp.yearly_spending,
          mp.estimated_value,
          mp.notes,
          mp.expiration_date,
          mp.is_active,
          mp.last_updated,
          lp.id as program_id,
          lp.name as program_name,
          lp.company,
          lp.code,
          lp.program_type,
          lp.category,
          lp.logo_color,
          lp.point_value,
          lp.transfer_enabled
        FROM member_programs mp
        LEFT JOIN loyalty_programs lp ON mp.program_id = lp.id
        WHERE mp.member_id = $1
        ORDER BY mp.last_updated DESC
      `;

      const programsResult = await pool.query(programsQuery, [memberId]);
      const programs = programsResult.rows.map(row => ({
        id: row.id,
        accountNumber: row.account_number,
        pointsBalance: row.points_balance,
        eliteTier: row.elite_tier,
        statusLevel: row.status_level,
        yearlyEarnings: row.yearly_earnings,
        yearlySpending: row.yearly_spending,
        estimatedValue: row.estimated_value,
        notes: row.notes,
        expirationDate: row.expiration_date,
        isActive: row.is_active,
        lastUpdated: row.last_updated,
        program: {
          id: row.program_id,
          name: row.program_name,
          company: row.company,
          code: row.code,
          programType: row.program_type,
          category: row.category,
          logoColor: row.logo_color,
          pointValue: row.point_value,
          transferEnabled: row.transfer_enabled,
        }
      }));

      // Get recent transactions
      const transactionsQuery = `
        SELECT 
          mt.id,
          mt.miles,
          mt.description,
          mt.transaction_date,
          mt.source,
          lp.name as program_name
        FROM mile_transactions mt
        LEFT JOIN member_programs mp ON mt.member_program_id = mp.id
        LEFT JOIN loyalty_programs lp ON mp.program_id = lp.id
        WHERE mp.member_id = $1
        ORDER BY mt.transaction_date DESC
        LIMIT 10
      `;

      const transactionsResult = await pool.query(transactionsQuery, [memberId]);

      // Calculate total stats
      const totalPoints = programs.reduce((sum, program) => sum + (program.pointsBalance || 0), 0);
      const totalValue = programs.reduce((sum, program) => {
        const value = parseFloat(program.estimatedValue?.replace(/[^\d.-]/g, '') || '0');
        return sum + value;
      }, 0);

      res.json({
        success: true,
        data: {
          ...member,
          programs,
          recentTransactions: transactionsResult.rows,
          stats: {
            totalPrograms: programs.length,
            activePrograms: programs.filter(p => p.isActive).length,
            totalPoints,
            estimatedTotalValue: `R$ ${totalValue.toFixed(2)}`,
            recentTransactionCount: transactionsResult.rows.length
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get member error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /members
 * Create new family member (primary family member or admin only)
 */
router.post('/',
  authenticateToken,
  requireFamilyMember,
  [
    body('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Name must be between 1 and 255 characters')
      .trim(),
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('role')
      .isIn(['primary', 'extended', 'view_only'])
      .withMessage('Role must be primary, extended, or view_only'),
    body('cpf')
      .optional()
      .matches(/^\d{11}$/)
      .withMessage('CPF must be 11 digits'),
    body('phone')
      .optional()
      .isLength({ min: 10, max: 20 })
      .withMessage('Phone must be between 10 and 20 characters'),
    body('birthdate')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Birthdate must be in YYYY-MM-DD format'),
    body('profileEmoji')
      .optional()
      .isLength({ min: 1, max: 10 })
      .withMessage('Profile emoji must be between 1 and 10 characters'),
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

      // Non-admin users can only add members to their own family
      const familyId = req.user!.role === 'admin' ? 
        (req.body.familyId || req.user!.familyId) : 
        req.user!.familyId;

      // Create member
      const insertQuery = `
        INSERT INTO family_members (
          name, email, role, family_id, cpf, phone, birthdate,
          frame_color, frame_border_color, profile_emoji, is_active,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        req.body.name,
        req.body.email,
        req.body.role,
        familyId,
        req.body.cpf || null,
        req.body.phone || null,
        req.body.birthdate || null,
        req.body.frameColor || '#FED7E2',
        req.body.frameBorderColor || '#F687B3',
        req.body.profileEmoji || '👤',
        true
      ];

      const result = await pool.query(insertQuery, values);
      const newMember = result.rows[0];

      // Log activity
      await pool.query(`
        INSERT INTO activity_log (user_id, member_id, action, category, description, metadata) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        req.user!.id,
        newMember.id,
        'member_created',
        'account',
        `Created new family member: ${newMember.name}`,
        JSON.stringify({ memberId: newMember.id, memberName: newMember.name, role: newMember.role })
      ]);

      res.status(201).json({
        success: true,
        message: 'Family member created successfully',
        data: newMember,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Create member error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * PUT /members/:id
 * Update family member information
 */
router.put('/:id',
  authenticateToken,
  requireFamilyMember,
  [
    body('name')
      .optional()
      .isLength({ min: 1, max: 255 })
      .withMessage('Name must be between 1 and 255 characters')
      .trim(),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(['primary', 'extended', 'view_only'])
      .withMessage('Role must be primary, extended, or view_only'),
    body('cpf')
      .optional()
      .matches(/^\d{11}$/)
      .withMessage('CPF must be 11 digits'),
    body('phone')
      .optional()
      .isLength({ min: 10, max: 20 })
      .withMessage('Phone must be between 10 and 20 characters'),
    body('birthdate')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Birthdate must be in YYYY-MM-DD format'),
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

      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid member ID',
          timestamp: new Date().toISOString()
        });
      }

      // Get existing member
      const memberQuery = await pool.query('SELECT * FROM family_members WHERE id = $1', [memberId]);
      const existingMember = memberQuery.rows[0];

      if (!existingMember) {
        return res.status(404).json({
          success: false,
          error: 'Member not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check authorization
      if (req.user!.role !== 'admin' && req.user!.familyId !== existingMember.family_id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only edit members from your family.',
          timestamp: new Date().toISOString()
        });
      }

      // Prepare update data
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      // Only include provided fields
      const allowedFields = ['name', 'email', 'role', 'cpf', 'phone', 'birthdate', 'frameColor', 'frameBorderColor', 'profileEmoji', 'isActive'];
      allowedFields.forEach(field => {
        const dbField = field === 'frameColor' ? 'frame_color' :
                       field === 'frameBorderColor' ? 'frame_border_color' :
                       field === 'profileEmoji' ? 'profile_emoji' :
                       field === 'isActive' ? 'is_active' :
                       field.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (req.body[field] !== undefined) {
          paramCount++;
          updateFields.push(`${dbField} = $${paramCount}`);
          values.push(req.body[field]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update',
          timestamp: new Date().toISOString()
        });
      }

      // Add updated_at
      paramCount++;
      updateFields.push(`updated_at = NOW()`);
      
      // Add WHERE clause parameter
      paramCount++;
      values.push(memberId);

      const updateQuery = `
        UPDATE family_members 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(updateQuery, values);
      const updatedMember = result.rows[0];

      // Log activity
      await pool.query(`
        INSERT INTO activity_log (user_id, member_id, action, category, description, metadata) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        req.user!.id,
        updatedMember.id,
        'member_updated',
        'account',
        `Updated family member: ${updatedMember.name}`,
        JSON.stringify({ memberId: updatedMember.id, changes: Object.keys(req.body) })
      ]);

      res.json({
        success: true,
        message: 'Family member updated successfully',
        data: updatedMember,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Update member error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * DELETE /members/:id
 * Delete/deactivate family member
 */
router.delete('/:id',
  authenticateToken,
  requireFamilyMember,
  async (req: express.Request, res: express.Response) => {
    try {
      const memberId = parseInt(req.params.id);
      
      if (isNaN(memberId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid member ID',
          timestamp: new Date().toISOString()
        });
      }

      // Get existing member
      const memberQuery = await pool.query('SELECT * FROM family_members WHERE id = $1', [memberId]);
      const member = memberQuery.rows[0];

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Member not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check authorization
      if (req.user!.role !== 'admin' && req.user!.familyId !== member.family_id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only manage members from your family.',
          timestamp: new Date().toISOString()
        });
      }

      // Soft delete by deactivating instead of hard delete to preserve data integrity
      const updateQuery = `
        UPDATE family_members 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await pool.query(updateQuery, [memberId]);
      const updatedMember = result.rows[0];

      // Log activity
      await pool.query(`
        INSERT INTO activity_log (user_id, member_id, action, category, description, metadata) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        req.user!.id,
        updatedMember.id,
        'member_deactivated',
        'account',
        `Deactivated family member: ${member.name}`,
        JSON.stringify({ memberId, memberName: member.name })
      ]);

      res.json({
        success: true,
        message: 'Family member deactivated successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Delete member error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;