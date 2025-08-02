import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkLeonardoData() {
  console.log('Checking Leonardo\'s data...\n');
  
  // Leonardo's user ID is 7
  const leonardoUserId = 7;
  
  // Check family members for Leonardo
  const { data: familyMembers, error: fmError } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', leonardoUserId);
    
  console.log('Family members for user_id=7:');
  console.log('Count:', familyMembers?.length || 0);
  if (familyMembers && familyMembers.length > 0) {
    familyMembers.forEach(fm => {
      console.log(`- ${fm.name} (ID: ${fm.id})`);
    });
  }
  
  // Check ALL family members
  const { data: allMembers } = await supabase
    .from('family_members')
    .select('*');
    
  console.log('\nALL family members in database:');
  allMembers?.forEach(member => {
    console.log(`- ${member.name} (ID: ${member.id}, user_id: ${member.user_id})`);
  });
  
  // Check member_programs
  const { data: allPrograms } = await supabase
    .from('member_programs')
    .select('*');
    
  console.log('\nTotal member_programs:', allPrograms?.length || 0);
  
  // If Leonardo has a family member, check their programs
  if (familyMembers && familyMembers.length > 0) {
    const leonardoMemberId = familyMembers[0].id;
    const { data: leonardoPrograms } = await supabase
      .from('member_programs')
      .select('*')
      .eq('member_id', leonardoMemberId);
      
    console.log(`\nPrograms for Leonardo's member (ID ${leonardoMemberId}):`, leonardoPrograms?.length || 0);
  }
}

checkLeonardoData();