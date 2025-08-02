import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { memberPrograms, familyMembers, airlines } from '../shared/schemas/database.js';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool);

async function checkCustomFields() {
  console.log('🔍 Checking custom_fields data...\n');

  try {
    // Get all member programs with custom fields
    const programs = await db.select({
      mpId: memberPrograms.id,
      memberName: familyMembers.name,
      airlineName: airlines.name,
      customFields: memberPrograms.customFields,
      updatedAt: memberPrograms.updatedAt,
    })
    .from(memberPrograms)
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .innerJoin(airlines, eq(memberPrograms.airlineId, airlines.id))
    .orderBy(memberPrograms.id);

    console.log('Member Program Custom Fields:');
    console.log('=============================');
    programs.forEach(p => {
      console.log(`\nID: ${p.mpId} | ${p.memberName} - ${p.airlineName}`);
      console.log(`Updated: ${p.updatedAt || 'Never'}`);
      if (p.customFields && Array.isArray(p.customFields)) {
        console.log('Custom Fields:');
        (p.customFields as any[]).forEach(field => {
          console.log(`  - ${field.label}: ${field.value || 'EMPTY'}`);
        });
      } else {
        console.log('  No custom fields');
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkCustomFields();