cd /Users/lech/lechworld
echo "📊 Running LechWorld Data Migration..."
echo ""
echo "This will migrate all data from MongoDB to Supabase"
echo "Make sure you've created the database schema first!"
echo ""
npx tsx scripts/migrate-from-milhaslech.ts
echo ""
echo "✅ Done! Your app is ready at: https://lechworld.fly.dev"