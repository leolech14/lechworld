import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedUsers() {
  try {
    console.log('🌱 Starting user seed...');
    
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        family_member_id INTEGER,
        is_first_login BOOLEAN DEFAULT true,
        last_login TIMESTAMP,
        password_changed_at TIMESTAMP,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create case-insensitive index
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_ci 
      ON users (LOWER(username))
    `);
    
    // Check if users already exist
    const { rows: existingUsers } = await pool.query(
      'SELECT username FROM users WHERE username IN ($1, $2, $3, $4, $5)',
      ['leonardo', 'graciela', 'osvandre', 'marilise', 'denise']
    );
    
    if (existingUsers.length > 0) {
      console.log('✅ Users already exist, skipping seed');
      return;
    }
    
    // Insert users (no passwords - they'll set them on first login)
    const users = [
      { username: 'leonardo', email: 'leonardo@lech.world', name: 'Leonardo', role: 'member' },
      { username: 'graciela', email: 'graciela@lech.world', name: 'Graciela', role: 'member' },
      { username: 'osvandre', email: 'osvandre@lech.world', name: 'Osvandré', role: 'member' },
      { username: 'marilise', email: 'marilise@lech.world', name: 'Marilise', role: 'member' },
      { username: 'denise', email: 'denise@lech.world', name: 'Denise', role: 'staff' },
    ];
    
    for (const user of users) {
      await pool.query(
        `INSERT INTO users (username, email, name, role, is_first_login) 
         VALUES ($1, $2, $3, $4, true)`,
        [user.username, user.email, user.name, user.role]
      );
      console.log(`✅ Created user: ${user.name} (${user.username})`);
    }
    
    // Link users to family members (except Denise who is staff)
    const familyUsers = ['leonardo', 'graciela', 'osvandre', 'marilise'];
    for (const username of familyUsers) {
      await pool.query(`
        UPDATE users u 
        SET family_member_id = fm.id 
        FROM family_members fm 
        WHERE LOWER(u.username) = LOWER($1) 
        AND LOWER(fm.name) = LOWER(u.name)
      `, [username]);
    }
    
    console.log('✅ User seed completed!');
    console.log('📝 All users can now login with their username (case-insensitive)');
    console.log('📝 They will be prompted to create a password on first login');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the seed
seedUsers().catch(console.error);