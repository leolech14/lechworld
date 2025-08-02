import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { airlines } from '../shared/schemas/database.js';

dotenv.config();

const { Pool } = pg;

async function seedDatabase() {
  console.log('🌱 Seeding database with airline data...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld'
  });

  const db = drizzle(pool);

  try {
    const airlineData = [
      {
        code: 'LA',
        name: 'LATAM Airlines',
        programName: 'LATAM Pass',
        transferEnabled: true,
        minTransferAmount: 1000,
        transferFeeType: 'flat',
        transferFeePoints: 1000,
        transferDelayHours: 0,
        expirationMonths: 36,
        extendableOnActivity: true,
        googleWalletSupported: true
      },
      {
        code: 'G3',
        name: 'GOL',
        programName: 'Smiles',
        transferEnabled: true,
        minTransferAmount: 1000,
        transferFeeType: 'tiered',
        transferFeeAmount: 0,
        transferDelayHours: 72,
        expirationMonths: 24,
        extendableOnActivity: true,
        googleWalletSupported: true
      },
      {
        code: 'AD',
        name: 'Azul',
        programName: 'TudoAzul',
        transferEnabled: true,
        minTransferAmount: 1000,
        transferFeeType: 'tiered',
        transferFeeAmount: 10,
        transferDelayHours: 48,
        expirationMonths: 24,
        extendableOnActivity: true,
        googleWalletSupported: true
      },
      {
        code: 'TP',
        name: 'TAP Air Portugal',
        programName: 'TAP Miles&Go',
        transferEnabled: true,
        minTransferAmount: 1000,
        transferFeeType: 'percentage',
        transferFeeAmount: 17,
        transferDelayHours: 0,
        expirationMonths: 36,
        extendableOnActivity: true,
        googleWalletSupported: true
      },
      {
        code: 'UA',
        name: 'United Airlines',
        programName: 'MileagePlus',
        transferEnabled: true,
        minTransferAmount: 500,
        transferFeeType: 'tiered',
        transferFeeAmount: 38,
        transferDelayHours: 0,
        expirationMonths: 18,
        extendableOnActivity: true,
        googleWalletSupported: true
      },
      {
        code: 'AA',
        name: 'American Airlines',
        programName: 'AAdvantage',
        transferEnabled: true,
        minTransferAmount: 1000,
        transferFeeType: 'percentage',
        transferFeeAmount: 15,
        transferDelayHours: 0,
        expirationMonths: 18,
        extendableOnActivity: true,
        googleWalletSupported: true
      },
      {
        code: 'BA',
        name: 'British Airways',
        programName: 'Executive Club',
        transferEnabled: false,
        expirationMonths: 36,
        extendableOnActivity: true,
        googleWalletSupported: true
      },
      {
        code: 'DL',
        name: 'Delta Air Lines',
        programName: 'SkyMiles',
        transferEnabled: false,
        expirationMonths: null, // Never expire
        extendableOnActivity: false,
        googleWalletSupported: true
      },
      {
        code: 'EK',
        name: 'Emirates',
        programName: 'Skywards',
        transferEnabled: false,
        expirationMonths: 36,
        extendableOnActivity: true,
        googleWalletSupported: true
      },
      {
        code: 'AC',
        name: 'Air Canada',
        programName: 'Aeroplan',
        transferEnabled: false,
        expirationMonths: 18,
        extendableOnActivity: true,
        googleWalletSupported: true
      }
    ];

    // Insert airlines
    for (const airline of airlineData) {
      await db.insert(airlines).values(airline).onConflictDoNothing();
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded ${airlineData.length} airlines`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();