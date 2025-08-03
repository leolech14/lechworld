import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ixzwjmbvmrefsivcmirz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk3NjI4OSwiZXhwIjoyMDY4NTUyMjg5fQ.xz_TEASFWMReLnVM76_U0JQ4DWXys6JUHBHlHXRJCyM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking Supabase schema...\n');
  
  try {
    // Get all tables
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      // Try a simpler approach - test known tables
      console.log('Checking known tables...');
      
      const knownTables = [
        'users',
        'family_members', 
        'loyalty_programs',
        'member_programs',
        'families'
      ];
      
      for (const table of knownTables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            console.log(`✅ ${table}: exists (${count} records)`);
          } else {
            console.log(`❌ ${table}: ${error.message}`);
          }
        } catch (e) {
          console.log(`❌ ${table}: error checking`);
        }
      }
    } else {
      console.log('Tables in public schema:');
      tables.forEach(t => console.log(`  - ${t.table_name}`));
    }
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();