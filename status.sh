#!/bin/bash

echo "📊 LECHWORLD STATUS CHECK"
echo "========================"
echo ""

# Check if app is running
echo -n "1. Fly.io App: "
if fly status --app lechworld &> /dev/null; then
    echo "✅ Deployed to https://lechworld.fly.dev"
else
    echo "❌ Not deployed"
fi

# Check if .env exists
echo -n "2. Environment: "
if [ -f "/Users/lech/lechworld/.env" ]; then
    echo "✅ Configured"
else
    echo "❌ Not configured"
fi

# Check node modules
echo -n "3. Dependencies: "
if [ -d "/Users/lech/lechworld/node_modules" ]; then
    echo "✅ Installed"
else
    echo "❌ Not installed"
fi

echo ""
echo "📋 REMAINING STEPS:"
echo ""
echo "1️⃣  Create database tables:"
echo "   → Go to: https://ixzwjmbvmrefsivcmirz.supabase.co/sql/new"
echo "   → Copy SQL from artifact above"
echo "   → Click Run"
echo ""
echo "2️⃣  Migrate data:"
echo "   → cd /Users/lech/lechworld"
echo "   → npx tsx scripts/migrate-from-milhaslech.ts"
echo ""
echo "That's it! Your app will be live at https://lechworld.fly.dev"