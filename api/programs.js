import { getSupabaseClient } from './_lib/supabase.js';
import { getUserFromRequest } from './_lib/auth.js';

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

  const user = getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabaseClient(user.token);

  try {
    if (req.method === 'GET') {
      // Get all loyalty programs
      const { data: programs, error } = await supabase
        .from('loyalty_programs')
        .select('*')
        .order('airline_name', { ascending: true });
      
      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to fetch programs' });
      }
      
      res.json({ programs: programs || [] });
      
    } else if (req.method === 'POST') {
      // Create a new loyalty program
      const { 
        airlineName, 
        programName, 
        websiteUrl, 
        phoneNumber,
        milesValue,
        milesExpiry,
        notes 
      } = req.body;

      if (!airlineName || !programName) {
        return res.status(400).json({ error: 'Airline name and program name are required' });
      }

      const { data: newProgram, error } = await supabase
        .from('loyalty_programs')
        .insert({
          airline_name: airlineName,
          program_name: programName,
          website_url: websiteUrl,
          phone_number: phoneNumber,
          miles_value: milesValue,
          miles_expiry: milesExpiry,
          notes
        })
        .select()
        .single();
        
      if (error) {
        console.error('Create error:', error);
        return res.status(500).json({ error: 'Failed to create program' });
      }

      res.status(201).json({ program: newProgram });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Programs API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}