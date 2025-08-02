import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schemas/database';
import { eq } from 'drizzle-orm';

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool, { schema });

// Mile values from AIRLINE_PROGRAMS_KNOWLEDGE.md
// These values are typically per 1000 miles (in BRL)
const mileValues: Record<string, number> = {
  'LATAM Pass': 35.00,        // ~R$35 per 1000 miles
  'Smiles': 25.00,            // ~R$25 per 1000 miles  
  'TudoAzul': 30.00,          // ~R$30 per 1000 miles
  'TAP Miles&Go': 40.00,      // ~R$40 per 1000 miles
  'United MileagePlus': 50.00, // ~R$50 per 1000 miles
  'American AAdvantage': 45.00, // ~R$45 per 1000 miles
  'ALL - Accor Live Limitless': 20.00, // ~R$20 per 1000 miles
  'Marriott Bonvoy': 18.00,   // ~R$18 per 1000 miles
  'Hilton Honors': 15.00,     // ~R$15 per 1000 miles
};

async function checkAndUpdateMileValues() {
  try {
    console.log('Checking current mile values in database...\n');
    
    // Get current values
    const currentAirlines = await db.select({
      id: schema.airlines.id,
      programName: schema.airlines.programName,
      mileValueBrl: schema.airlines.mileValueBrl,
    }).from(schema.airlines);
    
    console.log('Current values:');
    currentAirlines.forEach(airline => {
      const valuePerThousand = (airline.mileValueBrl || 0) * 1000;
      console.log(`${airline.programName}: R$${valuePerThousand.toFixed(2)} per 1000 miles (${airline.mileValueBrl?.toFixed(4)} per mile)`);
    });
    
    console.log('\n\nUpdating to correct values...\n');
    
    // Update each airline
    for (const airline of currentAirlines) {
      const correctValuePer1000 = mileValues[airline.programName];
      if (correctValuePer1000) {
        const correctValuePerMile = correctValuePer1000 / 1000;
        await db.update(schema.airlines)
          .set({ mileValueBrl: correctValuePerMile })
          .where(eq(schema.airlines.id, airline.id));
        console.log(`Updated ${airline.programName}: R$${correctValuePer1000.toFixed(2)} per 1000 miles (${correctValuePerMile.toFixed(4)} per mile)`);
      } else {
        console.log(`Warning: No value found for ${airline.programName}, keeping current value`);
      }
    }
    
    console.log('\nVerifying updates...\n');
    
    // Verify updates
    const updatedAirlines = await db.select({
      programName: schema.airlines.programName,
      mileValueBrl: schema.airlines.mileValueBrl,
    }).from(schema.airlines);
    
    updatedAirlines.forEach(airline => {
      const valuePerThousand = (airline.mileValueBrl || 0) * 1000;
      console.log(`${airline.programName}: R$${valuePerThousand.toFixed(2)} per 1000 miles`);
    });
    
    console.log('\nMile values updated successfully!');
    
  } catch (error) {
    console.error('Error updating mile values:', error);
  } finally {
    await pool.end();
  }
}

checkAndUpdateMileValues();