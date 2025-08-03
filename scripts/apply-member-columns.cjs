const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function addMemberColumns() {
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
    const sqlPath = path.join(__dirname, 'add-missing-member-columns.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('📋 Adding missing columns to family_members...');
    await client.query(sql);
    
    console.log('✅ Columns added successfully!');
    
    // Verify columns
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'family_members'
      AND column_name IN ('profile_photo', 'color', 'phone', 'cpf', 'birthdate', 'frame_color', 'frame_border_color', 'profile_emoji')
      ORDER BY column_name;
    `);
    
    console.log('\n📊 Added columns:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addMemberColumns().catch(console.error);