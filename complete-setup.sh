#!/bin/bash

echo "🚀 LECHWORLD - Complete Setup"
echo "============================"
echo ""

# Step 1: Show schema
echo "📋 Step 1: Create Database Schema"
echo "---------------------------------"
echo ""
echo "Since we can't connect from terminal due to IPv6 issues, please:"
echo ""
echo "1. Open your browser and go to:"
echo "   https://ixzwjmbvmrefsivcmirz.supabase.co/sql/new"
echo ""
echo "2. Copy ALL of this SQL and paste it there:"
echo ""
echo "========== COPY FROM HERE =========="
cat /Users/lech/lechworld/supabase-schema.sql
echo "========== COPY TO HERE =========="
echo ""
echo "3. Click the 'Run' button"
echo "4. Wait for 'Success' message"
echo ""
read -p "Press Enter when schema is created..."

# Step 2: Run migration
echo ""
echo "📊 Step 2: Migrating Data from MongoDB..."
echo "---------------------------------------"
cd /Users/lech/lechworld
npx tsx scripts/migrate-from-milhaslech.ts

# Step 3: Show results
echo ""
echo "✅ COMPLETE!"
echo ""
echo "🌐 Your app is now live at: https://lechworld.fly.dev"
echo ""
echo "📱 Login credentials:"
echo "   Email: admin@lechworld.com"
echo "   Password: lechworld2025"
echo ""
echo "⚠️  IMPORTANT: Change this password after first login!"
echo ""
echo "🗑️  You can now delete milhaslech:"
echo "   fly apps destroy milhaslech --yes"
echo ""
echo "📊 Supabase Dashboard: https://ixzwjmbvmrefsivcmirz.supabase.co"