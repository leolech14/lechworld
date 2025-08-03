const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Neon connection string
const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

async function importToNeon() {
  if (!NEON_DATABASE_URL) {
    console.error('❌ NEON_DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const client = new Client({
    connectionString: NEON_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚀 Starting Neon data import...');
    await client.connect();
    console.log('✅ Connected to Neon database');

    // Read the exported data
    const exportPath = path.join(__dirname, '..', 'supabase-export.json');
    const exportData = JSON.parse(await fs.readFile(exportPath, 'utf8'));
    console.log('📥 Loaded export data');

    // Start transaction
    await client.query('BEGIN');

    // 1. Insert families (create a default family)
    console.log('\n📥 Importing families...');
    const familyResult = await client.query(
      'INSERT INTO families (name) VALUES ($1) RETURNING id',
      ['Família Lech']
    );
    const familyId = familyResult.rows[0].id;
    console.log(`✅ Created family with ID: ${familyId}`);

    // 2. Import users with family reference
    console.log('\n📥 Importing users...');
    const userIdMap = {};
    for (const user of exportData.users) {
      const result = await client.query(
        `INSERT INTO users (id, username, email, password, name, role, family_id, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         ON CONFLICT (id) DO UPDATE SET 
           username = EXCLUDED.username,
           email = EXCLUDED.email,
           password = EXCLUDED.password,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           family_id = EXCLUDED.family_id,
           updated_at = EXCLUDED.updated_at
         RETURNING id`,
        [
          user.id,
          user.username,
          user.email,
          user.password,
          user.name,
          user.role || 'member',
          familyId,
          user.created_at,
          user.updated_at || new Date().toISOString()
        ]
      );
      userIdMap[user.id] = result.rows[0].id;
    }
    console.log(`✅ Imported ${exportData.users.length} users`);

    // Reset sequence for users table
    await client.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");

    // 3. Import family members
    console.log('\n📥 Importing family members...');
    const memberIdMap = {};
    for (const member of exportData.family_members) {
      const result = await client.query(
        `INSERT INTO family_members (id, user_id, family_id, name, email, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           user_id = EXCLUDED.user_id,
           family_id = EXCLUDED.family_id,
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           updated_at = EXCLUDED.updated_at
         RETURNING id`,
        [
          member.id,
          member.user_id,
          familyId,
          member.name,
          member.email,
          member.role || 'member',
          member.created_at,
          member.updated_at || new Date().toISOString()
        ]
      );
      memberIdMap[member.id] = result.rows[0].id;
    }
    console.log(`✅ Imported ${exportData.family_members.length} family members`);

    // Reset sequence for family_members table
    await client.query("SELECT setval('family_members_id_seq', (SELECT MAX(id) FROM family_members))");

    // 4. Import loyalty programs
    console.log('\n📥 Importing loyalty programs...');
    const programIdMap = {};
    for (const program of exportData.loyalty_programs) {
      const result = await client.query(
        `INSERT INTO loyalty_programs (id, name, type, airline_code, icon_url, mile_value_brl, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           type = EXCLUDED.type,
           airline_code = EXCLUDED.airline_code,
           icon_url = EXCLUDED.icon_url,
           mile_value_brl = EXCLUDED.mile_value_brl,
           updated_at = EXCLUDED.updated_at
         RETURNING id`,
        [
          program.id,
          program.name,
          program.type,
          program.airline_code,
          program.icon_url,
          program.mile_value_brl,
          program.created_at,
          program.updated_at || new Date().toISOString()
        ]
      );
      programIdMap[program.id] = result.rows[0].id;
    }
    console.log(`✅ Imported ${exportData.loyalty_programs.length} loyalty programs`);

    // Reset sequence for loyalty_programs table
    await client.query("SELECT setval('loyalty_programs_id_seq', (SELECT MAX(id) FROM loyalty_programs))");

    // 5. Import member programs
    console.log('\n📥 Importing member programs...');
    for (const mp of exportData.member_programs) {
      await client.query(
        `INSERT INTO member_programs (id, member_id, program_id, account_number, points_balance, status, expiry_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           member_id = EXCLUDED.member_id,
           program_id = EXCLUDED.program_id,
           account_number = EXCLUDED.account_number,
           points_balance = EXCLUDED.points_balance,
           status = EXCLUDED.status,
           expiry_date = EXCLUDED.expiry_date,
           updated_at = EXCLUDED.updated_at`,
        [
          mp.id,
          mp.member_id,
          mp.program_id,
          mp.account_number,
          mp.points_balance || 0,
          mp.status,
          mp.expiry_date,
          mp.created_at,
          mp.updated_at || new Date().toISOString()
        ]
      );
    }
    console.log(`✅ Imported ${exportData.member_programs.length} member programs`);

    // Reset sequence for member_programs table
    await client.query("SELECT setval('member_programs_id_seq', (SELECT MAX(id) FROM member_programs))");

    // Commit transaction
    await client.query('COMMIT');
    console.log('\n✅ Data import completed successfully!');

    // Verify the import
    console.log('\n📊 Import Summary:');
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM families) as families_count,
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM family_members) as family_members_count,
        (SELECT COUNT(*) FROM loyalty_programs) as loyalty_programs_count,
        (SELECT COUNT(*) FROM member_programs) as member_programs_count
    `);
    
    const summary = counts.rows[0];
    console.log(`   Families: ${summary.families_count}`);
    console.log(`   Users: ${summary.users_count}`);
    console.log(`   Family Members: ${summary.family_members_count}`);
    console.log(`   Loyalty Programs: ${summary.loyalty_programs_count}`);
    console.log(`   Member Programs: ${summary.member_programs_count}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the import
importToNeon().catch(console.error);