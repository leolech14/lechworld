import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Read the JSON data
const jsonPath = join(process.cwd(), 'loyalty_programs_data.json');
const loyaltyData = JSON.parse(readFileSync(jsonPath, 'utf-8'));

// Map airline names to their full program names
const AIRLINE_PROGRAMS: Record<string, { name: string; company: string; code?: string }> = {
  'LATAM Pass': { name: 'LATAM Pass', company: 'LATAM Airlines', code: 'LA' },
  'GOL/Smiles': { name: 'Smiles', company: 'GOL', code: 'G3' },
  'Gol Smiles': { name: 'Smiles', company: 'GOL', code: 'G3' },
  'Turkish Airlines': { name: 'Miles&Smiles', company: 'Turkish Airlines', code: 'TK' },
  'American Airlines': { name: 'AAdvantage', company: 'American Airlines', code: 'AA' },
  'Copa Airlines': { name: 'ConnectMiles', company: 'Copa Airlines', code: 'CM' },
  'Azul': { name: 'TudoAzul', company: 'Azul', code: 'AD' },
};

// Map member names to consistent format
const MEMBER_NAMES: Record<string, string> = {
  'OSVANDRÉ': 'Osvandré',
  'OSVANDRE': 'Osvandré',
  'MARILISE': 'Marilise',
  'GRACIELA': 'Graciela',
  'LEONARDO': 'Leonardo',
};

// Map member names to user IDs in the users table
const USER_IDS: Record<string, number> = {
  Leonardo: 7,
  Graciela: 8,
  Osvandré: 9,
  Marilise: 10,
};

async function importRealData() {
  try {
    console.log('🚀 Starting real data import...');
    
    // Step 1: Create all loyalty programs
    console.log('\n📋 Creating loyalty programs...');
    const programIds: Record<string, number> = {};
    
    for (const [key, programInfo] of Object.entries(AIRLINE_PROGRAMS)) {
      const existing = await pool.query(
        'SELECT id FROM airlines WHERE program_name = $1 OR name = $2',
        [programInfo.name, programInfo.company]
      );
      
      if (existing.rows.length > 0) {
        programIds[key] = existing.rows[0].id;
        console.log(`✅ Found existing program: ${programInfo.name}`);
      } else {
        console.log(`⚠️  Program not found: ${programInfo.name} - Please create it manually`);
      }
    }
    
    // Step 2: Ensure all family members exist
    console.log('\n👥 Checking family members...');
    const memberIds: Record<string, number> = {};
    
    for (const [originalName, normalizedName] of Object.entries(MEMBER_NAMES)) {
      const userId = USER_IDS[normalizedName];

      const { rows } = await pool.query(
        'SELECT id, user_id FROM family_members WHERE LOWER(name) = LOWER($1)',
        [normalizedName]
      );

      if (rows.length > 0) {
        memberIds[originalName] = rows[0].id;
        console.log(`✅ Found member: ${normalizedName}`);
        if (rows[0].user_id !== userId) {
          await pool.query(
            'UPDATE family_members SET user_id = $1 WHERE id = $2',
            [userId, rows[0].id]
          );
          console.log(`🔄 Updated user_id for ${normalizedName}`);
        }
      } else {
        // Create the member with correct user_id
        const { rows: newMember } = await pool.query(
          `INSERT INTO family_members (user_id, name, email, role, is_active)
           VALUES ($1, $2, $3, $4, true)
           RETURNING id`,
          [userId, normalizedName, `${normalizedName.toLowerCase()}@lech.world`, 'member']
        );
        memberIds[originalName] = newMember[0].id;
        console.log(`✅ Created member: ${normalizedName}`);
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
      const existing = await pool.query(
        'SELECT id FROM member_programs WHERE member_id = $1 AND airline_id = $2',
        [memberId, programId]
      );
      
      // Prepare the data
      const accountData = {
        accountNumber: account.account || null,
        login: account.account || null, // Use account number as login
        sitePassword: account.site_password === '?' ? null : account.site_password,
        milesPassword: account.miles_password === '?' ? null : account.miles_password,
        pointsBalance: account.miles || 0,
        eliteTier: account.status || null,
        notes: account.notes || null,
        lastUpdated: account.updated ? new Date(`2025-${account.updated.slice(3, 5)}-${account.updated.slice(0, 2)}`) : new Date(),
      };
      
      if (existing.rows.length > 0) {
        // Update existing
        await pool.query(
          `UPDATE member_programs 
           SET account_number = $1, login = $2, site_password = $3, miles_password = $4,
               points_balance = $5, elite_tier = $6, notes = $7, last_updated = $8
           WHERE id = $9`,
          [
            accountData.accountNumber,
            accountData.login,
            accountData.sitePassword,
            accountData.milesPassword,
            accountData.pointsBalance,
            accountData.eliteTier,
            accountData.notes,
            accountData.lastUpdated,
            existing.rows[0].id
          ]
        );
        updated++;
        console.log(`📝 Updated: ${MEMBER_NAMES[account.name]} - ${account.airline}`);
      } else {
        // Insert new
        await pool.query(
          `INSERT INTO member_programs 
           (member_id, airline_id, member_number, site_password, miles_password,
            current_miles, status_level, pin, document_number, last_sync_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            memberId,
            programId,
            accountData.accountNumber,
            accountData.sitePassword,
            accountData.milesPassword,
            accountData.pointsBalance,
            accountData.eliteTier,
            accountData.milesPassword, // Use miles password as PIN
            account.account, // Use account as document number
            accountData.lastUpdated
          ]
        );
        imported++;
        console.log(`✅ Imported: ${MEMBER_NAMES[account.name]} - ${account.airline}`);
      }
    }
    
    console.log(`\n📊 Import Summary:`);
    console.log(`   - New accounts imported: ${imported}`);
    console.log(`   - Existing accounts updated: ${updated}`);
    console.log(`   - Total processed: ${imported + updated}`);
    
    // Step 4: Run the point value update script
    console.log('\n💰 Updating point values...');
    await pool.query("SELECT setval('loyalty_programs_id_seq', (SELECT MAX(id) FROM loyalty_programs))");
    await pool.query("SELECT setval('family_members_id_seq', (SELECT MAX(id) FROM family_members))");
    await pool.query("SELECT setval('member_programs_id_seq', (SELECT MAX(id) FROM member_programs))");
    
    console.log('✅ Import completed successfully!');
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the import
importRealData().catch(console.error);