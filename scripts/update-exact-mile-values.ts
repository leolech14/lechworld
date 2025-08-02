import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

async function updateExactValues() {
  try {
    console.log('Updating mile values to match AIRLINE_PROGRAMS_KNOWLEDGE.md...\n');
    
    // Update values to match exactly
    const updateSql = `
      UPDATE airlines 
      SET mile_value_brl = CASE
          WHEN program_name = 'LATAM Pass' THEN 0.035
          WHEN program_name = 'Smiles' THEN 0.025
          WHEN program_name = 'TudoAzul' THEN 0.030
          WHEN program_name = 'TAP Miles&Go' THEN 0.040
          WHEN program_name = 'United MileagePlus' THEN 0.050
          WHEN program_name = 'AAdvantage' THEN 0.045
          WHEN program_name = 'ALL - Accor Live Limitless' THEN 0.020
          WHEN program_name = 'Marriott Bonvoy' THEN 0.018
          WHEN program_name = 'Hilton Honors' THEN 0.015
          WHEN program_name = 'Miles&Smiles' THEN 0.035
          WHEN program_name = 'ConnectMiles' THEN 0.030
          ELSE mile_value_brl
      END;
    `;
    
    await pool.query(updateSql);
    
    // Verify the values
    const result = await pool.query(`
      SELECT program_name, mile_value_brl 
      FROM airlines 
      ORDER BY program_name
    `);
    
    console.log('Updated mile values:');
    result.rows.forEach(row => {
      const valuePerThousand = (row.mile_value_brl || 0) * 1000;
      console.log(`${row.program_name}: R$${valuePerThousand.toFixed(2)} per 1000 miles`);
    });
    
    console.log('\nValues updated successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error updating values:', error);
    process.exit(1);
  }
}

updateExactValues();