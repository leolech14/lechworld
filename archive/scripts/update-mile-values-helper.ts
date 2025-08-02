import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { airlines } from '../shared/schemas/database.js';
import { eq } from 'drizzle-orm';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool);

// Helper script to update mile values
// Usage: npx tsx scripts/update-mile-values-helper.ts

async function updateMileValues() {
  // Define the new values here (per 1000 miles)
  const newValues: Record<string, number> = {
    // Update these values as needed:
    'LATAM Pass': 35.00,        // Current market value per 1000 miles
    'Smiles': 25.00,            
    'TudoAzul': 30.00,          
    'AAdvantage': 45.00,
    'TAP Miles&Go': 40.00,
    'United MileagePlus': 50.00,
    // Add more as needed...
  };

  try {
    console.log('Updating mile values...\n');
    
    for (const [programName, valuePerThousand] of Object.entries(newValues)) {
      const valuePerMile = valuePerThousand / 1000;
      
      await db.update(airlines)
        .set({ mileValueBrl: valuePerMile })
        .where(eq(airlines.programName, programName));
      
      console.log(`Updated ${programName}: R$${valuePerThousand.toFixed(2)} per 1000 miles`);
    }
    
    // Show all current values
    console.log('\nAll current values:');
    const allAirlines = await db.select().from(airlines);
    
    allAirlines.forEach(airline => {
      const valuePerThousand = (airline.mileValueBrl || 0) * 1000;
      console.log(`${airline.programName}: R$${valuePerThousand.toFixed(2)} per 1000 miles`);
    });
    
    console.log('\nValues updated successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error updating values:', error);
    process.exit(1);
  }
}

updateMileValues();