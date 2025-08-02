import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupUsers() {
  console.log('Setting up Supabase users...\n');
  
  // Define the users we need
  const usersToCreate = [
    { email: 'leonardo', name: 'Leonardo' },
    { email: 'graciela', name: 'Graciela' },
    { email: 'osvandre', name: 'Osvandré' },
    { email: 'marilise', name: 'Marilise' },
    { email: 'denise', name: 'Denise' }
  ];
  
  // Check existing users
  const { data: existingUsers } = await supabase
    .from('users')
    .select('email');
    
  const existingEmails = existingUsers?.map(u => u.email) || [];
  console.log('Existing users:', existingEmails);
  
  // Create missing users
  for (const user of usersToCreate) {
    if (!existingEmails.includes(user.email)) {
      console.log(`Creating user: ${user.name} (${user.email})`);
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: user.email,
          name: user.name,
          password: '' // Empty password - will be set on first login
        })
        .select()
        .single();
        
      if (error) {
        console.error(`Error creating ${user.email}:`, error);
      } else {
        console.log(`✅ Created: ${user.name}`);
      }
    } else {
      console.log(`User ${user.email} already exists`);
    }
  }
  
  // Show final state
  console.log('\n--- Final Users ---');
  const { data: allUsers } = await supabase
    .from('users')
    .select('*')
    .order('id');
    
  allUsers?.forEach(user => {
    console.log(`${user.email} - ${user.name} (has password: ${!!user.password})`);
  });
}

setupUsers();