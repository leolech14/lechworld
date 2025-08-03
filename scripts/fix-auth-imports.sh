#!/bin/bash

# Fix all auth imports to use auth-vercel.js instead of auth.js

echo "🔧 Fixing auth imports..."

# Find all files importing from auth.js and replace with auth-vercel.js
find server -name "*.ts" -type f -exec grep -l "from '../middleware/auth.js'" {} \; | while read file; do
  echo "   Updating: $file"
  sed -i '' "s|from '../middleware/auth.js'|from '../middleware/auth-vercel.js'|g" "$file"
done

echo "✅ Auth imports fixed!"

# Verify the changes
echo ""
echo "📋 Files now using auth-vercel.js:"
grep -r "from '../middleware/auth-vercel.js'" server --include="*.ts" | cut -d: -f1 | sort | uniq