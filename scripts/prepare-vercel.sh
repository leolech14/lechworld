#!/bin/bash
# Prepare for Vercel build by updating imports

echo "Preparing for Vercel build..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Update all @shared/schema imports to use local types
find client/src -name "*.ts" -o -name "*.tsx" | while read file; do
  sed -i.bak 's|from ["'"'"']@shared/schema["'"'"']|from "@/types/schema"|g' "$file"
  rm -f "$file.bak"
done

echo "Imports updated successfully"