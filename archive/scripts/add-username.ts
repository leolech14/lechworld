import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function addUsernameAndCreateUser() {
  console.log('🔧 Adding username column and creating lech user...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld'
  });

  const db = drizzle(pool);
  const client = await pool.connect();

  try {
    // Add username column if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
    `);
    console.log('✅ Username column added');

    // Delete existing test user if exists
    await client.query(`DELETE FROM users WHERE email = 'lech@lechworld.com' OR username = 'lech';`);

    // Hash password
    const hashedPassword = await bcrypt.hash('world', 10);

    // Insert lech user with username
    await client.query(`
      INSERT INTO users (username, email, password, name)
      VALUES ($1, $2, $3, $4)
    `, ['lech', 'lech@example.com', hashedPassword, 'Lech']);

    console.log('✅ User created successfully!');
    console.log('👤 Username: lech');
    console.log('🔑 Password: world');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addUsernameAndCreateUser();