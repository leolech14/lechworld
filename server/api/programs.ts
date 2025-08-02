import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../index.js';
import { airlines, memberPrograms, familyMembers } from '../../shared/schemas/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Get all available airlines/programs
router.get('/airlines', async (req, res) => {
  try {
    const allAirlines = await db.select().from(airlines).orderBy(airlines.name);
    res.json({ airlines: allAirlines });
  } catch (error) {
    console.error('Get airlines error:', error);
    res.status(500).json({ error: 'Failed to get airlines' });
  }
});

// Add a program to a member
router.post('/member/:memberId', async (req, res) => {
  try {
    const familyId = req.session.familyId!;
    const memberId = parseInt(req.params.memberId);
    const {
      airlineId,
      memberNumber,
      statusLevel,
      currentMiles,
      pin,
      documentNumber,
      documentType,
      accountPassword
    } = req.body;

    // Verify member ownership
    const [member] = await db.select().from(familyMembers)
      .where(and(eq(familyMembers.id, memberId), eq(familyMembers.familyId, familyId)))
      .limit(1);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Check if program already exists
    const existing = await db.select().from(memberPrograms)
      .where(and(eq(memberPrograms.memberId, memberId), eq(memberPrograms.airlineId, airlineId)))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Program already exists for this member' });
    }

    // Create member program
    const [newProgram] = await db.insert(memberPrograms).values({
      memberId,
      airlineId,
      memberNumber,
      statusLevel,
      currentMiles: currentMiles || 0,
      pin,
      documentNumber,
      documentType,
      accountPassword,
      syncMethod: 'manual',
    }).returning();

    // Get airline details
    const [airline] = await db.select().from(airlines).where(eq(airlines.id, airlineId)).limit(1);

    res.status(201).json({ 
      memberProgram: newProgram,
      airline 
    });
  } catch (error) {
    console.error('Add program error:', error);
    res.status(500).json({ error: 'Failed to add program' });
  }
});

// Update a member's program
router.put('/:id', async (req, res) => {
  console.log('\n=== PROGRAMS PUT HANDLER ===');
  console.log('Full URL:', req.originalUrl);
  console.log('Params:', req.params);
  console.log('Program ID:', req.params.id);
  console.log('Session:', req.session);
  console.log('Body:', req.body);
  
  try {
    const familyId = req.session.familyId!;
    const memberProgramId = parseInt(req.params.id);
    console.log('Parsed ID:', memberProgramId, 'Type:', typeof memberProgramId);
    console.log('Session familyId:', familyId);
    const { 
      memberNumber, 
      statusLevel, 
      currentMiles,
      pin,
      documentNumber,
      documentType,
      accountPassword,
      googleWalletEnabled,
      customFields
    } = req.body;

    // Verify ownership through member
    console.log('Checking ownership - memberProgramId:', memberProgramId, 'familyId:', familyId);
    
    // First check what's actually in the database
    const [checkProgram] = await db.select({
      memberProgram: memberPrograms,
      member: familyMembers,
    })
    .from(memberPrograms)
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .where(eq(memberPrograms.id, memberProgramId))
    .limit(1);

    if (checkProgram) {
      console.log('Database check:', {
        foundFamilyId: checkProgram.member.familyId,
        expectedFamilyId: familyId,
        matches: checkProgram.member.familyId === familyId
      });
    }
    
    const [program] = await db.select({
      memberProgram: memberPrograms,
      member: familyMembers,
    })
    .from(memberPrograms)
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .where(and(
      eq(memberPrograms.id, memberProgramId),
      eq(familyMembers.familyId, familyId)
    ))
    .limit(1);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const [updatedProgram] = await db.update(memberPrograms)
      .set({
        memberNumber,
        statusLevel,
        currentMiles,
        pin,
        documentNumber,
        documentType,
        accountPassword,
        googleWalletEnabled,
        customFields: customFields || [],
        updatedAt: new Date(),
      })
      .where(eq(memberPrograms.id, memberProgramId))
      .returning();

    res.json({ memberProgram: updatedProgram });
  } catch (error) {
    console.error('Update program error:', error);
    console.error('Request body:', req.body);
    console.error('Program ID:', req.params.id);
    res.status(500).json({ error: 'Failed to update program', details: error.message });
  }
});

// Delete a member's program
router.delete('/:id', async (req, res) => {
  try {
    const familyId = req.session.familyId!;
    const memberProgramId = parseInt(req.params.id);

    // Verify ownership through member
    const [program] = await db.select({
      memberProgram: memberPrograms,
      member: familyMembers,
    })
    .from(memberPrograms)
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .where(and(
      eq(memberPrograms.id, memberProgramId),
      eq(familyMembers.familyId, familyId)
    ))
    .limit(1);

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    await db.delete(memberPrograms).where(eq(memberPrograms.id, memberProgramId));

    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Delete program error:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

// Calculate transfer cost
router.post('/transfer-cost', async (req, res) => {
  try {
    const { fromAirlineId, amount, memberStatus } = req.body;

    const [airline] = await db.select().from(airlines).where(eq(airlines.id, fromAirlineId)).limit(1);
    
    if (!airline) {
      return res.status(404).json({ error: 'Airline not found' });
    }

    if (!airline.transferEnabled) {
      return res.status(400).json({ error: 'This airline does not allow mile transfers' });
    }

    // Calculate fee based on airline rules
    let fee = { points: 0, currency: 0 };

    if (airline.code === 'LA') {
      // LATAM: Flat 1000 points
      fee.points = airline.transferFeePoints!;
    } else if (airline.code === 'G3') {
      // Smiles: Based on status
      if (memberStatus === 'Diamond' || memberStatus === 'Gold') {
        fee.currency = 0;
      } else if (memberStatus === 'Silver') {
        fee.currency = amount * 0.01;
      } else {
        fee.currency = amount * 0.02;
      }
    } else if (airline.code === 'AD') {
      // TudoAzul: Tiered pricing
      const firstTier = Math.min(amount, 10000);
      const secondTier = Math.max(0, amount - 10000);
      fee.currency = (firstTier / 1000 * 10) + (secondTier / 1000 * 15);
    } else if (airline.transferFeeAmount) {
      // Other airlines with simple fee structure
      fee.currency = (amount / 1000) * airline.transferFeeAmount;
    }

    res.json({
      airline: airline.name,
      program: airline.programName,
      transferAmount: amount,
      fee,
      totalDeduction: amount + fee.points,
      receivedAmount: amount,
      processingTime: airline.transferDelayHours,
    });
  } catch (error) {
    console.error('Calculate transfer cost error:', error);
    res.status(500).json({ error: 'Failed to calculate transfer cost' });
  }
});

export default router;