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

async function associateMembers() {
  try {
    console.log('Associating family members with user ID 6...\n');
    
    // Update all family members to belong to user ID 6 (Lech)
    await db.update(familyMembers)
      .set({ userId: 6 })
      .where(eq(familyMembers.userId, familyMembers.userId)); // Update all
    
    console.log('All family members associated with user ID 6');
    
    // Verify the association
    const members = await db.select().from(familyMembers);
    console.log('\nFamily members:');
    members.forEach(m => {
      console.log(`  - ${m.name} (ID: ${m.id}, User ID: ${m.userId})`);
    });
    
    console.log('\nAssociation completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

associateMembers();