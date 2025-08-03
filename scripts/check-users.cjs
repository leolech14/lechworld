const { Client } = require('pg');
require('dotenv').config();

async function checkUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');

    const result = await client.query(`
      SELECT id, email, name, password IS NOT NULL as has_password, family_id
      FROM users 
      ORDER BY id;
    `);
    
    console.log('\n📊 Users in database:');
    result.rows.forEach(row => {
      console.log(`   ID ${row.id}: ${row.email} (${row.name}) - Password: ${row.has_password ? 'Yes' : 'No'} - Family: ${row.family_id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkUsers().catch(console.error);