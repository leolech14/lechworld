import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from './_lib/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
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
    const userId = user.id; // Get userId from authenticated user
    const activityLimit = parseInt(req.query?.activity_limit) || 10;

    // Use a single RPC call that aggregates dashboard data in the database.
    // The RPC is responsible for joining tables, calculating totals and
    // returning recent activity already limited/paginated.
    const { data, error } = await supabase.rpc('get_dashboard_data', {
      user_id: userId, // Pass the authenticated user's ID
      activity_limit: activityLimit
    });

    if (error) {
      console.error('Dashboard data error:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }

    // The RPC returns the object in the same shape expected by the frontend:
    // { stats, familyMembers, programs, memberPrograms }
    res.json(data || {});
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}