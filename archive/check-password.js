// Check user password status
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dotenv from 'dotenv';
import { users } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool);

async function checkPassword() {
  try {
    const [user] = await db.select().from(users).where(eq(users.email, 'lech@lechworld.com')).limit(1);
    
    if (user) {
      console.log(`User: ${user.email}`);
      console.log(`Has password: ${user.password ? 'YES' : 'NO'}`);
      console.log(`Is first login: ${user.isFirstLogin ? 'YES' : 'NO'}`);
    } else {
      console.log('User not found');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPassword();