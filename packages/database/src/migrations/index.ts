export const migrations = {
  '001_initial_schema': `
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      agent_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX idx_tasks_status ON tasks(status);
    CREATE INDEX idx_tasks_agent ON tasks(agent_id);
  `,
  
  '002_add_agent_metadata': `
    CREATE TABLE agent_metadata (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      agent_id VARCHAR(100) UNIQUE NOT NULL,
      capabilities JSONB,
      health_status VARCHAR(50) DEFAULT 'unknown',
      last_ping TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `
};

export async function runMigrations(db: any) {
  // Migration runner logic
  for (const [name, sql] of Object.entries(migrations)) {
    console.log(`Running migration: ${name}`);
    await db.query(sql);
  }
}