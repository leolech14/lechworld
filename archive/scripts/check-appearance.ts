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

async function checkAppearance() {
  console.log('🎨 Checking member appearance data...\n');

  try {
    const members = await db.select().from(familyMembers).orderBy(familyMembers.id);
    
    console.log('Member Appearance Settings:');
    console.log('===========================');
    members.forEach(m => {
      console.log(`\nID: ${m.id} | Name: ${m.name}`);
      console.log(`  Profile Emoji: ${m.profileEmoji || 'DEFAULT (👤)'}`);
      console.log(`  Frame Color: ${m.frameColor || 'DEFAULT'}`);
      console.log(`  Frame Border: ${m.frameBorderColor || 'DEFAULT'}`);
      console.log(`  Profile Photo: ${m.profilePhoto || 'NONE'}`);
      console.log(`  Color (old): ${m.color || 'DEFAULT'}`);
      console.log(`  Updated: ${m.updatedAt || 'Never'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAppearance();