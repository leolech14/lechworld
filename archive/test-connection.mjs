import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:7ZhBrHJb5BvceDWz@db.losjjureznviaoeefzet.supabase.co:5432/postgres";

async function testConnection() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('Testing connection to Supabase...');
    await client.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connection successful!');
    console.log('Server time:', result.rows[0].now);
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    return false;
  }
}

testConnection();