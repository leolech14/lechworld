const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
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
    const sqlPath = path.join(__dirname, 'add-missing-columns.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    console.log('📋 Running migration...');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the columns were added
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      AND column_name IN ('is_first_login', 'last_login', 'password_changed_at', 'failed_login_attempts', 'locked_until')
      ORDER BY column_name;
    `);
    
    console.log('\n📊 Added columns:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);