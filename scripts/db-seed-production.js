#!/usr/bin/env node

/**
 * Production Database Seeding Script
 * Compatible with Neon, Supabase, Railway PostgreSQL
 * 
 * Features:
 * - Safe production seeding with checks
 * - Comprehensive Brazilian loyalty programs
 * - Demo family data for testing
 * - Rollback capabilities
 * - Environment-aware execution
 * 
 * Usage:
 *   node scripts/db-seed-production.js [--force] [--minimal] [--rollback]
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Import schema
const schema = require('../packages/database/src/schema');

// Configuration
const BACKUP_DIR = '/tmp/lechworld-seed-backups';
const LOG_FILE = `/tmp/lechworld-seed-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Logging utility
function log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    
    console.log(logEntry);
    fs.appendFileSync(LOG_FILE, logEntry + '\n');
}

// Check if running in production
function isProduction() {
    return process.env.NODE_ENV === 'production' || 
           process.env.DATABASE_URL?.includes('neon.tech') ||
           process.env.DATABASE_URL?.includes('supabase.co') ||
           process.env.DATABASE_URL?.includes('railway.app');
}

// Create backup before seeding
async function createBackup(db, sql) {
    log('INFO', 'Creating backup before seeding...');
    
    try {
        const tables = ['families', 'users', 'family_members', 'loyalty_programs', 'member_programs'];
        const backupData = {};
        
        for (const tableName of tables) {
            const result = await sql`SELECT * FROM ${sql(tableName)}`;
            backupData[tableName] = result;
            log('INFO', `Backed up ${result.length} records from ${tableName}`);
        }
        
        const backupFile = path.join(BACKUP_DIR, `seed-backup-${Date.now()}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        
        // Save latest backup reference
        fs.writeFileSync(path.join(BACKUP_DIR, 'latest-seed-backup.txt'), backupFile);
        
        log('INFO', `Backup created: ${backupFile}`);
        return backupFile;
    } catch (error) {
        log('ERROR', `Backup creation failed: ${error.message}`);
        throw error;
    }
}

// Loyalty Programs Data - Comprehensive Brazilian Programs
const loyaltyPrograms = [
    // Airlines
    {
        name: 'Smiles',
        company: 'GOL Linhas Aéreas',
        code: 'G3',
        programType: 'miles',
        category: 'airline',
        logoColor: '#FF6B00',
        pointValue: '0.015',
        transferEnabled: true,
        minTransferAmount: 1000,
        transferFeeType: 'flat',
        transferFeeAmount: 500,
        expirationMonths: 24,
        extendableOnActivity: true,
        website: 'https://www.smiles.com.br',
        phoneNumber: '0300-115-7875',
        isActive: true
    },
    {
        name: 'LATAM Pass',
        company: 'LATAM Airlines',
        code: 'LA',
        programType: 'miles',
        category: 'airline',
        logoColor: '#E6007E',
        pointValue: '0.018',
        transferEnabled: true,
        minTransferAmount: 1000,
        transferFeeType: 'percentage',
        transferFeeAmount: 5,
        expirationMonths: 36,
        extendableOnActivity: true,
        website: 'https://www.latampass.latam.com',
        phoneNumber: '0300-570-5700',
        isActive: true
    },
    {
        name: 'TudoAzul',
        company: 'Azul Linhas Aéreas',
        code: 'AD',
        programType: 'points',
        category: 'airline',
        logoColor: '#003F7F',
        pointValue: '0.012',
        transferEnabled: true,
        minTransferAmount: 2000,
        transferFeeType: 'flat',
        transferFeeAmount: 300,
        expirationMonths: 24,
        extendableOnActivity: true,
        website: 'https://www.tudoazul.com',
        phoneNumber: '4003-1118',
        isActive: true
    },
    
    // Hotels
    {
        name: 'Marriott Bonvoy',
        company: 'Marriott International',
        code: null,
        programType: 'points',
        category: 'hotel',
        logoColor: '#8B1538',
        pointValue: '0.008',
        transferEnabled: true,
        minTransferAmount: 3000,
        transferFeeType: 'tiered',
        transferFeeAmount: 10,
        expirationMonths: 24,
        extendableOnActivity: true,
        website: 'https://www.marriott.com/loyalty',
        phoneNumber: '0800-703-9000',
        isActive: true
    },
    {
        name: 'IHG One Rewards',
        company: 'InterContinental Hotels Group',
        code: null,
        programType: 'points',
        category: 'hotel',
        logoColor: '#006747',
        pointValue: '0.005',
        transferEnabled: false,
        expirationMonths: 12,
        extendableOnActivity: true,
        website: 'https://www.ihg.com/rewardsclub',
        phoneNumber: '0800-701-5560',
        isActive: true
    },
    
    // Credit Cards
    {
        name: 'Livelo',
        company: 'Bradesco/Banco do Brasil',
        code: null,
        programType: 'points',
        category: 'credit_card',
        logoColor: '#FF4D6D',
        pointValue: '0.010',
        transferEnabled: true,
        minTransferAmount: 1000,
        transferFeeType: 'flat',
        transferFeeAmount: 0,
        transferPartners: JSON.stringify([
            { name: 'Smiles', ratio: '1:1', fee: 0 },
            { name: 'LATAM Pass', ratio: '2.2:1', fee: 0 },
            { name: 'TudoAzul', ratio: '1.5:1', fee: 0 }
        ]),
        expirationMonths: 24,
        extendableOnActivity: true,
        website: 'https://www.livelo.com.br',
        phoneNumber: '4004-4474',
        isActive: true
    },
    {
        name: 'Esfera',
        company: 'Itaú Unibanco',
        code: null,
        programType: 'points',
        category: 'credit_card',
        logoColor: '#EC6E00',
        pointValue: '0.008',
        transferEnabled: true,
        minTransferAmount: 1000,
        transferFeeType: 'flat',
        transferFeeAmount: 0,
        transferPartners: JSON.stringify([
            { name: 'Smiles', ratio: '1:1', fee: 0 },
            { name: 'LATAM Pass', ratio: '2:1', fee: 0 }
        ]),
        expirationMonths: 36,
        extendableOnActivity: false,
        website: 'https://www.itau.com.br/cartoes/pontos',
        phoneNumber: '4004-4828',
        isActive: true
    },
    {
        name: 'Premmia',
        company: 'Santander',
        code: null,
        programType: 'points',
        category: 'credit_card',
        logoColor: '#EC0000',
        pointValue: '0.007',
        transferEnabled: true,
        minTransferAmount: 1000,
        transferFeeType: 'percentage',
        transferFeeAmount: 3,
        expirationMonths: 24,
        extendableOnActivity: true,
        website: 'https://www.santander.com.br/premmia',
        phoneNumber: '4004-3535',
        isActive: true
    },
    
    // Retail
    {
        name: 'Dotz',
        company: 'Dotz S.A.',
        code: null,
        programType: 'points',
        category: 'retail',
        logoColor: '#6366F1',
        pointValue: '0.005',
        transferEnabled: false,
        expirationMonths: 12,
        extendableOnActivity: true,
        website: 'https://www.dotz.com.br',
        phoneNumber: '4020-3322',
        isActive: true
    }
];

// Demo family data
const demoFamilies = [
    {
        name: 'Família Silva',
        members: [
            {
                name: 'João Silva',
                email: 'joao@silva.com.br',
                role: 'primary',
                cpf: '12345678901',
                phone: '+55 11 99999-1111',
                birthdate: '1980-05-15',
                frameColor: '#E3F2FD',
                frameBorderColor: '#2196F3',
                profileEmoji: '👨‍💼'
            },
            {
                name: 'Maria Silva',
                email: 'maria@silva.com.br',
                role: 'primary',
                cpf: '12345678902',
                phone: '+55 11 99999-2222',
                birthdate: '1985-08-22',
                frameColor: '#FCE4EC',
                frameBorderColor: '#E91E63',
                profileEmoji: '👩‍💼'
            },
            {
                name: 'Pedro Silva',
                email: 'pedro@silva.com.br',
                role: 'extended',
                cpf: '12345678903',
                phone: '+55 11 99999-3333',
                birthdate: '2010-03-10',
                frameColor: '#E8F5E8',
                frameBorderColor: '#4CAF50',
                profileEmoji: '👦'
            }
        ]
    }
];

// Demo users
const demoUsers = [
    {
        username: 'admin',
        email: 'admin@lechworld.com',
        name: 'System Administrator',
        role: 'admin',
        isFirstLogin: false
    },
    {
        username: 'demo',
        email: 'demo@lechworld.com',
        name: 'Demo User',
        role: 'member',
        isFirstLogin: false
    }
];

// Seed loyalty programs
async function seedLoyaltyPrograms(db) {
    log('INFO', 'Seeding loyalty programs...');
    
    try {
        const inserted = await db.insert(schema.loyaltyPrograms).values(loyaltyPrograms).returning();
        log('INFO', `Inserted ${inserted.length} loyalty programs`);
        return inserted;
    } catch (error) {
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            log('WARN', 'Loyalty programs already exist, skipping...');
            return await db.select().from(schema.loyaltyPrograms);
        } else {
            throw error;
        }
    }
}

// Seed demo families and users
async function seedDemoData(db) {
    log('INFO', 'Seeding demo data...');
    
    try {
        // Create demo family
        const [family] = await db.insert(schema.families).values({
            name: demoFamilies[0].name
        }).returning();
        
        log('INFO', `Created demo family: ${family.name}`);
        
        // Hash password for demo users
        const passwordHash = await bcrypt.hash('demo123', 12);
        
        // Create users
        const usersToInsert = demoUsers.map(user => ({
            ...user,
            familyId: family.id,
            passwordHash
        }));
        
        const insertedUsers = await db.insert(schema.users).values(usersToInsert).returning();
        log('INFO', `Created ${insertedUsers.length} demo users`);
        
        // Create family members
        const membersToInsert = demoFamilies[0].members.map((member, index) => ({
            ...member,
            familyId: family.id,
            userId: index < insertedUsers.length ? insertedUsers[index].id : null
        }));
        
        const insertedMembers = await db.insert(schema.familyMembers).values(membersToInsert).returning();
        log('INFO', `Created ${insertedMembers.length} family members`);
        
        // Create demo member programs (assign some programs to members)
        const programs = await db.select().from(schema.loyaltyPrograms).limit(3);
        const memberPrograms = [];
        
        for (let i = 0; i < Math.min(insertedMembers.length, programs.length); i++) {
            memberPrograms.push({
                memberId: insertedMembers[i].id,
                programId: programs[i].id,
                accountNumber: `DEMO${1000 + i}`,
                pointsBalance: Math.floor(Math.random() * 50000) + 10000,
                statusLevel: 'silver',
                yearlyEarnings: Math.floor(Math.random() * 20000) + 5000,
                yearlySpending: Math.floor(Math.random() * 100000) + 20000,
                estimatedValue: 'R$ ' + (Math.floor(Math.random() * 1000) + 200).toString(),
                notes: 'Demo account for testing',
                lastUpdatedBy: insertedUsers[0].id,
                isActive: true
            });
        }
        
        if (memberPrograms.length > 0) {
            const insertedMemberPrograms = await db.insert(schema.memberPrograms).values(memberPrograms).returning();
            log('INFO', `Created ${insertedMemberPrograms.length} demo member programs`);
        }
        
        // Create notification preferences for users
        const notificationPrefs = insertedUsers.map(user => ({
            userId: user.id,
            emailEnabled: true,
            emailFrequency: 'weekly',
            expirationAlertDays: 90,
            whatsappEnabled: false,
            pushEnabled: true
        }));
        
        await db.insert(schema.notificationPreferences).values(notificationPrefs);
        log('INFO', `Created notification preferences for ${notificationPrefs.length} users`);
        
        // Create sample activity log entries
        const activityLogs = [
            {
                userId: insertedUsers[0].id,
                memberId: insertedMembers[0].id,
                action: 'member_created',
                category: 'account',
                description: 'Demo family member created during initial setup',
                metadata: JSON.stringify({ source: 'seed_script', demo: true })
            },
            {
                userId: insertedUsers[0].id,
                action: 'system_initialized',
                category: 'general',
                description: 'System initialized with demo data',
                metadata: JSON.stringify({ version: '1.0.0', environment: 'production' })
            }
        ];
        
        await db.insert(schema.activityLog).values(activityLogs);
        log('INFO', `Created ${activityLogs.length} activity log entries`);
        
        return {
            family,
            users: insertedUsers,
            members: insertedMembers,
            memberPrograms
        };
        
    } catch (error) {
        if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
            log('WARN', 'Demo data already exists, skipping...');
            return null;
        } else {
            throw error;
        }
    }
}

// Rollback function
async function rollback() {
    log('INFO', 'Starting rollback...');
    
    const latestBackupFile = path.join(BACKUP_DIR, 'latest-seed-backup.txt');
    if (!fs.existsSync(latestBackupFile)) {
        log('ERROR', 'No backup found for rollback');
        process.exit(1);
    }
    
    const backupPath = fs.readFileSync(latestBackupFile, 'utf8').trim();
    if (!fs.existsSync(backupPath)) {
        log('ERROR', `Backup file not found: ${backupPath}`);
        process.exit(1);
    }
    
    const sql = postgres(process.env.DATABASE_URL);
    const db = drizzle(sql, { schema });
    
    try {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        
        // Clear current data
        await db.delete(schema.activityLog);
        await db.delete(schema.notificationPreferences);
        await db.delete(schema.mileTransactions);
        await db.delete(schema.memberPrograms);
        await db.delete(schema.familyMembers);
        await db.delete(schema.users);
        await db.delete(schema.loyaltyPrograms);
        await db.delete(schema.families);
        
        log('INFO', 'Cleared existing data');
        
        // Restore data in correct order
        const restoreOrder = ['families', 'users', 'loyalty_programs', 'family_members', 'member_programs'];
        
        for (const tableName of restoreOrder) {
            if (backupData[tableName] && backupData[tableName].length > 0) {
                await db.insert(schema[tableName]).values(backupData[tableName]);
                log('INFO', `Restored ${backupData[tableName].length} records to ${tableName}`);
            }
        }
        
        log('INFO', 'Rollback completed successfully');
        
    } catch (error) {
        log('ERROR', `Rollback failed: ${error.message}`);
        throw error;
    } finally {
        await sql.end();
    }
}

// Main seeding function
async function main() {
    const args = process.argv.slice(2);
    const force = args.includes('--force');
    const minimal = args.includes('--minimal');
    const shouldRollback = args.includes('--rollback');
    
    if (shouldRollback) {
        await rollback();
        return;
    }
    
    // Check environment
    if (isProduction() && !force) {
        console.log('⚠️  Production environment detected!');
        console.log('This script will seed data to your production database.');
        console.log('Use --force flag if you really want to proceed.');
        console.log('Use --minimal flag for minimal seeding (loyalty programs only).');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/db-seed-production.js --force           # Full seeding');
        console.log('  node scripts/db-seed-production.js --force --minimal # Minimal seeding');
        console.log('  node scripts/db-seed-production.js --rollback        # Restore backup');
        process.exit(1);
    }
    
    if (!process.env.DATABASE_URL) {
        log('ERROR', 'DATABASE_URL environment variable is required');
        process.exit(1);
    }
    
    const sql = postgres(process.env.DATABASE_URL);
    const db = drizzle(sql, { schema });
    
    try {
        log('INFO', `Starting database seeding... (minimal: ${minimal})`);
        log('INFO', `Log file: ${LOG_FILE}`);
        
        // Create backup
        await createBackup(db, sql);
        
        // Seed loyalty programs (always)
        const programs = await seedLoyaltyPrograms(db);
        
        if (!minimal) {
            // Seed demo data only if not minimal
            await seedDemoData(db);
        }
        
        log('INFO', 'Database seeding completed successfully!');
        log('INFO', `Log saved to: ${LOG_FILE}`);
        
        // Summary
        const stats = await db.select().from(schema.families);
        const userCount = await db.select().from(schema.users);
        const programCount = await db.select().from(schema.loyaltyPrograms);
        
        console.log('\n📊 Seeding Summary:');
        console.log(`   Families: ${stats.length}`);
        console.log(`   Users: ${userCount.length}`);
        console.log(`   Loyalty Programs: ${programCount.length}`);
        console.log('');
        console.log('🔐 Demo Credentials (if seeded):');
        console.log('   Username: admin | Password: demo123');
        console.log('   Username: demo  | Password: demo123');
        console.log('');
        
    } catch (error) {
        log('ERROR', `Seeding failed: ${error.message}`);
        console.error('\n❌ Seeding failed:', error.message);
        console.error('Check the log file for details:', LOG_FILE);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    log('ERROR', `Unhandled rejection: ${error.message}`);
    console.error('❌ Unhandled rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    log('ERROR', `Uncaught exception: ${error.message}`);
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

if (require.main === module) {
    main();
}