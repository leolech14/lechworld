import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Point values in BRL per point (not per thousand)
const POINT_VALUES: Record<string, number> = {
  'LATAM Pass': 0.030,           // R$ 30 per 1000 points
  'GOL/Smiles': 0.025,           // R$ 25 per 1000 points  
  'Gol Smiles': 0.025,           // Alternative name
  'Smiles': 0.025,               // Alternative name
  'Azul TudoAzul': 0.028,        // R$ 28 per 1000 points
  'TudoAzul': 0.028,             // Alternative name
  'American Airlines': 0.040,     // R$ 40 per 1000 points (international premium)
  'AAdvantage': 0.040,           // Alternative name
  'Turkish Airlines': 0.035,      // R$ 35 per 1000 points
  'Miles&Smiles': 0.035,         // Alternative name
  'Copa Airlines': 0.032,        // R$ 32 per 1000 points
  'ConnectMiles': 0.032,         // Alternative name
  'TAP Miles&Go': 0.047,         // R$ 47 per 1000 points
  'TAP Air Portugal': 0.047,     // Alternative name
  'Avianca LifeMiles': 0.065,    // R$ 65 per 1000 points (high value)
  'LifeMiles': 0.065,            // Alternative name
  'ALL Accor': 0.047,            // R$ 47 per 1000 points (hotel program)
  'Accor Live Limitless': 0.047, // Alternative name
};

async function updatePointValues() {
  try {
    console.log('📊 Updating point values for all loyalty programs...');
    
    // Get all programs
    const { rows: programs } = await pool.query('SELECT id, name, company FROM loyalty_programs');
    
    for (const program of programs) {
      // Try to find the point value by program name or company name
      const pointValue = POINT_VALUES[program.name] || 
                        POINT_VALUES[program.company] ||
                        Object.entries(POINT_VALUES).find(([key]) => 
                          program.name.toLowerCase().includes(key.toLowerCase()) ||
                          key.toLowerCase().includes(program.name.toLowerCase())
                        )?.[1] ||
                        0.030; // Default to LATAM Pass value
      
      // Update the point value
      await pool.query(
        'UPDATE loyalty_programs SET point_value = $1 WHERE id = $2',
        [pointValue.toString(), program.id]
      );
      
      console.log(`✅ Updated ${program.name}: R$ ${(pointValue * 1000).toFixed(2)} per 1000 points`);
    }
    
    // Now update all estimated values for member programs
    console.log('\n💰 Recalculating estimated values for all member programs...');
    
    const { rows: memberPrograms } = await pool.query(`
      SELECT mp.id, mp.points_balance, lp.name as program_name, lp.point_value
      FROM member_programs mp
      JOIN loyalty_programs lp ON mp.program_id = lp.id
      WHERE mp.points_balance > 0
    `);
    
    for (const mp of memberPrograms) {
      const pointValue = parseFloat(mp.point_value);
      const estimatedValueBRL = (mp.points_balance * pointValue);
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(estimatedValueBRL);
      
      await pool.query(
        'UPDATE member_programs SET estimated_value = $1 WHERE id = $2',
        [formattedValue, mp.id]
      );
    }
    
    console.log(`✅ Updated ${memberPrograms.length} member program values`);
    
    // Show total value summary
    const { rows: summary } = await pool.query(`
      SELECT 
        SUM(mp.points_balance) as total_points,
        SUM(mp.points_balance * CAST(lp.point_value AS NUMERIC)) as total_value_brl
      FROM member_programs mp
      JOIN loyalty_programs lp ON mp.program_id = lp.id
      WHERE mp.is_active = true
    `);
    
    const totalValue = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(summary[0].total_value_brl || 0);
    
    console.log(`\n📈 Total portfolio value: ${totalValue}`);
    console.log(`📊 Total points: ${parseInt(summary[0].total_points || 0).toLocaleString('pt-BR')}`);
    
  } catch (error) {
    console.error('❌ Error updating point values:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the update
updatePointValues().catch(console.error);