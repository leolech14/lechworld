const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ixzwjmbvmrefsivcmirz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MDI2NzcsImV4cCI6MjA1Mjk3ODY3N30.n1chQMpCvf8zKTLLKs3cl2M7sF0IjYTvP5ClKOGNjB0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up LechWorld database...');
    
    // Read the SQL schema
    const schema = fs.readFileSync('./create_schema.sql', 'utf8');
    
    // Split into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        query: statement
      });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        // Continue with other statements
      }
    }
    
    console.log('✅ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\nAlternative method:');
    console.log('1. Go to: https://ixzwjmbvmrefsivcmirz.supabase.co/sql/new');
    console.log('2. Copy the contents of create_schema.sql');
    console.log('3. Paste and click "Run"');
  }
}

setupDatabase();