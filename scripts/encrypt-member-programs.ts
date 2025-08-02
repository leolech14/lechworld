import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { eq } from 'drizzle-orm';
import { memberPrograms } from '../shared/schemas/database.js';
import { encrypt } from '../server/services/encryption.js';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function migrate() {
  const programs = await db.select().from(memberPrograms);
  for (const p of programs) {
    if (p.pinCiphertext && !p.pinNonce) {
      const enc = await encrypt(p.pinCiphertext);
      await db.update(memberPrograms)
        .set({ pinCiphertext: enc.ciphertext, pinNonce: enc.nonce })
        .where(eq(memberPrograms.id, p.id));
    }
    if (p.accountPasswordCiphertext && !p.accountPasswordNonce) {
      const enc = await encrypt(p.accountPasswordCiphertext);
      await db.update(memberPrograms)
        .set({ accountPasswordCiphertext: enc.ciphertext, accountPasswordNonce: enc.nonce })
        .where(eq(memberPrograms.id, p.id));
    }
  }
  await pool.end();
}

migrate().then(() => {
  console.log('Encryption migration complete');
}).catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
