/**
 * @fileoverview Main database export file
 * @description Exports all schema definitions, types, and database utilities
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as bcrypt from 'bcryptjs';

// Export all schema definitions and types
export * from './schema';

// Export database utilities
export * from './utils/encryption';
export * from './utils/seed-data';

// Database configuration interface
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
  ssl?: boolean;
}

// Database manager class
export class DatabaseManager {
  private client: postgres.Sql;
  private db: ReturnType<typeof drizzle>;

  constructor(private config: DatabaseConfig) {
    this.client = postgres(config.url, {
      max: config.maxConnections || 20,
      idle_timeout: config.connectionTimeout || 30,
      ssl: config.ssl ? 'require' : false,
    });
    this.db = drizzle(this.client);
  }

  async connect() {
    try {
      // Test the connection
      await this.client`SELECT 1`;
      console.log('✅ Database connected successfully');
      return this.db;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  getDatabase() {
    return this.db;
  }

  getClient() {
    return this.client;
  }
}

// Utility function to create database connection
export function createDatabase(config: DatabaseConfig) {
  const manager = new DatabaseManager(config);
  return manager;
}

// Default database instance (can be overridden)
export function getDefaultDatabase() {
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/family_loyalty_db';
  
  return createDatabase({
    url: databaseUrl,
    maxConnections: 20,
    connectionTimeout: 30,
    ssl: process.env.NODE_ENV === 'production',
  });
}

// Password hashing utilities
export const passwordUtils = {
  async hash(password: string): Promise<string> {
    const saltRounds = 12; // High security for password storage
    return bcrypt.hash(password, saltRounds);
  },

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },
};

// Export the drizzle and postgres types for external use
export type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
export type DatabaseInstance = ReturnType<typeof drizzle>;