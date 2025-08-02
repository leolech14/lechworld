import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addFamilies() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS family_id INTEGER REFERENCES families(id);
    `);

    await client.query(`
      ALTER TABLE family_members
      ADD COLUMN IF NOT EXISTS family_id INTEGER REFERENCES families(id);
    `);

    const { rows } = await client.query('SELECT id FROM families LIMIT 1');
    let familyId = rows[0]?.id;
    if (!familyId) {
      const res = await client.query(`INSERT INTO families (name) VALUES ('Default Family') RETURNING id`);
      familyId = res.rows[0].id;
    }

    await client.query('UPDATE users SET family_id = COALESCE(family_id, $1)', [familyId]);
    await client.query('UPDATE family_members SET family_id = COALESCE(family_id, $1)', [familyId]);

    await client.query('COMMIT');
    console.log('Families migration completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error migrating families:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addFamilies().catch(console.error);
