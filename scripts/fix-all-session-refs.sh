#!/bin/bash

echo "🔧 Fixing all session references in API files..."

# Find all TypeScript files in server/api directory
find server/api -name "*.ts" -type f | while read file; do
  echo "   Fixing: $file"
  
  # Replace req.session.familyId
  sed -i '' 's/req\.session\.familyId!/(req as any).session.familyId/g' "$file"
  sed -i '' 's/req\.session\.familyId/(req as any).session.familyId/g' "$file"
  
  # Replace req.session.userId
  sed -i '' 's/req\.session\.userId!/(req as any).session.userId/g' "$file"
  sed -i '' 's/req\.session\.userId/(req as any).session.userId/g' "$file"
done

echo "✅ All session references fixed!"