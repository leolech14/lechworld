/**
 * @fileoverview Member program enrollment routes
 * @description CRUD operations for member program enrollments with proper authentication and authorization
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { eq, desc, count, sql, and, or } from 'drizzle-orm';
import { 
  memberPrograms, 
  loyaltyPrograms,
  familyMembers,
  mileTransactions,
  activityLog,
  insertMemberProgramSchema,
  MemberProgram
} from '@monorepo/database';
import { db, client } from '../database/connection';
import { 
  authenticateToken, 
  requireAdmin,
  requireStaffOrAdmin,
  requireFamilyMember
} from '../auth/middleware';


const router = express.Router();

/**
 * GET /member-programs
 * Get member program enrollments (filtered by family unless admin)
 */
router.get('/',
  authenticateToken,
  requireFamilyMember,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('memberId').optional().isInt({ min: 1 }).withMessage('Member ID must be a positive integer'),
    query('programId').optional().isInt({ min: 1 }).withMessage('Program ID must be a positive integer'),
    query('statusLevel').optional().isIn(['basic', 'silver', 'gold', 'platinum', 'diamond']).withMessage('Invalid status level'),
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
      const memberId = req.query.memberId ? parseInt(req.query.memberId as string) : undefined;
      const programId = req.query.programId ? parseInt(req.query.programId as string) : undefined;
      const statusLevel = req.query.statusLevel as string;
      const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = [];
      
      // Family restriction (unless admin)
      if (req.user!.role !== 'admin') {
        conditions.push(eq(familyMembers.familyId, req.user!.familyId));
      }
      
      if (memberId) {
        conditions.push(eq(memberPrograms.memberId, memberId));
      }
      
      if (programId) {
        conditions.push(eq(memberPrograms.programId, programId));
      }
      
      if (statusLevel) {
        conditions.push(eq(memberPrograms.statusLevel, statusLevel as any));
      }
      
      if (active !== undefined) {
        conditions.push(eq(memberPrograms.isActive, active));
      }

      const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

      // Get member programs with related data
      const enrollments = await db
        .select({
          id: memberPrograms.id,
          accountNumber: memberPrograms.accountNumber,
          pointsBalance: memberPrograms.pointsBalance,
          eliteTier: memberPrograms.eliteTier,
          statusLevel: memberPrograms.statusLevel,
          yearlyEarnings: memberPrograms.yearlyEarnings,
          yearlySpending: memberPrograms.yearlySpending,
          estimatedValue: memberPrograms.estimatedValue,
          notes: memberPrograms.notes,
          expirationDate: memberPrograms.expirationDate,
          isActive: memberPrograms.isActive,
          lastUpdated: memberPrograms.lastUpdated,
          createdAt: memberPrograms.createdAt,
          member: {
            id: familyMembers.id,
            name: familyMembers.name,
            email: familyMembers.email,
            role: familyMembers.role,
            profileEmoji: familyMembers.profileEmoji,
          },
          program: {
            id: loyaltyPrograms.id,
            name: loyaltyPrograms.name,
            company: loyaltyPrograms.company,
            code: loyaltyPrograms.code,
            programType: loyaltyPrograms.programType,
            category: loyaltyPrograms.category,
            logoColor: loyaltyPrograms.logoColor,
            pointValue: loyaltyPrograms.pointValue,
          }
        })
        .from(memberPrograms)
        .leftJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
        .leftJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
        .where(whereCondition)
        .orderBy(desc(memberPrograms.lastUpdated))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(memberPrograms)
        .leftJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
        .where(whereCondition);

      const total = totalResult?.count || 0;
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: enrollments,
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
      console.error('Get member programs error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * GET /member-programs/:id
 * Get specific member program enrollment with detailed information
 */
router.get('/:id',
  authenticateToken,
  requireFamilyMember,
  async (req: express.Request, res: express.Response) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      
      if (isNaN(enrollmentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid enrollment ID',
          timestamp: new Date().toISOString()
        });
      }

      // Get enrollment details with related data
      const [enrollment] = await db
        .select({
          id: memberPrograms.id,
          accountNumber: memberPrograms.accountNumber,
          login: memberPrograms.login,
          cpf: memberPrograms.cpf,
          pointsBalance: memberPrograms.pointsBalance,
          eliteTier: memberPrograms.eliteTier,
          statusLevel: memberPrograms.statusLevel,
          yearlyEarnings: memberPrograms.yearlyEarnings,
          yearlySpending: memberPrograms.yearlySpending,
          estimatedValue: memberPrograms.estimatedValue,
          notes: memberPrograms.notes,
          customFields: memberPrograms.customFields,
          expirationDate: memberPrograms.expirationDate,
          isActive: memberPrograms.isActive,
          lastUpdated: memberPrograms.lastUpdated,
          createdAt: memberPrograms.createdAt,
          member: {
            id: familyMembers.id,
            name: familyMembers.name,
            email: familyMembers.email,
            role: familyMembers.role,
            profileEmoji: familyMembers.profileEmoji,
            familyId: familyMembers.familyId,
          },
          program: {
            id: loyaltyPrograms.id,
            name: loyaltyPrograms.name,
            company: loyaltyPrograms.company,
            code: loyaltyPrograms.code,
            programType: loyaltyPrograms.programType,
            category: loyaltyPrograms.category,
            logoColor: loyaltyPrograms.logoColor,
            pointValue: loyaltyPrograms.pointValue,
            transferEnabled: loyaltyPrograms.transferEnabled,
            expirationMonths: loyaltyPrograms.expirationMonths,
            website: loyaltyPrograms.website,
            phoneNumber: loyaltyPrograms.phoneNumber,
          }
        })
        .from(memberPrograms)
        .leftJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
        .leftJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
        .where(eq(memberPrograms.id, enrollmentId))
        .limit(1);

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          error: 'Member program enrollment not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check authorization
      if (req.user!.role !== 'admin' && req.user!.familyId !== enrollment.member.familyId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only view enrollments from your family.',
          timestamp: new Date().toISOString()
        });
      }

      // Get recent transactions
      const recentTransactions = await db
        .select({
          id: mileTransactions.id,
          miles: mileTransactions.miles,
          description: mileTransactions.description,
          transactionDate: mileTransactions.transactionDate,
          expirationDate: mileTransactions.expirationDate,
          source: mileTransactions.source,
          referenceNumber: mileTransactions.referenceNumber,
          createdAt: mileTransactions.createdAt,
        })
        .from(mileTransactions)
        .where(eq(mileTransactions.memberProgramId, enrollmentId))
        .orderBy(desc(mileTransactions.transactionDate))
        .limit(20);

      // Calculate transaction statistics
      const [transactionStats] = await db
        .select({
          totalTransactions: count(mileTransactions.id),
          totalEarned: sql<number>`COALESCE(SUM(CASE WHEN ${mileTransactions.miles} > 0 THEN ${mileTransactions.miles} ELSE 0 END), 0)`,
          totalRedeemed: sql<number>`COALESCE(SUM(CASE WHEN ${mileTransactions.miles} < 0 THEN ABS(${mileTransactions.miles}) ELSE 0 END), 0)`,
          netMiles: sql<number>`COALESCE(SUM(${mileTransactions.miles}), 0)`,
        })
        .from(mileTransactions)
        .where(eq(mileTransactions.memberProgramId, enrollmentId));

      res.json({
        success: true,
        data: {
          ...enrollment,
          recentTransactions,
          transactionStats: transactionStats || {
            totalTransactions: 0,
            totalEarned: 0,
            totalRedeemed: 0,
            netMiles: 0
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Get member program error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * POST /member-programs
 * Create new member program enrollment
 */
router.post('/',
  authenticateToken,
  requireFamilyMember,
  [
    body('memberId')
      .isInt({ min: 1 })
      .withMessage('Member ID is required and must be a positive integer'),
    body('programId')
      .isInt({ min: 1 })
      .withMessage('Program ID is required and must be a positive integer'),
    body('accountNumber')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Account number must be between 1 and 100 characters')
      .trim(),
    body('pointsBalance')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Points balance must be a non-negative integer'),
    body('statusLevel')
      .optional()
      .isIn(['basic', 'silver', 'gold', 'platinum', 'diamond'])
      .withMessage('Status level must be basic, silver, gold, platinum, or diamond'),
    body('yearlyEarnings')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Yearly earnings must be a non-negative integer'),
    body('yearlySpending')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Yearly spending must be a non-negative integer'),
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

      const { memberId, programId } = req.body;

      // Verify member exists and belongs to user's family (unless admin)
      const [member] = await db
        .select()
        .from(familyMembers)
        .where(eq(familyMembers.id, memberId))
        .limit(1);

      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Family member not found',
          timestamp: new Date().toISOString()
        });
      }

      if (req.user!.role !== 'admin' && req.user!.familyId !== member.familyId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only create enrollments for members in your family.',
          timestamp: new Date().toISOString()
        });
      }

      // Verify program exists
      const [program] = await db
        .select()
        .from(loyaltyPrograms)
        .where(eq(loyaltyPrograms.id, programId))
        .limit(1);

      if (!program) {
        return res.status(404).json({
          success: false,
          error: 'Loyalty program not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check if enrollment already exists
      const [existingEnrollment] = await db
        .select()
        .from(memberPrograms)
        .where(and(
          eq(memberPrograms.memberId, memberId),
          eq(memberPrograms.programId, programId)
        ))
        .limit(1);

      if (existingEnrollment) {
        return res.status(409).json({
          success: false,
          error: 'Member is already enrolled in this program',
          timestamp: new Date().toISOString()
        });
      }

      const enrollmentData = {
        memberId,
        programId,
        accountNumber: req.body.accountNumber || null,
        login: req.body.login || null,
        cpf: req.body.cpf || null,
        pointsBalance: req.body.pointsBalance || 0,
        eliteTier: req.body.eliteTier || null,
        statusLevel: req.body.statusLevel || 'basic',
        yearlyEarnings: req.body.yearlyEarnings || 0,
        yearlySpending: req.body.yearlySpending || 0,
        estimatedValue: req.body.estimatedValue || null,
        notes: req.body.notes || null,
        customFields: req.body.customFields || null,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : null,
        lastUpdatedBy: req.user!.id,
        isActive: req.body.isActive !== false, // Default to true unless explicitly false
      };

      // Create enrollment
      const [newEnrollment] = await db
        .insert(memberPrograms)
        .values(enrollmentData)
        .returning();

      // Log activity
      await db.insert(activityLog).values({
        userId: req.user!.id,
        memberId: member.id,
        action: 'enrollment_created',
        category: 'miles',
        description: `Enrolled ${member.name} in ${program.name}`,
        metadata: { 
          enrollmentId: newEnrollment.id,
          memberName: member.name,
          programName: program.name,
          accountNumber: newEnrollment.accountNumber
        }
      });

      res.status(201).json({
        success: true,
        message: 'Member program enrollment created successfully',
        data: newEnrollment,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Create member program error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * PUT /member-programs/:id
 * Update member program enrollment
 */
router.put('/:id',
  authenticateToken,
  requireFamilyMember,
  [
    body('accountNumber')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Account number must be between 1 and 100 characters')
      .trim(),
    body('pointsBalance')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Points balance must be a non-negative integer'),
    body('statusLevel')
      .optional()
      .isIn(['basic', 'silver', 'gold', 'platinum', 'diamond'])
      .withMessage('Status level must be basic, silver, gold, platinum, or diamond'),
    body('yearlyEarnings')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Yearly earnings must be a non-negative integer'),
    body('yearlySpending')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Yearly spending must be a non-negative integer'),
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

      const enrollmentId = parseInt(req.params.id);
      
      if (isNaN(enrollmentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid enrollment ID',
          timestamp: new Date().toISOString()
        });
      }

      // Get existing enrollment with member info
      const [existingEnrollment] = await db
        .select({
          id: memberPrograms.id,
          memberId: memberPrograms.memberId,
          programId: memberPrograms.programId,
          pointsBalance: memberPrograms.pointsBalance,
          memberName: familyMembers.name,
          familyId: familyMembers.familyId,
        })
        .from(memberPrograms)
        .leftJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
        .where(eq(memberPrograms.id, enrollmentId))
        .limit(1);

      if (!existingEnrollment) {
        return res.status(404).json({
          success: false,
          error: 'Member program enrollment not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check authorization
      if (req.user!.role !== 'admin' && req.user!.familyId !== existingEnrollment.familyId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only edit enrollments from your family.',
          timestamp: new Date().toISOString()
        });
      }

      // Prepare update data
      const updateData: any = {
        lastUpdated: new Date(),
        lastUpdatedBy: req.user!.id
      };

      // Track changes for logging
      const changes = [];

      // Only include provided fields
      const allowedFields = [
        'accountNumber', 'login', 'cpf', 'pointsBalance', 'eliteTier', 'statusLevel',
        'yearlyEarnings', 'yearlySpending', 'estimatedValue', 'notes', 'customFields',
        'expirationDate', 'isActive'
      ];
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
          changes.push(field);
        }
      });

      // Handle date fields
      if (req.body.expirationDate) {
        updateData.expirationDate = new Date(req.body.expirationDate);
      }

      // Update enrollment
      const [updatedEnrollment] = await db
        .update(memberPrograms)
        .set(updateData)
        .where(eq(memberPrograms.id, enrollmentId))
        .returning();

      // Log activity
      await db.insert(activityLog).values({
        userId: req.user!.id,
        memberId: existingEnrollment.memberId,
        action: 'enrollment_updated',
        category: 'miles',
        description: `Updated program enrollment for ${existingEnrollment.memberName}`,
        metadata: { 
          enrollmentId: updatedEnrollment.id,
          memberName: existingEnrollment.memberName,
          changes,
          oldBalance: existingEnrollment.pointsBalance,
          newBalance: updatedEnrollment.pointsBalance
        }
      });

      res.json({
        success: true,
        message: 'Member program enrollment updated successfully',
        data: updatedEnrollment,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Update member program error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

/**
 * DELETE /member-programs/:id
 * Delete/deactivate member program enrollment
 */
router.delete('/:id',
  authenticateToken,
  requireFamilyMember,
  async (req: express.Request, res: express.Response) => {
    try {
      const enrollmentId = parseInt(req.params.id);
      
      if (isNaN(enrollmentId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid enrollment ID',
          timestamp: new Date().toISOString()
        });
      }

      // Get existing enrollment with member info
      const [enrollment] = await db
        .select({
          id: memberPrograms.id,
          memberId: memberPrograms.memberId,
          programId: memberPrograms.programId,
          memberName: familyMembers.name,
          familyId: familyMembers.familyId,
          programName: loyaltyPrograms.name,
        })
        .from(memberPrograms)
        .leftJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
        .leftJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
        .where(eq(memberPrograms.id, enrollmentId))
        .limit(1);

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          error: 'Member program enrollment not found',
          timestamp: new Date().toISOString()
        });
      }

      // Check authorization
      if (req.user!.role !== 'admin' && req.user!.familyId !== enrollment.familyId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. You can only manage enrollments from your family.',
          timestamp: new Date().toISOString()
        });
      }

      // Check if there are transactions
      const [transactionCount] = await db
        .select({ count: count() })
        .from(mileTransactions)
        .where(eq(mileTransactions.memberProgramId, enrollmentId));

      if (transactionCount && transactionCount.count > 0) {
        // Soft delete by deactivating to preserve transaction history
        await db
          .update(memberPrograms)
          .set({ 
            isActive: false,
            lastUpdated: new Date(),
            lastUpdatedBy: req.user!.id
          })
          .where(eq(memberPrograms.id, enrollmentId));

        // Log activity
        await db.insert(activityLog).values({
          userId: req.user!.id,
          memberId: enrollment.memberId,
          action: 'enrollment_deactivated',
          category: 'miles',
          description: `Deactivated ${enrollment.memberName}'s enrollment in ${enrollment.programName}`,
          metadata: { 
            enrollmentId,
            memberName: enrollment.memberName,
            programName: enrollment.programName,
            transactionCount: transactionCount.count
          }
        });

        res.json({
          success: true,
          message: 'Member program enrollment deactivated successfully (transaction history preserved)',
          timestamp: new Date().toISOString()
        });
      } else {
        // Hard delete if no transactions
        await db
          .delete(memberPrograms)
          .where(eq(memberPrograms.id, enrollmentId));

        // Log activity
        await db.insert(activityLog).values({
          userId: req.user!.id,
          memberId: enrollment.memberId,
          action: 'enrollment_deleted',
          category: 'miles',
          description: `Deleted ${enrollment.memberName}'s enrollment in ${enrollment.programName}`,
          metadata: { 
            enrollmentId,
            memberName: enrollment.memberName,
            programName: enrollment.programName
          }
        });

        res.json({
          success: true,
          message: 'Member program enrollment deleted successfully',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('Delete member program error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
);

export default router;