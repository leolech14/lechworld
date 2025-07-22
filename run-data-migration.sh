#!/bin/bash

echo "📊 Running Data Migration..."
echo ""

cd /Users/lech/lechworld

# Check if schema exists
echo "Checking database connection..."
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://ixzwjmbvmrefsivcmirz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk3NjI4OSwiZXhwIjoyMDY4NTUyMjg5fQ.xz_TEASFWMReLnVM76_U0JQ4DWXys6JUHBHlHXRJCyM'
);
supabase.from('users').select('count').single().then(({data, error}) => {
  if (error) {
    console.error('❌ Database schema not found!');
    console.error('Please create the schema first at:');
    console.error('https://ixzwjmbvmrefsivcmirz.supabase.co/sql/new');
    process.exit(1);
  } else {
    console.log('✓ Database connection successful');
  }
});
"

# Run migration
echo ""
echo "Starting migration from MongoDB to Supabase..."
npx tsx scripts/migrate-from-milhaslech.ts

echo ""
echo "✅ Migration complete!"
echo ""
echo "Your app: https://lechworld.fly.dev"
echo "Login: admin@lechworld.com / lechworld2025"