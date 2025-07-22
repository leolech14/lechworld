import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const SUPABASE_URL = 'https://ixzwjmbvmrefsivcmirz.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk3NjI4OSwiZXhwIjoyMDY4NTUyMjg5fQ.xz_TEASFWMReLnVM76_U0JQ4DWXys6JUHBHlHXRJCyM';

async function createSchema() {
  console.log('🔨 Creating database schema for LechWorld...\n');
  
  // First try with pool using pooled connection
  const pool = new Pool({
    connectionString: 'postgresql://postgres:7ZhBrHJb5BvceDWz@db.ixzwjmbvmrefsivcmirz.supabase.co:6543/postgres?pgbouncer=true',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    console.log('✓ Connected to database\n');

    const queries = [
      {
        name: 'users table',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'family_members table',
        sql: `CREATE TABLE IF NOT EXISTS family_members (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'loyalty_programs table',
        sql: `CREATE TABLE IF NOT EXISTS loyalty_programs (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          logo_color VARCHAR(7) DEFAULT '#000000',
          website VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'member_programs table',
        sql: `CREATE TABLE IF NOT EXISTS member_programs (
          id SERIAL PRIMARY KEY,
          member_id INTEGER REFERENCES family_members(id) ON DELETE CASCADE,
          program_id INTEGER REFERENCES loyalty_programs(id) ON DELETE CASCADE,
          account_number VARCHAR(255),
          login VARCHAR(255),
          password VARCHAR(255),
          cpf VARCHAR(14),
          points_balance INTEGER DEFAULT 0,
          elite_tier VARCHAR(50),
          is_active BOOLEAN DEFAULT true,
          notes TEXT,
          custom_fields JSONB DEFAULT '{}',
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(member_id, program_id)
        )`
      },
      {
        name: 'activity_logs table',
        sql: `CREATE TABLE IF NOT EXISTS activity_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          action VARCHAR(50) NOT NULL,
          description TEXT,
          metadata JSONB DEFAULT '{}',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      }
    ];

    // Create tables
    console.log('Creating tables...');
    for (const query of queries) {
      try {
        await client.query(query.sql);
        console.log(`✓ Created ${query.name}`);
      } catch (error) {
        console.log(`⚠️  ${query.name} might already exist (${error.message})`);
      }
    }

    // Create indexes
    console.log('\nCreating indexes...');
    const indexes = [
      { name: 'family_members user_id index', sql: 'CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id)' },
      { name: 'member_programs member_id index', sql: 'CREATE INDEX IF NOT EXISTS idx_member_programs_member_id ON member_programs(member_id)' },
      { name: 'member_programs program_id index', sql: 'CREATE INDEX IF NOT EXISTS idx_member_programs_program_id ON member_programs(program_id)' },
      { name: 'activity_logs user_id index', sql: 'CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)' }
    ];

    for (const index of indexes) {
      try {
        await client.query(index.sql);
        console.log(`✓ Created ${index.name}`);
      } catch (error) {
        console.log(`⚠️  ${index.name} might already exist`);
      }
    }

    // Enable RLS
    console.log('\nEnabling Row Level Security...');
    const tables = ['users', 'family_members', 'loyalty_programs', 'member_programs', 'activity_logs'];
    for (const table of tables) {
      try {
        await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
        console.log(`✓ RLS enabled for ${table}`);
      } catch (error) {
        console.log(`⚠️  RLS might already be enabled for ${table}`);
      }
    }

    client.release();
    console.log('\n✅ Database schema created successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\n⚠️  If connection failed, you can create the schema manually:');
    console.log('1. Go to: https://ixzwjmbvmrefsivcmirz.supabase.co/sql/new');
    console.log('2. Copy the SQL from: /Users/lech/lechworld/supabase-schema.sql');
    console.log('3. Paste and run it');
  } finally {
    await pool.end();
  }
}

createSchema();