import { Router } from 'express';
import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../index.js';
import { familyMembers, memberPrograms, airlines, mileTransactions, activityLog } from '../../shared/schemas/database.js';
import { requireAuth } from '../middleware/auth.js';
import { ExpirationService } from '../services/expirationService.js';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const familyId = req.session.familyId!;

    // Get family members count
    const [{ count: memberCount }] = await db.select({
      count: sql<number>`count(*)::int`
    })
    .from(familyMembers)
    .where(eq(familyMembers.familyId, familyId));

    // Get total programs and miles for family members
    const programStats = await db.select({
      programCount: sql<number>`count(distinct ${memberPrograms.id})::int`,
      totalMiles: sql<number>`coalesce(sum(${memberPrograms.currentMiles}), 0)::int`,
      totalPrograms: sql<number>`count(distinct ${memberPrograms.airlineId})::int`,
    })
    .from(memberPrograms)
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .where(eq(familyMembers.familyId, familyId));

    // Get miles by airline for family members
    const milesByAirline = await db.select({
      airline: airlines.name,
      program: airlines.programName,
      totalMiles: sql<number>`coalesce(sum(${memberPrograms.currentMiles}), 0)::int`,
      memberCount: sql<number>`count(distinct ${memberPrograms.memberId})::int`,
    })
    .from(memberPrograms)
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .innerJoin(airlines, eq(memberPrograms.airlineId, airlines.id))
    .where(eq(familyMembers.familyId, familyId))
    .groupBy(airlines.id, airlines.name, airlines.programName)
    .orderBy(desc(sql`sum(${memberPrograms.currentMiles})`));

    // Get expiring miles summary
    const expirationService = new ExpirationService();
    const expiringMiles = await expirationService.getFamilyExpiringMiles(familyId, 90);
    const totalExpiringMiles = expiringMiles.reduce((sum, item) => sum + item.miles, 0);

    // Get airline mile values from database
    const airlineValues = await db.select({
      programName: airlines.programName,
      mileValueBrl: airlines.mileValueBrl,
    })
    .from(airlines);
    
    const valueMap = airlineValues.reduce((acc, airline) => {
      acc[airline.programName] = airline.mileValueBrl || 0.03;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate estimated value using actual database values
    const estimatedValue = milesByAirline.reduce((total, airline) => {
      // Value per mile from database (already in BRL)
      const valuePerMile = valueMap[airline.program] || 0.03;
      return total + (airline.totalMiles * valuePerMile);
    }, 0);

    // Limit recent activity results for the dashboard
    const activityLimit = parseInt(req.query.recentLimit as string) || 10;
    const recentActivity = await db.select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(activityLimit);

    res.json({
      totalMembers: memberCount,
      totalPrograms: programStats[0]?.programCount || 0,
      totalMiles: programStats[0]?.totalMiles || 0,
      estimatedValue: estimatedValue, // Send raw value, format on frontend
      expiringMiles: totalExpiringMiles,
      expirationValue: Math.round(estimatedValue * 0.1), // Mock value
      topPrograms: milesByAirline.map(item => ({
        airline: item.airline,
        programName: item.program,
        miles: item.totalMiles,
        value: item.totalMiles * (valueMap[item.program] || 0.03) // Use actual values
      })),
      recentActivity
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const limit = parseInt(req.query.limit as string) || 10;

    const activities = await db.select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);

    res.json({ activities });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

// Get family overview with programs
router.get('/family-overview', async (req, res) => {
  try {
    const familyId = req.session.familyId!;

    // Get family members with their programs
    const familyData = await db.select({
      member: familyMembers,
      program: memberPrograms,
      airline: airlines,
    })
    .from(familyMembers)
    .leftJoin(memberPrograms, eq(familyMembers.id, memberPrograms.memberId))
    .leftJoin(airlines, eq(memberPrograms.airlineId, airlines.id))
    .where(eq(familyMembers.familyId, familyId))
    .orderBy(familyMembers.createdAt, memberPrograms.createdAt);

    // Group by member
    const familyOverview = familyData.reduce((acc, row) => {
      const memberId = row.member.id;
      
      if (!acc[memberId]) {
        acc[memberId] = {
          member: row.member,
          programs: [],
          totalMiles: 0,
        };
      }

      if (row.program && row.airline) {
        acc[memberId].programs.push({
          ...row.program,
          airline: row.airline,
        });
        acc[memberId].totalMiles += row.program.currentMiles;
      }

      return acc;
    }, {} as Record<number, any>);

    // Transform to match frontend expectations - array of members with their programs
    const membersWithPrograms = Object.values(familyOverview).map((memberData: any) => ({
      ...memberData.member,
      programs: memberData.programs.map((program: any) => ({
        ...program,
        pointsBalance: program.currentMiles, // Map currentMiles to pointsBalance
        lastUpdated: program.lastSyncDate,
        program: {
          ...program.airline,
          company: program.airline.name, // Ensure company field exists
        },
      })),
    }));
    
    res.json(membersWithPrograms);
  } catch (error) {
    console.error('Get family overview error:', error);
    res.status(500).json({ error: 'Failed to get family overview' });
  }
});

// Get recent transactions across all programs
router.get('/recent-transactions', async (req, res) => {
  try {
    const familyId = req.session.familyId!;
    const limit = parseInt(req.query.limit as string) || 20;

    const transactions = await db.select({
      transaction: mileTransactions,
      memberName: familyMembers.name,
      airline: airlines.name,
      program: airlines.programName,
    })
    .from(mileTransactions)
    .innerJoin(memberPrograms, eq(mileTransactions.memberProgramId, memberPrograms.id))
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .innerJoin(airlines, eq(memberPrograms.airlineId, airlines.id))
    .where(eq(familyMembers.familyId, familyId))
    .orderBy(desc(mileTransactions.transactionDate))
    .limit(limit);

    res.json({ transactions });
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ error: 'Failed to get recent transactions' });
  }
});

export default router;