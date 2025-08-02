import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkUsers() {
  console.log('Checking Supabase users table...\n');
  
  // First, let's see what columns exist
  const { data: tableInfo, error: tableError } = await supabase
    .from('users')
    .select('*')
    .limit(1);
    
  if (tableError) {
    console.error('Error accessing users table:', tableError);
    return;
  }
  
  if (tableInfo && tableInfo.length > 0) {
    console.log('Users table columns:', Object.keys(tableInfo[0]));
  }
  
  // Now let's see all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  
  console.log('\nFound', users?.length || 0, 'users:\n');
  
  users?.forEach(user => {
    console.log('---');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name || 'N/A');
    console.log('Username:', user.username || 'N/A');
    console.log('Has Password:', !!user.password);
    console.log('First Login:', user.is_first_login);
  });
}

checkUsers();