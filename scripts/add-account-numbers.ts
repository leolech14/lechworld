import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { memberPrograms } from '../shared/schemas/database.js';
import { eq } from 'drizzle-orm';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool);

// Sample account numbers for each program
const accountNumbers: Record<string, string[]> = {
  // LATAM Pass (ID: 1)
  '1': ['1234567890', '2345678901', '3456789012', '4567890123'],
  // Smiles (ID: 2)
  '2': ['9876543210', '8765432109', '7654321098', '6543210987'],
  // TudoAzul (ID: 3)
  '3': ['1122334455', '2233445566', '3344556677', '4455667788'],
  // AAdvantage (ID: 4)
  '4': ['AA1234567', 'AA2345678', 'AA3456789'],
  // Miles&Smiles (ID: 5)
  '5': ['TK987654', 'TK876543'],
  // ConnectMiles (ID: 6)
  '6': ['CM555666'],
};

async function addAccountNumbers() {
  try {
    console.log('Adding account numbers to member programs...\n');
    
    // Get all member programs
    const programs = await db.select().from(memberPrograms);
    
    // Group by airline and member
    const programsByAirline: Record<number, typeof programs> = {};
    programs.forEach(p => {
      if (!programsByAirline[p.airlineId]) {
        programsByAirline[p.airlineId] = [];
      }
      programsByAirline[p.airlineId].push(p);
    });
    
    // Update each program with an account number
    for (const [airlineId, airlinePrograms] of Object.entries(programsByAirline)) {
      const numbers = accountNumbers[airlineId] || [];
      
      airlinePrograms.forEach(async (program, index) => {
        if (numbers[index]) {
          await db.update(memberPrograms)
            .set({ memberNumber: numbers[index] })
            .where(eq(memberPrograms.id, program.id));
          
          console.log(`Updated program ${program.id}: Member ${program.memberId}, Airline ${airlineId}, Account: ${numbers[index]}`);
        }
      });
    }
    
    console.log('\nAccount numbers added successfully!');
    
    // Verify the updates
    setTimeout(async () => {
      const updated = await db.select().from(memberPrograms);
      console.log('\nVerification - Programs with account numbers:');
      updated.forEach(p => {
        if (p.memberNumber) {
          console.log(`  ID: ${p.id}, Account: ${p.memberNumber}, Miles: ${p.currentMiles}`);
        }
      });
      
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addAccountNumbers();