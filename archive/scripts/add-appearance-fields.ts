import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool);

async function addAppearanceFields() {
  console.log('🔧 Adding appearance fields to family_members table...\n');

  try {
    // Add the new columns
    await pool.query(`
      ALTER TABLE family_members 
      ADD COLUMN IF NOT EXISTS frame_color TEXT DEFAULT '#FED7E2',
      ADD COLUMN IF NOT EXISTS frame_border_color TEXT DEFAULT '#F687B3',
      ADD COLUMN IF NOT EXISTS profile_emoji TEXT DEFAULT '👤'
    `);
    
    console.log('✅ Added appearance columns successfully');

    // Migrate existing color data to frame_color
    console.log('\n📦 Migrating existing color data...');
    
    await pool.query(`
      UPDATE family_members
      SET frame_color = color
      WHERE frame_color = '#FED7E2' AND color IS NOT NULL AND color != '#3b82f6'
    `);
    
    // Update frame_border_color based on frame_color
    await pool.query(`
      UPDATE family_members
      SET frame_border_color = CASE
        WHEN frame_color = '#C8DFEF' THEN '#A8CCEC'
        WHEN frame_color = '#C8F5E2' THEN '#A8F5D4'
        WHEN frame_color = '#E8EFF5' THEN '#D8DFE7'
        WHEN frame_color = '#FFE0EC' THEN '#FFB8D1'
        WHEN frame_color = '#E0E7FF' THEN '#C7D2FE'
        WHEN frame_color = '#FFEAA7' THEN '#FDCB6E'
        WHEN frame_color = '#DFE6E9' THEN '#B2BEC3'
        WHEN frame_color = '#D1F2EB' THEN '#81ECEC'
        ELSE '#F687B3'
      END
      WHERE frame_border_color = '#F687B3'
    `);
    
    // Migrate profile_photo emojis to profile_emoji
    await pool.query(`
      UPDATE family_members
      SET profile_emoji = profile_photo
      WHERE profile_photo IS NOT NULL AND LENGTH(profile_photo) <= 4
    `);
    
    console.log('✅ Migrated existing data');
    
    // Show updated data
    const result = await pool.query(`
      SELECT id, name, color, frame_color, frame_border_color, profile_emoji, profile_photo
      FROM family_members 
      ORDER BY id
    `);
    
    console.log('\n📋 Updated member appearance data:');
    result.rows.forEach(row => {
      console.log(`ID ${row.id} - ${row.name}:`);
      console.log(`  Color (old): ${row.color}`);
      console.log(`  Frame Color: ${row.frame_color}`);
      console.log(`  Frame Border: ${row.frame_border_color}`);
      console.log(`  Profile Emoji: ${row.profile_emoji}`);
      console.log(`  Profile Photo: ${row.profile_photo || 'none'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addAppearanceFields();