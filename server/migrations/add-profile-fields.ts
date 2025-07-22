import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addProfileFields() {
  try {
    console.log('Adding new profile fields to family_members table...');
    
    // Add new columns to family_members table
    await pool.query(`
      ALTER TABLE family_members 
      ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS birthdate VARCHAR(10),
      ADD COLUMN IF NOT EXISTS frame_color VARCHAR(7) DEFAULT '#FED7E2',
      ADD COLUMN IF NOT EXISTS frame_border_color VARCHAR(7) DEFAULT '#F687B3',
      ADD COLUMN IF NOT EXISTS profile_emoji VARCHAR(10) DEFAULT '👤'
    `);
    
    console.log('Profile fields added successfully!');
  } catch (error) {
    console.error('Error adding profile fields:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
addProfileFields().catch(console.error);