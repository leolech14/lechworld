/**
 * @fileoverview Migration management for Family Loyalty Program database
 * @description Handles database schema migrations using Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../schema';

export interface MigrationResult {
  success: boolean;
  migrationsRun: number;
  error?: string;
}

/**
 * Runs all pending migrations
 * @param databaseUrl - PostgreSQL connection string
 * @returns Migration result
 */
export async function runMigrations(databaseUrl?: string): Promise<MigrationResult> {
  const url = databaseUrl || process.env.DATABASE_URL || 'postgresql://localhost:5432/family_loyalty_db';
  
  console.log('🔄 Starting database migrations...');
  
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    // Run migrations from the generated SQL files
    const migrationResult = await migrate(db, { migrationsFolder: './src/migrations' });
    
    console.log('✅ Migrations completed successfully');
    
    return {
      success: true,
      migrationsRun: 0, // Drizzle doesn't return count, but this would be filled by actual implementation
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      migrationsRun: 0,
      error: error instanceof Error ? error.message : 'Unknown migration error',
    };
  } finally {
    await client.end();
  }
}

/**
 * Checks if database is ready and up-to-date
 * @param databaseUrl - PostgreSQL connection string
 * @returns True if database is ready
 */
export async function checkDatabaseHealth(databaseUrl?: string): Promise<boolean> {
  const url = databaseUrl || process.env.DATABASE_URL || 'postgresql://localhost:5432/family_loyalty_db';
  
  const client = postgres(url, { max: 1 });
  
  try {
    // Test basic connectivity
    await client`SELECT 1`;
    
    // Check if main tables exist
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('families', 'users', 'family_members', 'loyalty_programs', 'member_programs')
    `;
    
    const expectedTables = ['families', 'users', 'family_members', 'loyalty_programs', 'member_programs'];
    const existingTables = tables.map(t => t.table_name);
    
    const allTablesExist = expectedTables.every(table => existingTables.includes(table));
    
    if (allTablesExist) {
      console.log('✅ Database health check passed');
    } else {
      console.log('⚠️ Database health check failed - missing tables');
    }
    
    return allTablesExist;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  } finally {
    await client.end();
  }
}

/**
 * Creates a new migration file template
 * @param name - Migration name
 * @returns Migration file content
 */
export function createMigrationTemplate(name: string): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 14);
  const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}`;
  
  return `-- Migration: ${name}
-- Created: ${new Date().toISOString()}
-- File: ${filename}.sql

-- Add your migration SQL here
-- Example:
-- ALTER TABLE users ADD COLUMN new_field TEXT;

-- Don't forget to add corresponding rollback instructions:
-- ALTER TABLE users DROP COLUMN new_field;
`;
}

/**
 * Development utility to reset database (WARNING: DESTRUCTIVE)
 * Only use in development environment
 */
export async function resetDatabase(databaseUrl?: string): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset database in production environment');
  }
  
  const url = databaseUrl || process.env.DATABASE_URL || 'postgresql://localhost:5432/family_loyalty_db';
  const client = postgres(url, { max: 1 });
  
  console.log('⚠️ RESETTING DATABASE (Development Only)...');
  
  try {
    // Drop all tables in reverse dependency order
    await client`DROP TABLE IF EXISTS mile_transactions CASCADE`;
    await client`DROP TABLE IF EXISTS activity_log CASCADE`;
    await client`DROP TABLE IF EXISTS notification_preferences CASCADE`;
    await client`DROP TABLE IF EXISTS member_programs CASCADE`;
    await client`DROP TABLE IF EXISTS loyalty_programs CASCADE`;
    await client`DROP TABLE IF EXISTS family_members CASCADE`;
    await client`DROP TABLE IF EXISTS users CASCADE`;
    await client`DROP TABLE IF EXISTS families CASCADE`;
    
    // Drop any remaining sequences
    await client`DROP SEQUENCE IF EXISTS families_id_seq CASCADE`;
    await client`DROP SEQUENCE IF EXISTS users_id_seq CASCADE`;
    await client`DROP SEQUENCE IF EXISTS family_members_id_seq CASCADE`;
    await client`DROP SEQUENCE IF EXISTS loyalty_programs_id_seq CASCADE`;
    await client`DROP SEQUENCE IF EXISTS member_programs_id_seq CASCADE`;
    await client`DROP SEQUENCE IF EXISTS mile_transactions_id_seq CASCADE`;
    await client`DROP SEQUENCE IF EXISTS activity_log_id_seq CASCADE`;
    await client`DROP SEQUENCE IF EXISTS notification_preferences_id_seq CASCADE`;
    
    console.log('✅ Database reset completed');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}