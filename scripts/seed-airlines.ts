import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { airlines } from '../shared/schemas/database.js';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool);

// Based on AIRLINE_PROGRAMS_KNOWLEDGE.md
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
    expirationMonths: 36, // 3 years
    extendableOnActivity: true,
    googleWalletSupported: true,
  },
  {
    code: 'G3',
    name: 'GOL Linhas Aéreas',
    programName: 'Smiles',
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: 'tiered',
    transferFeeAmount: 0, // Varies by status
    transferDelayHours: 72,
    expirationMonths: 36,
    extendableOnActivity: true,
    googleWalletSupported: true,
  },
  {
    code: 'AD',
    name: 'Azul Linhas Aéreas',
    programName: 'TudoAzul',
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: 'tiered',
    transferFeeAmount: 10, // BRL per 1000 points
    transferDelayHours: 48,
    expirationMonths: 24,
    extendableOnActivity: true,
    googleWalletSupported: true,
  },
  {
    code: 'TP',
    name: 'TAP Air Portugal',
    programName: 'TAP Miles&Go',
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: 'tiered',
    transferFeeAmount: 17, // EUR base + 2 EUR per 1000 miles
    transferDelayHours: 0,
    expirationMonths: 36,
    extendableOnActivity: true,
    googleWalletSupported: true,
  },
  {
    code: 'UA',
    name: 'United Airlines',
    programName: 'MileagePlus',
    transferEnabled: true,
    minTransferAmount: 500,
    transferFeeType: 'tiered',
    transferFeeAmount: 7.5, // USD per 500 miles + $30 fee
    transferDelayHours: 0,
    expirationMonths: null, // No expiration with activity
    extendableOnActivity: true,
    googleWalletSupported: true,
  },
  {
    code: 'AA',
    name: 'American Airlines',
    programName: 'AAdvantage',
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: 'tiered',
    transferFeeAmount: 15, // USD per 1000 miles
    transferDelayHours: 0,
    expirationMonths: 18,
    extendableOnActivity: true,
    googleWalletSupported: true,
  },
  {
    code: 'DL',
    name: 'Delta Air Lines',
    programName: 'SkyMiles',
    transferEnabled: false, // Delta doesn't allow transfers
    minTransferAmount: null,
    transferFeeType: null,
    transferFeeAmount: null,
    transferDelayHours: null,
    expirationMonths: null, // No expiration
    extendableOnActivity: false,
    googleWalletSupported: true,
  },
  {
    code: 'AC',
    name: 'Air Canada',
    programName: 'Aeroplan',
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: 'percentage',
    transferFeeAmount: 2, // 2 cents per point
    transferDelayHours: 0,
    expirationMonths: 18,
    extendableOnActivity: true,
    googleWalletSupported: true,
  },
  {
    code: 'BA',
    name: 'British Airways',
    programName: 'Executive Club',
    transferEnabled: true,
    minTransferAmount: 200,
    transferFeeType: 'tiered',
    transferFeeAmount: 12, // GBP per transaction
    transferDelayHours: 0,
    expirationMonths: 36,
    extendableOnActivity: true,
    googleWalletSupported: true,
  },
  {
    code: 'LH',
    name: 'Lufthansa',
    programName: 'Miles & More',
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: 'tiered',
    transferFeeAmount: 7, // EUR per 1000 miles
    transferDelayHours: 0,
    expirationMonths: 36,
    extendableOnActivity: true,
    googleWalletSupported: true,
  }
];

async function seedAirlines() {
  try {
    console.log('🌱 Seeding airlines data...');
    
    // Insert airlines
    for (const airline of airlineData) {
      await db.insert(airlines).values(airline).onConflictDoNothing();
      console.log(`✅ Added ${airline.name} (${airline.programName})`);
    }
    
    console.log('✨ Airlines seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding airlines:', error);
  } finally {
    await pool.end();
  }
}

// Run the seed function
seedAirlines();