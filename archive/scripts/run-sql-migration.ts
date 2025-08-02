import pg from 'pg';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;

async function runSqlMigration(sqlFile: string) {
  console.log(`🚀 Running SQL migration: ${sqlFile}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld'
  });

  try {
    const client = await pool.connect();
    
    // Read the SQL file
    const sqlContent = readFileSync(sqlFile, 'utf-8');
    
    // Execute the SQL
    await client.query(sqlContent);
    
    client.release();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Get the SQL file from command line argument
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: tsx scripts/run-sql-migration.ts <sql-file>');
  process.exit(1);
}

runSqlMigration(path.resolve(sqlFile));