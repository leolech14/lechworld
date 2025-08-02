import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Read the JSON data
const jsonPath = join(process.cwd(), 'loyalty_programs_data.json');
const loyaltyData = JSON.parse(readFileSync(jsonPath, 'utf-8'));

// Map airline names to their full program names
const AIRLINE_PROGRAMS = {
  'LATAM Pass': { name: 'LATAM Pass', company: 'LATAM Airlines', code: 'LA' },
  'GOL/Smiles': { name: 'Smiles', company: 'GOL', code: 'G3' },
  'Gol Smiles': { name: 'Smiles', company: 'GOL', code: 'G3' },
  'Turkish Airlines': { name: 'Miles&Smiles', company: 'Turkish Airlines', code: 'TK' },
  'American Airlines': { name: 'AAdvantage', company: 'American Airlines', code: 'AA' },
  'Copa Airlines': { name: 'ConnectMiles', company: 'Copa Airlines', code: 'CM' },
  'Azul': { name: 'TudoAzul', company: 'Azul', code: 'AD' },
};

// Map member names to consistent format
const MEMBER_NAMES = {
  'OSVANDRÉ': 'Osvandré',
  'OSVANDRE': 'Osvandré',
  'MARILISE': 'Marilise',
  'GRACIELA': 'Graciela',
  'LEONARDO': 'Leonardo',
};

// Map member names to user IDs (from our users table)
const USER_IDS = {
  'Leonardo': 7,
  'Graciela': 8,
  'Osvandré': 9,
  'Marilise': 10
};

async function importToSupabase() {
  try {
    console.log('🚀 Starting Supabase import...');
    
    // Step 1: Create all loyalty programs
    console.log('\n📋 Creating loyalty programs...');
    const programIds = {};
    
    for (const [key, programInfo] of Object.entries(AIRLINE_PROGRAMS)) {
      // Check if program exists
      const { data: existing } = await supabase
        .from('loyalty_programs')
        .select('id')
        .eq('name', programInfo.name)
        .single();
      
      if (existing) {
        programIds[key] = existing.id;
        console.log(`✅ Found existing program: ${programInfo.name}`);
      } else {
        // Create new program
        const { data: newProgram, error } = await supabase
          .from('loyalty_programs')
          .insert({
            name: programInfo.name,
            company: programInfo.company,
            logo_color: '#3B82F6'
          })
          .select()
          .single();
          
        if (error) {
          console.error(`❌ Error creating program ${programInfo.name}:`, error);
        } else {
          programIds[key] = newProgram.id;
          console.log(`✅ Created program: ${programInfo.name}`);
        }
      }
    }
    
    // Step 2: Create family members
    console.log('\n👥 Creating family members...');
    const memberIds = {};
    
    for (const [originalName, normalizedName] of Object.entries(MEMBER_NAMES)) {
      const userId = USER_IDS[normalizedName];
      
      // Check if member exists
      const { data: existing } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', userId)
        .eq('name', normalizedName)
        .single();
      
      if (existing) {
        memberIds[originalName] = existing.id;
        console.log(`✅ Found existing member: ${normalizedName}`);
      } else {
        // Create new member
        const { data: newMember, error } = await supabase
          .from('family_members')
          .insert({
            user_id: userId,
            name: normalizedName,
            email: `${normalizedName.toLowerCase()}@lech.world`,
            frame_color: '#FED7E2',
            frame_border_color: '#F687B3',
            profile_emoji: '👤'
          })
          .select()
          .single();
          
        if (error) {
          console.error(`❌ Error creating member ${normalizedName}:`, error);
        } else {
          memberIds[originalName] = newMember.id;
          console.log(`✅ Created member: ${normalizedName}`);
        }
      }
    }
    
    // Step 3: Import all account data
    console.log('\n📥 Importing account data...');
    let imported = 0;
    let updated = 0;
    
    for (const account of loyaltyData) {
      const programId = programIds[account.airline];
      const memberId = memberIds[account.name];
      
      if (!programId || !memberId) {
        console.warn(`⚠️  Skipping: ${account.name} - ${account.airline} (missing IDs)`);
        continue;
      }
      
      // Check if this member-program combination exists
      const { data: existing } = await supabase
        .from('member_programs')
        .select('id')
        .eq('member_id', memberId)
        .eq('program_id', programId)
        .single();
      
      // Prepare the data - store passwords in custom_fields as a JSON object
      const customFields = {
        site_password: account.site_password === '?' ? null : account.site_password,
        miles_password: account.miles_password === '?' ? null : account.miles_password
      };
      
      const accountData = {
        member_id: memberId,
        program_id: programId,
        account_number: account.account || null,
        login: account.account || null,
        password: account.site_password === '?' ? null : account.site_password, // Main password field
        points_balance: account.miles || 0,
        elite_tier: account.status || null,
        notes: account.notes || null,
        custom_fields: customFields,
        last_updated: account.updated ? new Date(`2025-${account.updated.slice(3, 5)}-${account.updated.slice(0, 2)}`) : new Date(),
        is_active: true
      };
      
      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('member_programs')
          .update({
            account_number: accountData.account_number,
            login: accountData.login,
            password: accountData.password,
            points_balance: accountData.points_balance,
            elite_tier: accountData.elite_tier,
            notes: accountData.notes,
            custom_fields: accountData.custom_fields,
            last_updated: accountData.last_updated
          })
          .eq('id', existing.id);
          
        if (error) {
          console.error(`❌ Error updating ${account.name} - ${account.airline}:`, error);
        } else {
          updated++;
          console.log(`📝 Updated: ${MEMBER_NAMES[account.name]} - ${account.airline}`);
        }
      } else {
        // Insert new
        const { error } = await supabase
          .from('member_programs')
          .insert(accountData);
          
        if (error) {
          console.error(`❌ Error importing ${account.name} - ${account.airline}:`, error);
        } else {
          imported++;
          console.log(`✅ Imported: ${MEMBER_NAMES[account.name]} - ${account.airline}`);
        }
      }
    }
    
    console.log(`\n📊 Import Summary:`);
    console.log(`   - New accounts imported: ${imported}`);
    console.log(`   - Existing accounts updated: ${updated}`);
    console.log(`   - Total processed: ${imported + updated}`);
    
    console.log('\n✅ Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  }
}

// Run the import
importToSupabase();