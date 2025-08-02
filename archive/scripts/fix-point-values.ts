import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixPointValues() {
  try {
    console.log('💰 Updating point values in BRL...');
    
    // Update current_value_brl for all member programs
    const result = await pool.query(`
      UPDATE member_programs mp
      SET current_value_brl = (mp.current_miles * a.mile_value_brl)
      FROM airlines a
      WHERE mp.airline_id = a.id
      AND mp.current_miles > 0
      RETURNING mp.id
    `);
    
    console.log(`✅ Updated ${result.rowCount} accounts with BRL values`);
    
    // Show summary of values
    const summary = await pool.query(`
      SELECT 
        fm.name as member_name,
        a.program_name,
        mp.current_miles,
        mp.current_value_brl,
        mp.status_level
      FROM member_programs mp
      JOIN family_members fm ON mp.member_id = fm.id
      JOIN airlines a ON mp.airline_id = a.id
      WHERE mp.current_miles > 0
      ORDER BY fm.name, a.program_name
    `);
    
    console.log('\n📊 Account Values Summary:');
    console.log('================================');
    summary.rows.forEach(row => {
      const value = row.current_value_brl ? `R$ ${parseFloat(row.current_value_brl).toFixed(2)}` : 'R$ 0.00';
      console.log(`${row.member_name} - ${row.program_name}: ${row.current_miles.toLocaleString()} miles = ${value}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating point values:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the update
fixPointValues().catch(console.error);