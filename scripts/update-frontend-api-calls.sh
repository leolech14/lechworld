#!/bin/bash

echo "🔧 Updating frontend API calls to use apiClient..."

# Find all service files
find client/src/services -name "*.ts" -type f | while read file; do
  # Skip if already has apiClient import
  if grep -q "import.*apiClient" "$file"; then
    echo "   ✓ $file already updated"
    continue
  fi
  
  # Skip auth.ts and dashboard.ts as they're already done
  if [[ "$file" == *"auth.ts" ]] || [[ "$file" == *"dashboard.ts" ]]; then
    continue
  fi
  
  # Check if file has fetch calls
  if grep -q "fetch(" "$file"; then
    echo "   Updating: $file"
    
    # Add import at the beginning
    sed -i '' '1s/^/import { apiClient } from '\''@\/lib\/api-client'\'';\n/' "$file"
    
    # Replace fetch calls
    # GET requests
    sed -i '' 's/await fetch(\([^,]*\), {[[:space:]]*method: '\''GET'\'',[[:space:]]*credentials: '\''include'\'',[[:space:]]*})/await apiClient.get(\1)/g' "$file"
    
    # POST requests
    sed -i '' 's/await fetch(\([^,]*\), {[[:space:]]*method: '\''POST'\'',[[:space:]]*headers:[^}]*},[[:space:]]*credentials: '\''include'\'',[[:space:]]*body: JSON.stringify(\([^)]*\))[[:space:]]*})/await apiClient.post(\1, \2)/g' "$file"
    
    # PUT requests  
    sed -i '' 's/await fetch(\([^,]*\), {[[:space:]]*method: '\''PUT'\'',[[:space:]]*headers:[^}]*},[[:space:]]*credentials: '\''include'\'',[[:space:]]*body: JSON.stringify(\([^)]*\))[[:space:]]*})/await apiClient.put(\1, \2)/g' "$file"
    
    # DELETE requests
    sed -i '' 's/await fetch(\([^,]*\), {[[:space:]]*method: '\''DELETE'\'',[[:space:]]*credentials: '\''include'\'',[[:space:]]*})/await apiClient.delete(\1)/g' "$file"
  fi
done

echo "✅ Frontend API calls updated!"