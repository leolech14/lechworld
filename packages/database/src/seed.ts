#!/usr/bin/env tsx
/**
 * @fileoverview Database seeding script
 * @description Seeds the database with comprehensive initial data for the Family Loyalty Program
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcryptjs';

// Load environment variables
config({ path: '../../../.env' });

import { 
  families, 
  users, 
  familyMembers, 
  loyaltyPrograms, 
  memberPrograms,
  mileTransactions,
  notificationPreferences,
  activityLog,
} from './schema';

// Utility function to hash passwords
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Sample loyalty programs data
const sampleLoyaltyPrograms = [
  {
    name: 'LATAM Pass',
    company: 'LATAM Airlines',
    code: 'LA',
    programType: 'miles' as const,
    category: 'airline' as const,
    logoColor: '#8B1538',
    pointValue: '0.02',
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: 'flat' as const,
    transferFeeAmount: 100,
    expirationMonths: 36,
    extendableOnActivity: true,
    website: 'https://www.latampass.latam.com',
    phoneNumber: '+55 11 2142-6000',
    isActive: true,
  },
  {
    name: 'Azul TudoAzul',
    company: 'Azul Airlines',
    code: 'AD',
    programType: 'points' as const,
    category: 'airline' as const,
    logoColor: '#0066CC',
    pointValue: '0.015',
    transferEnabled: true,
    minTransferAmount: 500,
    transferFeeType: 'percentage' as const,
    transferFeeAmount: 5,
    expirationMonths: 24,
    extendableOnActivity: true,
    website: 'https://www.tudoazul.com',
    phoneNumber: '+55 11 4003-1118',
    isActive: true,
  },
  {
    name: 'GOL Smiles',
    company: 'GOL Airlines',
    code: 'G3',
    programType: 'miles' as const,
    category: 'airline' as const,
    logoColor: '#FF6600',
    pointValue: '0.018',
    transferEnabled: false,
    expirationMonths: 36,
    extendableOnActivity: true,
    website: 'https://www.smiles.com.br',
    phoneNumber: '+55 0300 115 2121',
    isActive: true,
  },
  {
    name: 'American Airlines AAdvantage',
    company: 'American Airlines',
    code: 'AA',
    programType: 'miles' as const,
    category: 'airline' as const,
    logoColor: '#C41E3A',
    pointValue: '0.025',
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: 'flat' as const,
    transferFeeAmount: 150,
    expirationMonths: 18,
    extendableOnActivity: true,
    website: 'https://www.aa.com',
    phoneNumber: '+1 800 433 7300',
    isActive: true,
  },
  {
    name: 'Marriott Bonvoy',
    company: 'Marriott International',
    code: 'MR',
    programType: 'points' as const,
    category: 'hotel' as const,
    logoColor: '#8B2635',
    pointValue: '0.008',
    transferEnabled: true,
    minTransferAmount: 3000,
    transferFeeType: 'flat' as const,
    transferFeeAmount: 0,
    expirationMonths: 24,
    extendableOnActivity: true,
    website: 'https://www.marriott.com',
    phoneNumber: '+1 800 627 7468',
    isActive: true,
  },
  {
    name: 'Santander Esfera',
    company: 'Banco Santander',
    code: 'ST',
    programType: 'points' as const,
    category: 'credit_card' as const,
    logoColor: '#EC0000',
    pointValue: '0.005',
    transferEnabled: true,
    minTransferAmount: 500,
    transferFeeType: 'percentage' as const,
    transferFeeAmount: 3,
    expirationMonths: 24,
    extendableOnActivity: false,
    website: 'https://www.santander.com.br',
    phoneNumber: '+55 4004 3535',
    isActive: true,
  },
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  const databaseUrl = process.env.DATABASE_URL || 'postgresql://orchestrator:orchestrator123@localhost:5432/orchestrator';
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...');
    await db.delete(mileTransactions);
    await db.delete(memberPrograms);
    await db.delete(activityLog);
    await db.delete(notificationPreferences);
    await db.delete(familyMembers);
    await db.delete(users);
    await db.delete(families);
    await db.delete(loyaltyPrograms);

    // Insert families
    console.log('👨‍👩‍👧‍👦 Creating families...');
    const [family1, family2, family3] = await db.insert(families).values([
      {
        name: 'Silva Family',
      },
      {
        name: 'Santos Family',
      },
      {
        name: 'Oliveira Family',
      },
    ]).returning();

    console.log(`✅ Created ${3} families`);

    // Insert users
    console.log('👤 Creating users...');
    const hashedPassword1 = await hashPassword('admin123');
    const hashedPassword2 = await hashPassword('demo123');
    const hashedPassword3 = await hashPassword('family123');

    const [admin, demo, familyHead] = await db.insert(users).values([
      {
        username: 'admin',
        email: 'admin@lechworld.com',
        passwordHash: hashedPassword1,
        name: 'System Administrator',
        role: 'admin',
        familyId: family1.id,
        isFirstLogin: false,
      },
      {
        username: 'demo',
        email: 'demo@lechworld.com',
        passwordHash: hashedPassword2,
        name: 'Demo User',
        role: 'member',
        familyId: family2.id,
        isFirstLogin: false,
      },
      {
        username: 'lech',
        email: 'lech@lechworld.com',
        passwordHash: hashedPassword3,
        name: 'Lech Mazur',
        role: 'member',
        familyId: family3.id,
        isFirstLogin: false,
      },
    ]).returning();

    console.log(`✅ Created ${3} users`);

    // Insert loyalty programs
    console.log('✈️ Creating loyalty programs...');
    const insertedPrograms = await db.insert(loyaltyPrograms).values(sampleLoyaltyPrograms).returning();
    console.log(`✅ Created ${insertedPrograms.length} loyalty programs`);

    // Insert family members
    console.log('👨‍👩‍👧‍👦 Creating family members...');
    const familyMemberData = [
      // Silva Family
      {
        name: 'Carlos Silva',
        email: 'carlos.silva@email.com',
        role: 'primary' as const,
        userId: admin.id,
        familyId: family1.id,
        cpf: '12345678901',
        phone: '+55 11 99999-9999',
        birthdate: '1980-05-15',
        frameColor: '#E3F2FD',
        frameBorderColor: '#1976D2',
        profileEmoji: '👨‍💼',
      },
      {
        name: 'Maria Silva',
        email: 'maria.silva@email.com',
        role: 'extended' as const,
        familyId: family1.id,
        cpf: '12345678902',
        phone: '+55 11 88888-8888',
        birthdate: '1985-08-22',
        frameColor: '#F3E5F5',
        frameBorderColor: '#7B1FA2',
        profileEmoji: '👩‍💼',
      },
      {
        name: 'João Silva',
        email: 'joao.silva@email.com',
        role: 'view_only' as const,
        familyId: family1.id,
        birthdate: '2010-03-10',
        frameColor: '#E8F5E8',
        frameBorderColor: '#388E3C',
        profileEmoji: '👦',
      },
      // Santos Family
      {
        name: 'Ana Santos',
        email: 'ana.santos@email.com',
        role: 'primary' as const,
        userId: demo.id,
        familyId: family2.id,
        cpf: '23456789012',
        phone: '+55 21 77777-7777',
        birthdate: '1978-12-03',
        frameColor: '#FFF3E0',
        frameBorderColor: '#F57C00',
        profileEmoji: '👩‍🚀',
      },
      {
        name: 'Pedro Santos',
        email: 'pedro.santos@email.com',
        role: 'extended' as const,
        familyId: family2.id,
        cpf: '23456789013',
        phone: '+55 21 66666-6666',
        birthdate: '1975-09-18',
        frameColor: '#FFEBEE',
        frameBorderColor: '#D32F2F',
        profileEmoji: '👨‍🎓',
      },
      // Oliveira Family (Lech's family)
      {
        name: 'Lech Mazur',
        email: 'lech@lechworld.com',
        role: 'primary' as const,
        userId: familyHead.id,
        familyId: family3.id,
        cpf: '34567890123',
        phone: '+55 11 95555-5555',
        birthdate: '1990-07-12',
        frameColor: '#E0F2F1',
        frameBorderColor: '#00695C',
        profileEmoji: '🧑‍💻',
      },
    ];

    const insertedMembers = await db.insert(familyMembers).values(familyMemberData).returning();
    console.log(`✅ Created ${insertedMembers.length} family members`);

    // Insert member programs (enrollments)
    console.log('📋 Creating member program enrollments...');
    const memberProgramData = [
      // Carlos Silva enrollments
      {
        memberId: insertedMembers[0].id, // Carlos
        programId: insertedPrograms[0].id, // LATAM Pass
        accountNumber: 'LA123456789',
        pointsBalance: 125000,
        statusLevel: 'gold' as const,
        yearlyEarnings: 85000,
        yearlySpending: 12000,
        estimatedValue: 'R$ 2,500.00',
        notes: 'Primary traveler account',
        lastUpdatedBy: admin.id,
      },
      {
        memberId: insertedMembers[0].id, // Carlos
        programId: insertedPrograms[3].id, // American Airlines
        accountNumber: 'AA987654321',
        pointsBalance: 75000,
        statusLevel: 'silver' as const,
        yearlyEarnings: 45000,
        yearlySpending: 8500,
        estimatedValue: 'R$ 1,875.00',
        lastUpdatedBy: admin.id,
      },
      // Maria Silva enrollments
      {
        memberId: insertedMembers[1].id, // Maria
        programId: insertedPrograms[1].id, // Azul TudoAzul
        accountNumber: 'AD456789123',
        pointsBalance: 85000,
        statusLevel: 'platinum' as const,
        yearlyEarnings: 65000,
        yearlySpending: 9800,
        estimatedValue: 'R$ 1,275.00',
        lastUpdatedBy: admin.id,
      },
      {
        memberId: insertedMembers[1].id, // Maria
        programId: insertedPrograms[4].id, // Marriott Bonvoy
        accountNumber: 'MR789123456',
        pointsBalance: 180000,
        statusLevel: 'gold' as const,
        yearlyEarnings: 120000,
        yearlySpending: 15000,
        estimatedValue: 'R$ 1,440.00',
        lastUpdatedBy: admin.id,
      },
      // Ana Santos enrollments
      {
        memberId: insertedMembers[3].id, // Ana
        programId: insertedPrograms[2].id, // GOL Smiles
        accountNumber: 'G3321654987',
        pointsBalance: 95000,
        statusLevel: 'diamond' as const,
        yearlyEarnings: 75000,
        yearlySpending: 11200,
        estimatedValue: 'R$ 1,710.00',
        lastUpdatedBy: demo.id,
      },
      {
        memberId: insertedMembers[3].id, // Ana
        programId: insertedPrograms[5].id, // Santander Esfera
        accountNumber: 'ST654987321',
        pointsBalance: 250000,
        statusLevel: 'platinum' as const,
        yearlyEarnings: 180000,
        yearlySpending: 25000,
        estimatedValue: 'R$ 1,250.00',
        lastUpdatedBy: demo.id,
      },
      // Lech Mazur enrollments
      {
        memberId: insertedMembers[5].id, // Lech
        programId: insertedPrograms[0].id, // LATAM Pass
        accountNumber: 'LA555666777',
        pointsBalance: 195000,
        statusLevel: 'platinum' as const,
        yearlyEarnings: 145000,
        yearlySpending: 18500,
        estimatedValue: 'R$ 3,900.00',
        notes: 'Tech professional - frequent business travel',
        lastUpdatedBy: familyHead.id,
      },
      {
        memberId: insertedMembers[5].id, // Lech
        programId: insertedPrograms[1].id, // Azul TudoAzul
        accountNumber: 'AD777888999',
        pointsBalance: 120000,
        statusLevel: 'gold' as const,
        yearlyEarnings: 85000,
        yearlySpending: 12800,
        estimatedValue: 'R$ 1,800.00',
        lastUpdatedBy: familyHead.id,
      },
    ];

    const insertedMemberPrograms = await db.insert(memberPrograms).values(memberProgramData).returning();
    console.log(`✅ Created ${insertedMemberPrograms.length} member program enrollments`);

    // Insert sample transactions
    console.log('💳 Creating sample transactions...');
    const transactionData = [
      // Recent transactions for Carlos (LATAM Pass)
      {
        memberProgramId: insertedMemberPrograms[0].id,
        miles: 15000,
        description: 'Flight GRU-JFK roundtrip',
        transactionDate: new Date('2024-01-15'),
        source: 'flight' as const,
        referenceNumber: 'LA20240115001',
        recordedBy: admin.id,
      },
      {
        memberProgramId: insertedMemberPrograms[0].id,
        miles: -45000,
        description: 'Redeemed for GRU-MAD business class',
        transactionDate: new Date('2024-02-01'),
        source: 'other' as const,
        referenceNumber: 'LA20240201002',
        recordedBy: admin.id,
      },
      {
        memberProgramId: insertedMemberPrograms[0].id,
        miles: 8500,
        description: 'Credit card spending bonus',
        transactionDate: new Date('2024-02-15'),
        source: 'credit_card' as const,
        referenceNumber: 'LA20240215003',
        recordedBy: admin.id,
      },
      // Transactions for Lech (LATAM Pass)
      {
        memberProgramId: insertedMemberPrograms[6].id,
        miles: 25000,
        description: 'Flight SAO-LIS-BCN roundtrip',
        transactionDate: new Date('2024-01-20'),
        source: 'flight' as const,
        referenceNumber: 'LA20240120004',
        recordedBy: familyHead.id,
      },
      {
        memberProgramId: insertedMemberPrograms[6].id,
        miles: 12000,
        description: 'Partner hotel stay bonus',
        transactionDate: new Date('2024-01-25'),
        source: 'bonus' as const,
        referenceNumber: 'LA20240125005',
        recordedBy: familyHead.id,
      },
      // Transactions for Ana (GOL Smiles)
      {
        memberProgramId: insertedMemberPrograms[4].id,
        miles: 18000,
        description: 'Flight GIG-MIA roundtrip',
        transactionDate: new Date('2024-01-10'),
        source: 'flight' as const,
        referenceNumber: 'G320240110006',
        recordedBy: demo.id,
      },
      {
        memberProgramId: insertedMemberPrograms[4].id,
        miles: 5500,
        description: 'Shopping portal purchase',
        transactionDate: new Date('2024-02-05'),
        source: 'shopping' as const,
        referenceNumber: 'G320240205007',
        recordedBy: demo.id,
      },
    ];

    const insertedTransactions = await db.insert(mileTransactions).values(transactionData).returning();
    console.log(`✅ Created ${insertedTransactions.length} sample transactions`);

    // Insert notification preferences
    console.log('🔔 Creating notification preferences...');
    const notificationData = [
      {
        userId: admin.id,
        emailEnabled: true,
        emailFrequency: 'weekly' as const,
        expirationAlertDays: 60,
        whatsappEnabled: false,
        pushEnabled: true,
      },
      {
        userId: demo.id,
        emailEnabled: true,
        emailFrequency: 'monthly' as const,
        expirationAlertDays: 90,
        whatsappEnabled: true,
        whatsappNumber: '+55 21 77777-7777',
        pushEnabled: false,
      },
      {
        userId: familyHead.id,
        emailEnabled: true,
        emailFrequency: 'daily' as const,
        expirationAlertDays: 45,
        whatsappEnabled: true,
        whatsappNumber: '+55 11 95555-5555',
        pushEnabled: true,
      },
    ];

    await db.insert(notificationPreferences).values(notificationData);
    console.log(`✅ Created ${notificationData.length} notification preference sets`);

    // Insert activity log entries
    console.log('📋 Creating activity log entries...');
    const activityData = [
      {
        userId: admin.id,
        memberId: insertedMembers[0].id,
        action: 'account_created',
        category: 'account' as const,
        description: 'Created LATAM Pass account',
        metadata: { programName: 'LATAM Pass', accountNumber: 'LA123456789' },
      },
      {
        userId: familyHead.id,
        memberId: insertedMembers[5].id,
        action: 'points_updated',
        category: 'miles' as const,
        description: 'Updated points balance after flight',
        metadata: { oldBalance: 170000, newBalance: 195000, difference: 25000 },
      },
      {
        userId: demo.id,
        action: 'login',
        category: 'auth' as const,
        description: 'User logged in successfully',
        metadata: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' },
      },
    ];

    await db.insert(activityLog).values(activityData);
    console.log(`✅ Created ${activityData.length} activity log entries`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • ${3} families created`);
    console.log(`  • ${3} users created`);
    console.log(`  • ${insertedPrograms.length} loyalty programs created`);
    console.log(`  • ${insertedMembers.length} family members created`);
    console.log(`  • ${insertedMemberPrograms.length} program enrollments created`);
    console.log(`  • ${insertedTransactions.length} transactions created`);
    console.log(`  • ${notificationData.length} notification preferences created`);
    console.log(`  • ${activityData.length} activity log entries created`);

    console.log('\n🔑 Login credentials:');
    console.log('  • Admin: admin@lechworld.com / admin123');
    console.log('  • Demo: demo@lechworld.com / demo123');
    console.log('  • Lech: lech@lechworld.com / family123');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;