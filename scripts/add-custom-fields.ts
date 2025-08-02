import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lechworld',
});

const db = drizzle(pool);

async function addCustomFields() {
  console.log('🔧 Adding custom_fields JSON column to member_programs table...\n');

  try {
    // Add the custom_fields column
    await pool.query(`
      ALTER TABLE member_programs 
      ADD COLUMN IF NOT EXISTS custom_fields JSON DEFAULT '[]'::json
    `);
    
    console.log('✅ Added custom_fields column successfully');

    // Migrate existing data to custom_fields format
    console.log('\n📦 Migrating existing credentials to custom_fields...');
    
    await pool.query(`
      UPDATE member_programs
      SET custom_fields = json_build_array(
        json_build_object(
          'id', '1',
          'label', 'Account Number',
          'value', COALESCE(member_number, '')
        ),
        json_build_object(
          'id', '2',
          'label', 'Password',
          'value', COALESCE(account_password, '')
        ),
        json_build_object(
          'id', '3',
          'label', 'PIN',
          'value', COALESCE(pin, '')
        ),
        json_build_object(
          'id', '4',
          'label', 'Document Number',
          'value', COALESCE(document_number, '')
        )
      )
      WHERE custom_fields IS NULL OR custom_fields::text = '[]'
    `);
    
    console.log('✅ Migrated existing data to custom_fields format');
    
    // Show sample of migrated data
    const result = await pool.query(`
      SELECT id, custom_fields 
      FROM member_programs 
      LIMIT 3
    `);
    
    console.log('\n📋 Sample migrated data:');
    result.rows.forEach(row => {
      console.log(`ID ${row.id}:`, JSON.stringify(row.custom_fields, null, 2));
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addCustomFields();