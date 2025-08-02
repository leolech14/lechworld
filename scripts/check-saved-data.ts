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

async function checkSavedData() {
  console.log('🔍 Checking saved credential data...\n');

  try {
    // Get all member programs with credentials
    const programs = await db.select({
      mpId: memberPrograms.id,
      memberName: familyMembers.name,
      airlineName: airlines.name,
      memberNumber: memberPrograms.memberNumber,
      accountPassword: memberPrograms.accountPassword,
      pin: memberPrograms.pin,
      documentNumber: memberPrograms.documentNumber,
      documentType: memberPrograms.documentType,
      updatedAt: memberPrograms.updatedAt,
    })
    .from(memberPrograms)
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .innerJoin(airlines, eq(memberPrograms.airlineId, airlines.id))
    .orderBy(memberPrograms.id);

    console.log('Member Program Credentials:');
    console.log('===========================');
    programs.forEach(p => {
      console.log(`\nID: ${p.mpId} | ${p.memberName} - ${p.airlineName}`);
      console.log(`  Member Number: ${p.memberNumber || 'EMPTY'}`);
      console.log(`  Password: ${p.accountPassword || 'EMPTY'}`);
      console.log(`  PIN: ${p.pin || 'EMPTY'}`);
      console.log(`  Document: ${p.documentNumber || 'EMPTY'} (${p.documentType || 'N/A'})`);
      console.log(`  Updated: ${p.updatedAt || 'Never'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkSavedData();