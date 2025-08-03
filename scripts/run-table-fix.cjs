const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function fixTables() {
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
    const sqlPath = path.join(__dirname, 'fix-table-names.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('📋 Running table structure fix...');
    await client.query(sql);
    
    console.log('✅ Table structure fixed successfully!');
    
    // Verify the tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Updated tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check if data is preserved
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM airlines) as airlines_count,
        (SELECT COUNT(*) FROM member_programs) as member_programs_count
    `);
    
    console.log('\n📈 Data counts:');
    console.log(`   Airlines: ${counts.rows[0].airlines_count}`);
    console.log(`   Member Programs: ${counts.rows[0].member_programs_count}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

fixTables().catch(console.error);