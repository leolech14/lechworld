import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from './_lib/auth.js';
import { getAllowedOrigin } from '../utils/validate-origin.js';

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
  const origin = getAllowedOrigin(req.headers.origin);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get authenticated user
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Use the actual user ID from the JWT token
      const userId = user.id;
      
      // Get all family members - shared access for all users
      const { data: members, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to fetch members' });
      }
      
      res.json({ members: members || [] });
      
    } else if (req.method === 'POST') {
      // Create a new family member
      const userId = user.id;
      const { name, email, profilePhoto, color, role } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const { data: newMember, error } = await supabase
        .from('family_members')
        .insert({
          user_id: 1, // Always use user_id=1 for shared family system
          name,
          email,
          profile_photo: profilePhoto,
          color: color || '#3b82f6',
          role: role || 'member',
        })
        .select()
        .single();
        
      if (error) {
        console.error('Create error:', error);
        return res.status(500).json({ error: 'Failed to create member' });
      }

      res.status(201).json({ member: newMember });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Members API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
