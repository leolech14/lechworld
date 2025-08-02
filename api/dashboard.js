import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from './_lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get authenticated user
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userId = user.id; // Real user ID from JWT

    // Get all data in parallel - ALL users see ALL family data
    const [
      { data: familyMembers, error: membersError },
      { data: programs, error: programsError },
      { data: memberPrograms, error: memberProgramsError }
    ] = await Promise.all([
      supabase.from('family_members').select('*'), // No user_id filter - show all family members
      supabase.from('loyalty_programs').select('*'),
      supabase.from('member_programs').select('*')
    ]);

    if (membersError || programsError || memberProgramsError) {
      console.error('Dashboard errors:', { membersError, programsError, memberProgramsError });
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }

    // Calculate statistics
    const stats = {
      totalMembers: familyMembers?.length || 0,
      totalPrograms: programs?.length || 0,
      totalMiles: 0,
      expiringMiles: 0,
      recentActivity: []
    };

    // Calculate total miles across all member programs
    if (memberPrograms && familyMembers) {
      const memberIds = familyMembers.map(m => m.id);
      const relevantMemberPrograms = memberPrograms.filter(mp => 
        memberIds.includes(mp.member_id)
      );
      
      stats.totalMiles = relevantMemberPrograms.reduce((total, mp) => 
        total + (mp.points_balance || 0), 0
      );
      
      // Check for expiring miles (within 6 months)
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      stats.expiringMiles = relevantMemberPrograms
        .filter(mp => mp.expiry_date && new Date(mp.expiry_date) <= sixMonthsFromNow)
        .reduce((total, mp) => total + (mp.points_balance || 0), 0);
    }

    res.json({
      stats,
      familyMembers: familyMembers || [],
      programs: programs || [],
      memberPrograms: memberPrograms || []
    });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}