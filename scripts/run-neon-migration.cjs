const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🚀 Connecting to Neon database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'create-neon-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📋 Running schema migration...');
    await client.query(schema);
    
    console.log('✅ Schema created successfully!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);