import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkTables() {
  console.log('Checking Supabase table structures...\n');
  
  // Check loyalty_programs
  const { data: programs, error: programError } = await supabase
    .from('loyalty_programs')
    .select('*')
    .limit(1);
    
  if (!programError && programs && programs.length > 0) {
    console.log('loyalty_programs columns:', Object.keys(programs[0]));
  } else {
    console.log('loyalty_programs error:', programError);
  }
  
  // Check family_members
  const { data: members, error: memberError } = await supabase
    .from('family_members')
    .select('*')
    .limit(1);
    
  if (!memberError && members && members.length > 0) {
    console.log('\nfamily_members columns:', Object.keys(members[0]));
  } else {
    console.log('\nfamily_members error:', memberError);
  }
  
  // Check member_programs
  const { data: memberPrograms, error: mpError } = await supabase
    .from('member_programs')
    .select('*')
    .limit(1);
    
  if (!mpError && memberPrograms && memberPrograms.length > 0) {
    console.log('\nmember_programs columns:', Object.keys(memberPrograms[0]));
  } else {
    console.log('\nmember_programs error:', mpError);
  }
}

checkTables();