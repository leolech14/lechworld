const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updatePassword() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');

    // Update Leonardo's password to "lech"
    const hashedPassword = await bcrypt.hash('lech', 10);
    
    await client.query(`
      UPDATE users 
      SET password = $1
      WHERE email = 'leonardo.lech@gmail.com'
    `, [hashedPassword]);
    
    console.log('✅ Updated Leonardo\'s password to "lech"');

    // Also check if the auth expects username or email
    const result = await client.query(`
      SELECT id, username, email, name 
      FROM users 
      WHERE email = 'leonardo.lech@gmail.com' OR username = 'leonardo'
    `);
    
    console.log('\n📊 Leonardo\'s account details:');
    const user = result.rows[0];
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Password: lech`);
    console.log('\n📝 Login with:');
    console.log(`   Email: leonardo.lech@gmail.com`);
    console.log(`   Password: lech`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

updatePassword().catch(console.error);