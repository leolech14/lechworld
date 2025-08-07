#!/usr/bin/env tsx
/**
 * @fileoverview Database reset utility script
 * @description Resets database and re-runs migrations and seeding (DEVELOPMENT ONLY)
 */

import { resetDatabase, runMigrations } from '../migrations';
import seedDatabase from '../seed';

async function resetAndSeed() {
  console.log('🚨 DATABASE RESET AND RESEED UTILITY');
  console.log('====================================');
  
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ This script cannot be run in production environment');
    process.exit(1);
  }
  
  console.log('⚠️  WARNING: This will completely reset your database!');
  console.log('   All existing data will be permanently lost.');
  
  // In a real environment, you'd want to add a confirmation prompt
  // For development automation, we'll proceed directly
  
  try {
    // Step 1: Reset database
    console.log('\n1️⃣ Resetting database...');
    await resetDatabase();
    
    // Step 2: Run migrations
    console.log('\n2️⃣ Running migrations...');
    const migrationResult = await runMigrations();
    
    if (!migrationResult.success) {
      throw new Error(`Migration failed: ${migrationResult.error}`);
    }
    
    // Step 3: Seed database
    console.log('\n3️⃣ Seeding database...');
    await seedDatabase();
    
    console.log('\n🎉 Database reset and reseed completed successfully!');
    console.log('\n📋 Your database now contains:');
    console.log('   • Silva Family with 5 members');
    console.log('   • 7+ loyalty programs (Brazilian & International)');
    console.log('   • ~10 member program enrollments');
    console.log('   • Notification preferences for all users');
    console.log('   • Sample transaction history');
    
  } catch (error) {
    console.error('\n❌ Reset and reseed failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  resetAndSeed()
    .then(() => {
      console.log('✅ Database reset completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database reset failed:', error);
      process.exit(1);
    });
}

export default resetAndSeed;