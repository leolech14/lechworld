import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixFamilyOwnership() {
  console.log('Fixing family ownership...\n');
  
  // Leonardo's user ID
  const leonardoUserId = 7;
  
  // First, delete duplicate old family members with user_id=1
  console.log('Removing old duplicate family members...');
  const { error: deleteError } = await supabase
    .from('family_members')
    .delete()
    .eq('user_id', 1);
    
  if (deleteError) {
    console.error('Error deleting old members:', deleteError);
  } else {
    console.log('✅ Old duplicates removed');
  }
  
  // Now update all family members to belong to Leonardo
  console.log('\nUpdating all family members to belong to Leonardo...');
  
  const familyNames = ['Osvandré', 'Marilise', 'Graciela'];
  
  for (const name of familyNames) {
    const { error } = await supabase
      .from('family_members')
      .update({ user_id: leonardoUserId })
      .eq('name', name);
      
    if (error) {
      console.error(`Error updating ${name}:`, error);
    } else {
      console.log(`✅ Updated ${name} to belong to Leonardo`);
    }
  }
  
  // Check final state
  const { data: allMembers } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', leonardoUserId)
    .order('name');
    
  console.log('\n📊 Final state - Leonardo\'s family members:');
  allMembers?.forEach(member => {
    console.log(`- ${member.name} (ID: ${member.id})`);
  });
  
  // Count programs
  const memberIds = allMembers?.map(m => m.id) || [];
  const { data: programs, count } = await supabase
    .from('member_programs')
    .select('*', { count: 'exact' })
    .in('member_id', memberIds);
    
  console.log(`\n✈️  Total programs across family: ${count || 0}`);
  
  // Calculate total points
  const totalPoints = programs?.reduce((sum, p) => sum + (p.points_balance || 0), 0) || 0;
  console.log(`💰 Total points: ${totalPoints.toLocaleString()}`);
}

fixFamilyOwnership();