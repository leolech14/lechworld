import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://localhost:5432/lechworld',
});

async function checkUsers() {
  try {
    const result = await pool.query('SELECT id, username, email, is_first_login, password IS NOT NULL as has_password FROM users ORDER BY id');
    console.log('Users in database:');
    console.table(result.rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();