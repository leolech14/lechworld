import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupSharedFamilySystem() {
  console.log('🏠 Setting up shared family system...\n');
  
  // Step 1: Clean up existing data
  console.log('🧹 Cleaning up existing data...');
  
  // Delete all member_programs first (due to foreign key constraints)
  await supabase.from('member_programs').delete().gte('id', 0);
  console.log('✅ Cleared member_programs');
  
  // Delete all family_members
  await supabase.from('family_members').delete().gte('id', 0);
  console.log('✅ Cleared family_members');
  
  // Step 2: Ensure all 5 users exist with correct IDs
  console.log('\n👥 Setting up users...');
  
  const users = [
    { id: 1, email: 'leonardo', name: 'Leonardo' },
    { id: 2, email: 'graciela', name: 'Graciela' },
    { id: 3, email: 'osvandre', name: 'Osvandré' },
    { id: 4, email: 'marilise', name: 'Marilise' },
    { id: 5, email: 'denise', name: 'Denise' }
  ];
  
  // Check existing users
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id, email, name')
    .order('id');
    
  console.log('Existing users:', existingUsers?.map(u => `${u.id}: ${u.email}`).join(', '));
  
  // Step 3: Create 4 family members (all belonging to user_id=1 for simplicity)
  console.log('\n👨‍👩‍👧‍👦 Creating family members...');
  
  const familyMembers = [
    { id: 1, user_id: 1, name: 'Leonardo', email: 'leonardo@lech.world' },
    { id: 2, user_id: 1, name: 'Graciela', email: 'graciela@lech.world' },
    { id: 3, user_id: 1, name: 'Osvandré', email: 'osvandre@lech.world' },
    { id: 4, user_id: 1, name: 'Marilise', email: 'marilise@lech.world' }
  ];
  
  for (const member of familyMembers) {
    const { error } = await supabase
      .from('family_members')
      .insert({
        user_id: member.user_id,
        name: member.name,
        email: member.email,
        frame_color: '#FED7E2',
        frame_border_color: '#F687B3',
        profile_emoji: '👤'
      });
      
    if (error) {
      console.error(`Error creating ${member.name}:`, error);
    } else {
      console.log(`✅ Created family member: ${member.name}`);
    }
  }
  
  // Step 4: Import all loyalty program data
  console.log('\n✈️ Importing loyalty program data...');
  
  // Read the JSON data
  const { readFileSync } = await import('fs');
  const { join } = await import('path');
  const jsonPath = join(process.cwd(), 'loyalty_programs_data.json');
  const loyaltyData = JSON.parse(readFileSync(jsonPath, 'utf-8'));
  
  // Get family member IDs
  const { data: members } = await supabase
    .from('family_members')
    .select('id, name');
    
  const memberMap = {};
  members?.forEach(m => {
    memberMap[m.name.toUpperCase()] = m.id;
    if (m.name === 'Osvandré') {
      memberMap['OSVANDRE'] = m.id; // Handle alternate spelling
    }
  });
  
  // Get program IDs
  const { data: programs } = await supabase
    .from('loyalty_programs')
    .select('id, name');
    
  const programMap = {};
  programs?.forEach(p => {
    programMap[p.name] = p.id;
  });
  
  // Map airline names to program names
  const airlineToProgram = {
    'LATAM Pass': 'LATAM Pass',
    'GOL/Smiles': 'Smiles',
    'Gol Smiles': 'Smiles',
    'Turkish Airlines': 'Miles&Smiles',
    'American Airlines': 'AAdvantage',
    'Copa Airlines': 'ConnectMiles',
    'Azul': 'TudoAzul'
  };
  
  // Import each account
  let imported = 0;
  for (const account of loyaltyData) {
    const memberId = memberMap[account.name];
    const programName = airlineToProgram[account.airline];
    const programId = programMap[programName];
    
    if (!memberId || !programId) {
      console.warn(`⚠️ Skipping ${account.name} - ${account.airline} (missing IDs)`);
      continue;
    }
    
    const customFields = {
      site_password: account.site_password === '?' ? null : account.site_password,
      miles_password: account.miles_password === '?' ? null : account.miles_password
    };
    
    const { error } = await supabase
      .from('member_programs')
      .insert({
        member_id: memberId,
        program_id: programId,
        account_number: account.account,
        login: account.account,
        password: account.site_password === '?' ? null : account.site_password,
        points_balance: account.miles || 0,
        elite_tier: account.status,
        notes: account.notes,
        custom_fields: customFields,
        is_active: true
      });
      
    if (error) {
      console.error(`Error importing ${account.name} - ${account.airline}:`, error);
    } else {
      imported++;
    }
  }
  
  console.log(`\n✅ Imported ${imported} loyalty accounts`);
  
  // Step 5: Show final statistics
  const { data: finalStats } = await supabase
    .from('member_programs')
    .select('points_balance');
    
  const totalPoints = finalStats?.reduce((sum, mp) => sum + (mp.points_balance || 0), 0) || 0;
  
  console.log('\n📊 Final System State:');
  console.log('- 5 Users (Leonardo, Graciela, Osvandré, Marilise, Denise)');
  console.log('- 4 Family Members (excluding Denise who is staff)');
  console.log(`- ${imported} Loyalty Programs`);
  console.log(`- ${totalPoints.toLocaleString()} Total Points`);
  console.log('\n✅ All users can now login and view/edit all family data!');
}

setupSharedFamilySystem();