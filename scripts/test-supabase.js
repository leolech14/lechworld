import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true });

    const { data: programs } = await supabase
      .from('loyalty_programs')
      .select('*', { count: 'exact', head: true });

    console.log({
      status: 'connected',
      database: 'Supabase',
      tables: {
        users: count !== null,
        family_members: familyMembers !== null,
        loyalty_programs: programs !== null
      }
    });
  } catch (error) {
    console.error({
      error: 'Connection test failed',
      details: error.message
    });
  }
}

testConnection();
