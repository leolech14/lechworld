import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    console.log('Starting migration...');
    
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
    
    console.log('Migration completed successfully!');
    
    // Verify columns were added
    const { rows } = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'family_members'
      AND column_name IN ('cpf', 'phone', 'birthdate', 'frame_color', 'frame_border_color', 'profile_emoji')
      ORDER BY ordinal_position
    `);
    
    console.log('New columns added:');
    rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (default: ${row.column_default || 'none'})`);
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();