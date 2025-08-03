const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function alignSchema() {
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
    const sqlPath = path.join(__dirname, 'align-schema-properly.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('📋 Aligning database schema with application...');
    await client.query(sql);
    
    console.log('✅ Schema alignment completed successfully!');
    
    // Verify the results
    const verification = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM airlines) as airlines_count,
        (SELECT COUNT(*) FROM member_programs) as programs_count,
        (SELECT COUNT(DISTINCT airline_id) FROM member_programs) as distinct_airlines,
        (SELECT COUNT(*) FROM mile_transactions) as transactions_count,
        (SELECT COUNT(*) FROM activity_log) as activities_count
    `);
    
    const counts = verification.rows[0];
    console.log('\n📊 Database statistics:');
    console.log(`   Airlines: ${counts.airlines_count}`);
    console.log(`   Member Programs: ${counts.programs_count}`);
    console.log(`   Distinct Airlines Used: ${counts.distinct_airlines}`);
    console.log(`   Transactions: ${counts.transactions_count}`);
    console.log(`   Activities: ${counts.activities_count}`);

    // Show sample airline data
    const airlines = await client.query(`
      SELECT code, name, program_name 
      FROM airlines 
      ORDER BY code 
      LIMIT 5
    `);
    
    console.log('\n✈️ Sample airlines:');
    airlines.rows.forEach(airline => {
      console.log(`   ${airline.code}: ${airline.name} (${airline.program_name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

alignSchema().catch(console.error);