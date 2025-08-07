/**
 * Simple Database Connection
 * Direct PostgreSQL connection without complex ORM
 */
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 
  'postgresql://user:password@localhost:5432/lechworld';

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database error:', err);
});

export default pool;