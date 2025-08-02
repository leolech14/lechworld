import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld'
  });

  try {
    const client = await pool.connect();
    
    // Check family_members columns
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'family_members'
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Family Members Table Schema:');
    console.log('================================');
    result.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}${row.column_default ? ` (default: ${row.column_default})` : ''}`);
    });
    
    client.release();
  } catch (error) {
    console.error('❌ Failed to check schema:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkSchema();