import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { users } from '../shared/schemas/database.js';

dotenv.config();

const { Pool } = pg;

async function createTestUser() {
  console.log('🔐 Creating test user...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld'
  });

  const db = drizzle(pool);

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('world', 10);

    // Insert test user
    const [testUser] = await db.insert(users).values({
      email: 'lech@lechworld.com',
      password: hashedPassword,
      name: 'Lech'
    }).returning();

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: lech@lechworld.com');
    console.log('🔑 Password: world');
    console.log('👤 Name:', testUser.name);
    console.log('🆔 ID:', testUser.id);

  } catch (error: any) {
    if (error.code === '23505') {
      console.log('⚠️  User already exists');
    } else {
      console.error('❌ Failed to create user:', error);
    }
  } finally {
    await pool.end();
  }
}

createTestUser();