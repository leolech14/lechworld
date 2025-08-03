const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function cleanAndAlign() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'clean-and-align-schema.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('🧹 Cleaning and aligning database schema...');
    await client.query(sql);
    
    console.log('✅ Schema alignment completed successfully!');
    
    // Verify the results
    const verification = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM airlines) as airlines_count,
        (SELECT COUNT(*) FROM member_programs) as programs_count,
        (SELECT COUNT(DISTINCT airline_id) FROM member_programs) as distinct_airlines,
        (SELECT bool_or(current_miles > 0) FROM member_programs) as has_miles_data
    `);
    
    const counts = verification.rows[0];
    console.log('\n📊 Database verification:');
    console.log(`   Airlines: ${counts.airlines_count}`);
    console.log(`   Member Programs: ${counts.programs_count}`);
    console.log(`   Airlines with Programs: ${counts.distinct_airlines}`);
    console.log(`   Has Miles Data: ${counts.has_miles_data ? 'Yes' : 'No'}`);

    // Show sample data
    const sampleData = await client.query(`
      SELECT 
        a.code,
        a.name as airline_name,
        a.program_name,
        mp.current_miles,
        fm.name as member_name
      FROM member_programs mp
      JOIN airlines a ON a.id = mp.airline_id
      JOIN family_members fm ON fm.id = mp.member_id
      WHERE mp.current_miles > 0
      ORDER BY mp.current_miles DESC
      LIMIT 5
    `);
    
    if (sampleData.rows.length > 0) {
      console.log('\n✈️ Sample member programs with miles:');
      sampleData.rows.forEach(row => {
        console.log(`   ${row.member_name}: ${row.current_miles.toLocaleString()} miles in ${row.program_name} (${row.code})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) console.error('   Detail:', error.detail);
    throw error;
  } finally {
    await client.end();
  }
}

cleanAndAlign().catch(console.error);