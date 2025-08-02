import { supabase } from './_lib/supabase.js';

export default async function handler(req, res) {
  try {
    // Test connection by counting users
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return res.status(500).json({ 
        error: 'Supabase connection failed', 
        details: error.message 
      });
    }
    
    // Also check if tables exist
    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true });
      
    const { data: programs } = await supabase
      .from('loyalty_programs')
      .select('*', { count: 'exact', head: true });
    
    res.json({ 
      status: 'connected',
      database: 'Supabase',
      tables: {
        users: count !== null,
        family_members: familyMembers !== null,
        loyalty_programs: programs !== null
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Connection test failed', 
      details: error.message 
    });
  }
}