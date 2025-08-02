import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function testMemberUpdate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld'
  });

  try {
    const client = await pool.connect();
    
    // First, let's check if we have any members
    const membersResult = await client.query('SELECT * FROM family_members LIMIT 1');
    console.log('Sample member:', membersResult.rows[0]);
    
    if (membersResult.rows.length > 0) {
      const member = membersResult.rows[0];
      
      // Try to update with snake_case fields
      const updateResult = await client.query(`
        UPDATE family_members 
        SET 
          frame_color = $1,
          frame_border_color = $2,
          profile_emoji = $3
        WHERE id = $4
        RETURNING *
      `, ['#FF0000', '#00FF00', '🎨', member.id]);
      
      console.log('Updated member:', updateResult.rows[0]);
    }
    
    client.release();
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

testMemberUpdate();