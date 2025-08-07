/**
 * @fileoverview Database query helpers for Family Loyalty Program
 * @description Type-safe query helpers using Drizzle ORM
 */

import { eq, desc, asc, and, or, gte, lte, isNull, isNotNull, inArray, sql } from 'drizzle-orm';
import type { DatabaseInstance } from '../index';
import { 
  users, 
  families, 
  familyMembers, 
  loyaltyPrograms, 
  memberPrograms, 
  mileTransactions, 
  activityLog,
  notificationPreferences,
} from '../schema';
import { encryptionUtils } from '../utils/encryption';

// ============================================================================
// FAMILY QUERIES
// ============================================================================

export const familyQueries = {
  /**
   * Get family with all members
   */
  findByIdWithMembers: (db: DatabaseInstance, familyId: number) =>
    db
      .select()
      .from(families)
      .leftJoin(familyMembers, eq(families.id, familyMembers.familyId))
      .where(eq(families.id, familyId)),

  /**
   * Get family overview with stats
   */
  getOverview: async (db: DatabaseInstance, familyId: number) => {
    const family = await db.select().from(families).where(eq(families.id, familyId)).limit(1);
    const members = await db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId));
    
    const totalPrograms = await db
      .select({ count: sql<number>`count(*)` })
      .from(memberPrograms)
      .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(memberPrograms.isActive, true)
      ));

    const totalPoints = await db
      .select({ total: sql<number>`sum(${memberPrograms.pointsBalance})` })
      .from(memberPrograms)
      .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(memberPrograms.isActive, true)
      ));

    return {
      family: family[0],
      members,
      totalPrograms: totalPrograms[0]?.count || 0,
      totalPoints: totalPoints[0]?.total || 0,
    };
  },
};

// ============================================================================
// USER QUERIES
// ============================================================================

export const userQueries = {
  /**
   * Find user by email for authentication
   */
  findByEmail: (db: DatabaseInstance, email: string) =>
    db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1),

  /**
   * Find user by username
   */
  findByUsername: (db: DatabaseInstance, username: string) =>
    db
      .select()
      .from(users)
      .where(eq(users.username, username.toLowerCase()))
      .limit(1),

  /**
   * Get user with family and member info
   */
  findByIdWithDetails: (db: DatabaseInstance, userId: number) =>
    db
      .select()
      .from(users)
      .leftJoin(families, eq(users.familyId, families.id))
      .leftJoin(familyMembers, eq(users.id, familyMembers.userId))
      .where(eq(users.id, userId))
      .limit(1),

  /**
   * Update last login timestamp
   */
  updateLastLogin: (db: DatabaseInstance, userId: number) =>
    db
      .update(users)
      .set({ 
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, userId))
      .returning(),

  /**
   * Increment failed login attempts
   */
  incrementFailedLogin: (db: DatabaseInstance, userId: number) =>
    db
      .update(users)
      .set({ 
        failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
      })
      .where(eq(users.id, userId))
      .returning(),
};

// ============================================================================
// FAMILY MEMBER QUERIES
// ============================================================================

export const familyMemberQueries = {
  /**
   * Get all members in a family
   */
  findByFamily: (db: DatabaseInstance, familyId: number) =>
    db
      .select()
      .from(familyMembers)
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.isActive, true)
      ))
      .orderBy(asc(familyMembers.name)),

  /**
   * Get member with all their programs
   */
  findByIdWithPrograms: (db: DatabaseInstance, memberId: number) =>
    db
      .select()
      .from(familyMembers)
      .leftJoin(memberPrograms, eq(familyMembers.id, memberPrograms.memberId))
      .leftJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
      .where(and(
        eq(familyMembers.id, memberId),
        eq(familyMembers.isActive, true)
      )),

  /**
   * Get members with program summaries
   */
  getMembersWithProgramStats: (db: DatabaseInstance, familyId: number) =>
    db
      .select({
        member: familyMembers,
        totalPrograms: sql<number>`count(${memberPrograms.id})`,
        totalPoints: sql<number>`sum(${memberPrograms.pointsBalance})`,
        estimatedValue: sql<string>`sum(${memberPrograms.pointsBalance} * ${loyaltyPrograms.pointValue}::numeric)`,
      })
      .from(familyMembers)
      .leftJoin(memberPrograms, and(
        eq(familyMembers.id, memberPrograms.memberId),
        eq(memberPrograms.isActive, true)
      ))
      .leftJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(familyMembers.isActive, true)
      ))
      .groupBy(familyMembers.id)
      .orderBy(asc(familyMembers.name)),
};

// ============================================================================
// LOYALTY PROGRAM QUERIES
// ============================================================================

export const loyaltyProgramQueries = {
  /**
   * Get all active programs
   */
  findActive: (db: DatabaseInstance) =>
    db
      .select()
      .from(loyaltyPrograms)
      .where(eq(loyaltyPrograms.isActive, true))
      .orderBy(asc(loyaltyPrograms.name)),

  /**
   * Get programs by category
   */
  findByCategory: (db: DatabaseInstance, category: string) =>
    db
      .select()
      .from(loyaltyPrograms)
      .where(and(
        eq(loyaltyPrograms.category, category),
        eq(loyaltyPrograms.isActive, true)
      ))
      .orderBy(asc(loyaltyPrograms.name)),

  /**
   * Search programs by name or company
   */
  search: (db: DatabaseInstance, searchTerm: string) =>
    db
      .select()
      .from(loyaltyPrograms)
      .where(and(
        or(
          sql`${loyaltyPrograms.name} ILIKE ${`%${searchTerm}%`}`,
          sql`${loyaltyPrograms.company} ILIKE ${`%${searchTerm}%`}`
        ),
        eq(loyaltyPrograms.isActive, true)
      ))
      .orderBy(asc(loyaltyPrograms.name)),
};

// ============================================================================
// MEMBER PROGRAM QUERIES
// ============================================================================

export const memberProgramQueries = {
  /**
   * Get member's programs with decrypted passwords
   */
  findByMemberWithDecryption: async (db: DatabaseInstance, memberId: number) => {
    const programs = await db
      .select()
      .from(memberPrograms)
      .innerJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
      .where(and(
        eq(memberPrograms.memberId, memberId),
        eq(memberPrograms.isActive, true)
      ))
      .orderBy(asc(loyaltyPrograms.name));

    // Decrypt sensitive data
    return programs.map(({ member_programs, loyalty_programs }) => ({
      ...member_programs,
      program: loyalty_programs,
      ...encryptionUtils.decryptMemberProgramData({
        sitePasswordEncrypted: member_programs.sitePasswordEncrypted,
        milesPasswordEncrypted: member_programs.milesPasswordEncrypted,
      }),
    }));
  },

  /**
   * Get programs with expiring points
   */
  findExpiringPoints: (db: DatabaseInstance, familyId: number, daysAhead: number = 90) =>
    db
      .select()
      .from(memberPrograms)
      .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
      .innerJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(memberPrograms.isActive, true),
        isNotNull(memberPrograms.expirationDate),
        lte(memberPrograms.expirationDate, sql`NOW() + INTERVAL '${daysAhead} days'`)
      ))
      .orderBy(asc(memberPrograms.expirationDate)),

  /**
   * Get top programs by points balance
   */
  findTopByPoints: (db: DatabaseInstance, familyId: number, limit: number = 5) =>
    db
      .select()
      .from(memberPrograms)
      .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
      .innerJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
      .where(and(
        eq(familyMembers.familyId, familyId),
        eq(memberPrograms.isActive, true)
      ))
      .orderBy(desc(memberPrograms.pointsBalance))
      .limit(limit),
};

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

export const transactionQueries = {
  /**
   * Get recent transactions for a family
   */
  findRecentByFamily: (db: DatabaseInstance, familyId: number, limit: number = 20) =>
    db
      .select()
      .from(mileTransactions)
      .innerJoin(memberPrograms, eq(mileTransactions.memberProgramId, memberPrograms.id))
      .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
      .innerJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
      .where(eq(familyMembers.familyId, familyId))
      .orderBy(desc(mileTransactions.createdAt))
      .limit(limit),

  /**
   * Get transactions by member program
   */
  findByMemberProgram: (db: DatabaseInstance, memberProgramId: number) =>
    db
      .select()
      .from(mileTransactions)
      .where(eq(mileTransactions.memberProgramId, memberProgramId))
      .orderBy(desc(mileTransactions.transactionDate)),

  /**
   * Get transaction statistics
   */
  getStats: (db: DatabaseInstance, familyId: number, dateRange?: { start: Date; end: Date }) => {
    let query = db
      .select({
        totalEarned: sql<number>`sum(case when ${mileTransactions.miles} > 0 then ${mileTransactions.miles} else 0 end)`,
        totalRedeemed: sql<number>`abs(sum(case when ${mileTransactions.miles} < 0 then ${mileTransactions.miles} else 0 end))`,
        transactionCount: sql<number>`count(*)`,
      })
      .from(mileTransactions)
      .innerJoin(memberPrograms, eq(mileTransactions.memberProgramId, memberPrograms.id))
      .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
      .where(eq(familyMembers.familyId, familyId));

    if (dateRange) {
      query = query.where(and(
        gte(mileTransactions.transactionDate, dateRange.start),
        lte(mileTransactions.transactionDate, dateRange.end)
      ));
    }

    return query;
  },
};

// ============================================================================
// ACTIVITY LOG QUERIES
// ============================================================================

export const activityLogQueries = {
  /**
   * Get recent activity for a family
   */
  findRecentByFamily: (db: DatabaseInstance, familyId: number, limit: number = 50) =>
    db
      .select()
      .from(activityLog)
      .innerJoin(users, eq(activityLog.userId, users.id))
      .leftJoin(familyMembers, eq(activityLog.memberId, familyMembers.id))
      .where(eq(users.familyId, familyId))
      .orderBy(desc(activityLog.timestamp))
      .limit(limit),

  /**
   * Get activity by category
   */
  findByCategory: (db: DatabaseInstance, familyId: number, category: string) =>
    db
      .select()
      .from(activityLog)
      .innerJoin(users, eq(activityLog.userId, users.id))
      .where(and(
        eq(users.familyId, familyId),
        eq(activityLog.category, category)
      ))
      .orderBy(desc(activityLog.timestamp)),

  /**
   * Log a new activity
   */
  create: (db: DatabaseInstance, activity: typeof activityLog.$inferInsert) =>
    db.insert(activityLog).values(activity).returning(),
};

// ============================================================================
// DASHBOARD QUERIES
// ============================================================================

export const dashboardQueries = {
  /**
   * Get complete dashboard statistics
   */
  getStats: async (db: DatabaseInstance, familyId: number) => {
    const [
      memberCount,
      programCount,
      pointsTotal,
      expiringPoints,
      recentTransactionCount,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(familyMembers)
        .where(and(
          eq(familyMembers.familyId, familyId),
          eq(familyMembers.isActive, true)
        )),

      db
        .select({ count: sql<number>`count(*)` })
        .from(memberPrograms)
        .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
        .where(and(
          eq(familyMembers.familyId, familyId),
          eq(memberPrograms.isActive, true)
        )),

      db
        .select({ 
          total: sql<number>`sum(${memberPrograms.pointsBalance})`,
          estimated: sql<string>`sum(${memberPrograms.pointsBalance} * ${loyaltyPrograms.pointValue}::numeric)`,
        })
        .from(memberPrograms)
        .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
        .innerJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
        .where(and(
          eq(familyMembers.familyId, familyId),
          eq(memberPrograms.isActive, true)
        )),

      db
        .select({ count: sql<number>`count(*)` })
        .from(memberPrograms)
        .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
        .where(and(
          eq(familyMembers.familyId, familyId),
          eq(memberPrograms.isActive, true),
          isNotNull(memberPrograms.expirationDate),
          lte(memberPrograms.expirationDate, sql`NOW() + INTERVAL '90 days'`)
        )),

      db
        .select({ count: sql<number>`count(*)` })
        .from(mileTransactions)
        .innerJoin(memberPrograms, eq(mileTransactions.memberProgramId, memberPrograms.id))
        .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
        .where(and(
          eq(familyMembers.familyId, familyId),
          gte(mileTransactions.createdAt, sql`NOW() - INTERVAL '30 days'`)
        )),
    ]);

    return {
      totalMembers: memberCount[0]?.count || 0,
      activePrograms: programCount[0]?.count || 0,
      totalPoints: pointsTotal[0]?.total || 0,
      estimatedValue: pointsTotal[0]?.estimated || "0.00",
      expiringPoints: expiringPoints[0]?.count || 0,
      recentTransactions: recentTransactionCount[0]?.count || 0,
    };
  },
};