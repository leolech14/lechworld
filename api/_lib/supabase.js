import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to get user from token
export async function getUserFromToken(token) {
  if (!token) return null;
  
  try {
    // For now, decode the mock token
    if (token.startsWith('mock-jwt-token-')) {
      // Return mock user for testing
      return {
        id: 1,
        email: 'lech@lechworld.com',
        username: 'lech'
      };
    }
    
    // TODO: Implement real JWT verification
    return null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}