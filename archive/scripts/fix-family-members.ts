import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { familyMembers } from '../shared/schemas/database.js';
import { eq } from 'drizzle-orm';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool);

async function fixFamilyMembers() {
  try {
    // Define the family members
    const familyData = [
      { id: 1, name: 'Leonardo' },
      { id: 2, name: 'Graciela' },
      { id: 3, name: 'Osvandré' },
      { id: 4, name: 'Marilise' },
    ];
    
    console.log('Updating family member names...\n');
    
    for (const member of familyData) {
      await db.update(familyMembers)
        .set({ name: member.name })
        .where(eq(familyMembers.id, member.id));
      console.log(`Updated member ${member.id}: ${member.name}`);
    }
    
    // Verify the updates
    const members = await db.select().from(familyMembers);
    console.log('\nUpdated family members:');
    members.forEach(m => console.log(`  ID: ${m.id}, Name: ${m.name}`));
    
    console.log('\nFamily members fixed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixFamilyMembers();