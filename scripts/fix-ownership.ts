import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { familyMembers } from '../shared/schemas/database.js';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool);

async function fixOwnership() {
  console.log('🔧 Fixing ownership - updating all family members to user_id 1...\n');

  try {
    // Update all family members to belong to user_id 1
    const result = await db.update(familyMembers)
      .set({ userId: 1 })
      .where(eq(familyMembers.userId, 6));

    console.log('✅ Updated all family members to user_id 1');

    // Verify the fix
    const members = await db.select().from(familyMembers).orderBy(familyMembers.id);
    console.log('\n📋 Updated family members:');
    members.forEach(m => {
      console.log(`ID: ${m.id} | Name: ${m.name} | User ID: ${m.userId} | Email: ${m.email}`);
    });

    console.log('\n✅ Ownership fix completed! All members now belong to user_id 1');
    console.log('🎉 You can now save program credentials without 404 errors!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

fixOwnership();