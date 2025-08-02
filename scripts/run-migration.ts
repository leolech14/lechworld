import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool);

async function runMigration() {
  try {
    console.log('Running migration to add mile_value_brl column...\n');
    
    // Read and execute the migration SQL
    const migrationSql = readFileSync('./migrations/add-mile-value-column.sql', 'utf-8');
    
    await pool.query(migrationSql);
    
    console.log('Migration completed successfully!');
    
    // Verify the values
    const result = await pool.query(`
      SELECT program_name, mile_value_brl 
      FROM airlines 
      ORDER BY program_name
    `);
    
    console.log('\nCurrent mile values:');
    result.rows.forEach(row => {
      const valuePerThousand = (row.mile_value_brl || 0) * 1000;
      console.log(`${row.program_name}: R$${valuePerThousand.toFixed(2)} per 1000 miles`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();