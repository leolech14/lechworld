export { PrismaClient } from '@prisma/client';

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  connectionTimeout: number;
}

export class DatabaseManager {
  constructor(private config: DatabaseConfig) {}
  
  async connect() {
    // Connection logic
  }
  
  async disconnect() {
    // Disconnection logic  
  }
}

export * from './queries';
export * from './migrations';