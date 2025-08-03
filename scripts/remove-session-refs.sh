#!/bin/bash

# Remove session references from auth.ts

echo "🔧 Removing session references from auth.ts..."

# Comment out all req.session references in auth.ts
sed -i '' 's/^[[:space:]]*req\.session/    \/\/ req.session/g' server/api/auth.ts

# Fix the logout endpoint to just clear the cookie
sed -i '' 's/req\.session\.destroy((err) => {/\/\/ Session-less logout - just clear the cookie\n  \/\/ req.session.destroy((err) => {/g' server/api/auth.ts

echo "✅ Session references removed!"