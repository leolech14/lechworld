// Check available users in the database
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dotenv from 'dotenv';
import { users } from './shared/schema.ts';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool);

async function checkUsers() {
  try {
    const allUsers = await db.select().from(users);
    console.log('Available users:');
    allUsers.forEach(user => {
      console.log(`- Email: ${user.email}, Username: ${user.username || 'N/A'}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();