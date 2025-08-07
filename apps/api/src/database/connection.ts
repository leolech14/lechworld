/**
 * Database Connection Singleton
 * Prevents memory leaks by maintaining single connection pool
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
// import * as schema from '@monorepo/database'; // Commented out - package doesn't exist

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private client: postgres.Sql;
  private db: ReturnType<typeof drizzle>;
  private isInitialized = false;

  private constructor() {
    const connectionString = process.env.DATABASE_URL || 'postgresql://orchestrator:orchestrator123@localhost:5432/orchestrator';
    
    this.client = postgres(connectionString, {
      max: 20, // Max connections in pool
      idle_timeout: 30, // Close idle connections after 30s
      max_lifetime: 60 * 30, // Close connections after 30 minutes
      transform: postgres.camel, // Convert snake_case to camelCase
      onnotice: () => {}, // Disable notices
    });
    
    // TODO: Re-enable schema once @monorepo/database is available
    // this.db = drizzle(this.client, { schema });
    this.db = drizzle(this.client); // Initialize without schema for now
    this.isInitialized = true;
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getClient(): postgres.Sql {
    return this.client;
  }

  public getDatabase() {
    return this.db;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.client`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.isInitialized) {
      await this.client.end();
      this.isInitialized = false;
      console.log('✅ Database connection closed');
    }
  }
}

// Export singleton instances
export const dbConnection = DatabaseConnection.getInstance();
export const db = dbConnection.getDatabase();
export const client = dbConnection.getClient();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection');
  await dbConnection.close();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connection');
  await dbConnection.close();
});