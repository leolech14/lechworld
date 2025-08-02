import { Router } from 'express';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { db } from '../index.js';
import { mileTransactions, memberPrograms, familyMembers, airlines } from '../../shared/schemas/database.js';
import { requireAuth } from '../middleware/auth-vercel.js';
import { addMonths, format } from 'date-fns';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Get transactions for a member program
router.get('/member-program/:programId', async (req, res) => {
  try {
    const familyId = (req as any).session.familyId;
    const programId = parseInt(req.params.programId);

    // Verify ownership
    const [program] = await db.select({
      memberProgram: memberPrograms,
      member: familyMembers,
    })
    .from(memberPrograms)
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .where(and(
      eq(memberPrograms.id, programId),
      eq(familyMembers.familyId, familyId)
    ))
    .limit(1);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Get transactions
    const transactions = await db.select()
      .from(mileTransactions)
      .where(eq(mileTransactions.memberProgramId, programId))
      .orderBy(desc(mileTransactions.transactionDate));

    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Add a transaction
router.post('/', async (req, res) => {
  try {
    const familyId = (req as any).session.familyId;
    const { 
      memberProgramId, 
      miles, 
      description, 
      transactionDate, 
      source,
      referenceNumber
    } = req.body;

    // Verify ownership
    const [program] = await db.select({
      memberProgram: memberPrograms,
      member: familyMembers,
      airline: airlines,
    })
    .from(memberPrograms)
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .innerJoin(airlines, eq(memberPrograms.airlineId, airlines.id))
    .where(and(
      eq(memberPrograms.id, memberProgramId),
      eq(familyMembers.familyId, familyId)
    ))
    .limit(1);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Calculate expiration date based on airline rules
    let expirationDate = null;
    if (program.airline.expirationMonths && miles > 0) {
      const txDate = new Date(transactionDate);
      expirationDate = addMonths(txDate, program.airline.expirationMonths);
    }

    // Create transaction
    const [newTransaction] = await db.insert(mileTransactions).values({
      memberProgramId,
      miles,
      description,
      transactionDate: new Date(transactionDate),
      expirationDate,
      source,
      referenceNumber,
    }).returning();

    // Update current balance
    await db.update(memberPrograms)
      .set({
        currentMiles: sql`${memberPrograms.currentMiles} + ${miles}`,
        lifetimeMiles: miles > 0 ? sql`COALESCE(${memberPrograms.lifetimeMiles}, 0) + ${miles}` : memberPrograms.lifetimeMiles,
        updatedAt: new Date(),
      })
      .where(eq(memberPrograms.id, memberProgramId));

    res.status(201).json({ transaction: newTransaction });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Get expiring miles across all programs
router.get('/expiring', async (req, res) => {
  try {
    const familyId = (req as any).session.familyId;
    const days = parseInt(req.query.days as string) || 90;
    
    const cutoffDate = addMonths(new Date(), days / 30);

    // Get all expiring transactions
    const expiringTransactions = await db.select({
      transaction: mileTransactions,
      memberProgram: memberPrograms,
      member: familyMembers,
      airline: airlines,
    })
    .from(mileTransactions)
    .innerJoin(memberPrograms, eq(mileTransactions.memberProgramId, memberPrograms.id))
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .innerJoin(airlines, eq(memberPrograms.airlineId, airlines.id))
    .where(and(
      eq(familyMembers.familyId, familyId),
      gte(mileTransactions.miles, 0), // Only positive (earned) miles
      lte(mileTransactions.expirationDate, cutoffDate),
      gte(mileTransactions.expirationDate, new Date()) // Not already expired
    ))
    .orderBy(mileTransactions.expirationDate);

    // Group by member and program
    const grouped = expiringTransactions.reduce((acc, item) => {
      const key = `${item.member.id}-${item.airline.id}`;
      if (!acc[key]) {
        acc[key] = {
          member: item.member,
          airline: item.airline,
          memberProgram: item.memberProgram,
          totalExpiringMiles: 0,
          transactions: [],
        };
      }
      acc[key].totalExpiringMiles += item.transaction.miles;
      acc[key].transactions.push(item.transaction);
      return acc;
    }, {} as Record<string, any>);

    res.json({ 
      expiringPrograms: Object.values(grouped),
      totalExpiringMiles: Object.values(grouped).reduce((sum: number, prog: any) => sum + prog.totalExpiringMiles, 0),
    });
  } catch (error) {
    console.error('Get expiring miles error:', error);
    res.status(500).json({ error: 'Failed to get expiring miles' });
  }
});

export default router;