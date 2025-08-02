import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../index.js';
import { familyMembers, memberPrograms, loyaltyPrograms } from '../../shared/schema.js';
import { requireAuth } from '../middleware/auth-vercel.js';
import { syncToSupabase } from '../supabase-client.js';

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Get all family members for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    
    const members = await db.select().from(familyMembers)
      .where(eq(familyMembers.userId, userId));
    
    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

// Create a new family member
router.post('/', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { name, email, profilePhoto, color, role } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [newMember] = await db.insert(familyMembers).values({
      userId,
      name,
      email,
      profilePhoto,
      color: color || '#3b82f6',
      role: role || 'member',
    }).returning();

    res.status(201).json({ member: newMember });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// Update a family member
router.put('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const memberId = parseInt(req.params.id);
    const { 
      name, 
      email, 
      profilePhoto, 
      color,
      role,
      cpf,
      phone,
      birthdate,
      frameColor,
      frameBorderColor,
      profileEmoji
    } = req.body;

    console.log('UPDATE REQUEST:', {
      memberId,
      userId,
      body: req.body,
      frameColor,
      frameBorderColor,
      profileEmoji
    });

    // Verify ownership
    const [member] = await db.select().from(familyMembers)
      .where(and(eq(familyMembers.id, memberId), eq(familyMembers.userId, userId)))
      .limit(1);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    console.log('CURRENT MEMBER:', {
      id: member.id,
      frameColor: member.frameColor,
      frameBorderColor: member.frameBorderColor,
      profileEmoji: member.profileEmoji
    });

    const updateData = {
      name: name !== undefined ? name : member.name,
      email: email !== undefined ? email : member.email,
      profilePhoto: profilePhoto !== undefined ? profilePhoto : member.profilePhoto,
      color: color !== undefined ? color : member.color,
      role: role !== undefined ? role : member.role,
      cpf: cpf !== undefined ? cpf : member.cpf,
      phone: phone !== undefined ? phone : member.phone,
      birthdate: birthdate !== undefined ? birthdate : member.birthdate,
      frameColor: frameColor !== undefined ? frameColor : member.frameColor,
      frameBorderColor: frameBorderColor !== undefined ? frameBorderColor : member.frameBorderColor,
      profileEmoji: profileEmoji !== undefined ? profileEmoji : member.profileEmoji,
      updatedAt: new Date(),
    };

    console.log('UPDATE DATA:', updateData);

    const [updatedMember] = await db.update(familyMembers)
      .set(updateData)
      .where(eq(familyMembers.id, memberId))
      .returning();

    console.log('UPDATED MEMBER:', {
      id: updatedMember.id,
      frameColor: updatedMember.frameColor,
      frameBorderColor: updatedMember.frameBorderColor,
      profileEmoji: updatedMember.profileEmoji
    });

    // Sync to Supabase only in development (when using local DB)
    // In production, we connect directly to Supabase so no sync needed
    if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL?.includes('supabase.co')) {
      await syncToSupabase('family_members', 'update', {
        id: updatedMember.id,
        frame_color: updatedMember.frameColor,
        frame_border_color: updatedMember.frameBorderColor,
        profile_emoji: updatedMember.profileEmoji,
        name: updatedMember.name,
        email: updatedMember.email,
        phone: updatedMember.phone,
        cpf: updatedMember.cpf,
        birthdate: updatedMember.birthdate
      });
    }

    res.json({ member: updatedMember });
  } catch (error) {
    console.error('Update member error:', error);
    console.error('Request body:', req.body);
    console.error('Member ID:', req.params.id);
    console.error('User ID:', req.session.userId);
    res.status(500).json({ error: 'Failed to update member', details: error.message });
  }
});

// Delete a family member
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const memberId = parseInt(req.params.id);

    // Verify ownership
    const [member] = await db.select().from(familyMembers)
      .where(and(eq(familyMembers.id, memberId), eq(familyMembers.userId, userId)))
      .limit(1);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Delete associated programs first
    await db.delete(memberPrograms).where(eq(memberPrograms.memberId, memberId));

    // Delete the member
    await db.delete(familyMembers).where(eq(familyMembers.id, memberId));

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// Get member with all programs
router.get('/:id/programs', async (req, res) => {
  try {
    const userId = req.session.userId!;
    const memberId = parseInt(req.params.id);

    // Verify ownership
    const [member] = await db.select().from(familyMembers)
      .where(and(eq(familyMembers.id, memberId), eq(familyMembers.userId, userId)))
      .limit(1);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Get all programs for this member
    const programs = await db.select({
      memberProgram: memberPrograms,
      program: loyaltyPrograms,
    })
    .from(memberPrograms)
    .innerJoin(loyaltyPrograms, eq(memberPrograms.programId, loyaltyPrograms.id))
    .where(eq(memberPrograms.memberId, memberId));

    res.json({ member, programs });
  } catch (error) {
    console.error('Get member programs error:', error);
    res.status(500).json({ error: 'Failed to get member programs' });
  }
});

export default router;