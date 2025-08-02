import { Client } from 'pg';

async function createSchema() {
  const client = new Client({
    host: 'db.ixzwjmbvmrefsivcmirz.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: '7ZhBrHJb5BvceDWz',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected');

    console.log('Creating tables...');
    
    // Create tables one by one to better handle errors
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS family_members (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS loyalty_programs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        logo_color VARCHAR(7) DEFAULT '#000000',
        website VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS member_programs (
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await client.query(table);
    }
    
    console.log('✓ Tables created');

    console.log('Creating indexes...');
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_family_members_user_id ON family_members(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_member_programs_member_id ON member_programs(member_id)',
      'CREATE INDEX IF NOT EXISTS idx_member_programs_program_id ON member_programs(program_id)',
      'CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)'
    ];

    for (const index of indexes) {
      await client.query(index);
    }
    
    console.log('✓ Indexes created');

    console.log('Enabling RLS...');
    
    // Enable RLS
    const rlsCommands = [
      'ALTER TABLE users ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE family_members ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE member_programs ENABLE ROW LEVEL SECURITY',
      'ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY'
    ];

    for (const rls of rlsCommands) {
      await client.query(rls);
    }
    
    console.log('✓ RLS enabled');

    console.log('\n✅ Database schema created successfully!');
    
  } catch (error) {
    console.error('Error creating schema:', error.message);
    if (error.detail) console.error('Details:', error.detail);
  } finally {
    await client.end();
  }
}

createSchema();