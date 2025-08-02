import { db } from '../server/services/db';
import { airlines } from '../shared/schemas/database';
import { eq } from 'drizzle-orm';

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

async function updateMileValues() {
  try {
    console.log('Updating mile values in database...\n');
    
    // Get all airlines
    const allAirlines = await db.select().from(airlines);
    
    console.log('Current values:');
    allAirlines.forEach(airline => {
      const valuePerThousand = (airline.mileValueBrl || 0) * 1000;
      console.log(`${airline.programName}: R$${valuePerThousand.toFixed(2)} per 1000 miles`);
    });
    
    console.log('\n\nUpdating to correct values...\n');
    
    // Update each airline
    for (const airline of allAirlines) {
      const correctValuePer1000 = mileValues[airline.programName];
      if (correctValuePer1000) {
        const correctValuePerMile = correctValuePer1000 / 1000;
        await db.update(airlines)
          .set({ mileValueBrl: correctValuePerMile })
          .where(eq(airlines.id, airline.id));
        console.log(`Updated ${airline.programName}: R$${correctValuePer1000.toFixed(2)} per 1000 miles`);
      }
    }
    
    console.log('\nMile values updated successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error updating mile values:', error);
    process.exit(1);
  }
}

updateMileValues();