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

async function checkOwnership() {
  console.log('🔍 Checking member program ownership...\n');

  try {
    // Get all member programs with their owners
    const programs = await db.select({
      mpId: memberPrograms.id,
      memberId: memberPrograms.memberId,
      memberName: familyMembers.name,
      userId: familyMembers.userId,
      airlineName: airlines.name,
      accountNumber: memberPrograms.memberNumber,
      pointsBalance: memberPrograms.currentMiles,
    })
    .from(memberPrograms)
    .innerJoin(familyMembers, eq(memberPrograms.memberId, familyMembers.id))
    .innerJoin(airlines, eq(memberPrograms.airlineId, airlines.id))
    .orderBy(memberPrograms.id);

    console.log('Member Programs Ownership:');
    console.log('=========================');
    programs.forEach(p => {
      console.log(`ID: ${p.mpId} | Member: ${p.memberName} (user_id: ${p.userId}) | ${p.airlineName} | Acc: ${p.accountNumber || 'N/A'} | Points: ${p.pointsBalance}`);
    });

    // Check specific ID 6
    console.log('\n🎯 Checking member program ID 6 specifically:');
    const programSix = programs.find(p => p.mpId === 6);
    if (programSix) {
      console.log(`Program ID 6 belongs to user_id: ${programSix.userId}`);
      console.log(`Current session is trying to access with user_id: 1`);
      console.log(`Match: ${programSix.userId === 1 ? '✅ YES' : '❌ NO'}`);
    }

    // Check all family members
    console.log('\n👥 All Family Members:');
    const members = await db.select().from(familyMembers).orderBy(familyMembers.id);
    members.forEach(m => {
      console.log(`ID: ${m.id} | Name: ${m.name} | User ID: ${m.userId} | Email: ${m.email}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOwnership();