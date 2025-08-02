import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { familyMembers, memberPrograms, airlines } from '../shared/schemas/database.js';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool);

async function checkData() {
  try {
    // Check family members
    const members = await db.select().from(familyMembers);
    console.log(`\nFamily Members: ${members.length}`);
    members.forEach(m => console.log(`  - ${m.firstName} ${m.lastName}`));
    
    // Check airlines
    const airlinesData = await db.select().from(airlines);
    console.log(`\nAirlines: ${airlinesData.length}`);
    airlinesData.forEach(a => console.log(`  - ${a.programName}`));
    
    // Check member programs
    const programs = await db.select().from(memberPrograms);
    console.log(`\nMember Programs: ${programs.length}`);
    programs.forEach(p => console.log(`  - Member ID: ${p.memberId}, Airline ID: ${p.airlineId}, Account: ${p.accountNumber}, Miles: ${p.currentMiles}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();