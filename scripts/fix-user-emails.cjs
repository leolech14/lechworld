const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');

    // Update Leonardo's email and ensure password is hashed
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await client.query(`
      UPDATE users 
      SET email = 'leonardo.lech@gmail.com',
          username = 'leonardo',
          password = $1,
          is_first_login = false
      WHERE name = 'Leonardo'
    `, [hashedPassword]);
    
    console.log('✅ Updated Leonardo\'s account');

    // Verify the update
    const result = await client.query(`
      SELECT id, username, email, name 
      FROM users 
      WHERE name = 'Leonardo'
    `);
    
    console.log('\n📊 Updated user:');
    const user = result.rows[0];
    console.log(`   ID ${user.id}: ${user.email} (${user.name})`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixUsers().catch(console.error);