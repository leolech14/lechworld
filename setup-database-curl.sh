#!/bin/bash

echo "🚀 Setting up LechWorld database schema..."
echo ""
echo "Since direct database access is limited, please follow these steps:"
echo ""
echo "1. Open Supabase SQL Editor:"
echo "   https://ixzwjmbvmrefsivcmirz.supabase.co/sql/new"
echo ""
echo "2. Copy all content from create_schema.sql"
echo ""
echo "3. Paste into the SQL editor and click 'Run'"
echo ""
echo "4. After schema is created, run the migration:"
echo "   ./migrate.sh"
echo ""
echo "Press Enter to open the SQL file for copying..."
read

cat create_schema.sql