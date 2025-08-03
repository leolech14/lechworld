const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateAllUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database');

    // Get all users except Denise
    const result = await client.query(`
      SELECT id, name, username, email 
      FROM users 
      WHERE LOWER(name) != 'denise'
      ORDER BY id
    `);

    console.log(`\n📊 Updating ${result.rows.length} users...`);

    // Hash the password once (it's the same for all users)
    const hashedPassword = await bcrypt.hash('lech', 10);

    for (const user of result.rows) {
      // Update each user:
      // - username = lowercase name
      // - email = lowercase name (if not already set)
      // - password = 'lech'
      const username = user.name.toLowerCase();
      const email = user.email === username ? user.email : username; // Keep real emails if they exist
      
      await client.query(`
        UPDATE users 
        SET 
          username = $1,
          email = CASE 
            WHEN email LIKE '%@%' THEN email 
            ELSE $2 
          END,
          password = $3,
          is_first_login = false
        WHERE id = $4
      `, [username, username, hashedPassword, user.id]);

      console.log(`✅ Updated ${user.name}: username="${username}", password="lech"`);
    }

    // Show final results
    console.log('\n📋 All users (except Denise):');
    const finalResult = await client.query(`
      SELECT id, name, username, email 
      FROM users 
      WHERE LOWER(name) != 'denise'
      ORDER BY id
    `);

    console.log('\n🔐 Login credentials:');
    finalResult.rows.forEach(user => {
      console.log(`   ${user.name}:`);
      console.log(`     Username: ${user.username}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Password: lech`);
      console.log('');
    });

    // Check Denise's status
    const deniseResult = await client.query(`
      SELECT id, name, username, email, password IS NOT NULL as has_password
      FROM users 
      WHERE LOWER(name) = 'denise'
    `);

    if (deniseResult.rows.length > 0) {
      const denise = deniseResult.rows[0];
      console.log('📌 Denise (not updated):');
      console.log(`   Username: ${denise.username || 'N/A'}`);
      console.log(`   Email: ${denise.email}`);
      console.log(`   Has password: ${denise.has_password ? 'Yes' : 'No'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

updateAllUsers().catch(console.error);