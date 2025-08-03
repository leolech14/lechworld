const { Client } = require('pg');
require('dotenv').config();

async function checkStructure() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    
    // Check if airlines table exists
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN ('airlines', 'loyalty_programs')
    `);
    
    console.log('📊 Relevant tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check columns in loyalty_programs or airlines
    const tableName = tablesResult.rows[0]?.table_name;
    if (tableName) {
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log(`\n📋 Columns in ${tableName}:`);
      columnsResult.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type}`);
      });
    }

    // Check member_programs columns
    const mpColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'member_programs'
      AND column_name IN ('program_id', 'airline_id', 'points_balance', 'current_miles')
    `);
    
    console.log('\n📋 member_programs relevant columns:');
    mpColumnsResult.rows.forEach(row => {
      console.log(`   ${row.column_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkStructure().catch(console.error);