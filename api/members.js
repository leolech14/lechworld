import { getUserFromRequest } from './_lib/auth.js';
import { getSupabaseClient } from './_lib/supabase.js';

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

  // Get authenticated user
  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabaseClient(user.token);

  try {
    if (req.method === 'GET') {
      // Get all family members for the authenticated user
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
          user_id: userId,
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