const fs = require('fs');
const path = require('path');

// Services to update
const servicesToUpdate = [
  'members.ts',
  'programs.ts',
  'notifications.ts',
  'transactions.ts'
];

const servicesDir = path.join(__dirname, '..', 'client', 'src', 'services');

servicesToUpdate.forEach(fileName => {
  const filePath = path.join(servicesDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${fileName} not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has apiClient import
  if (content.includes('apiClient')) {
    console.log(`✓ ${fileName} already updated`);
    return;
  }
  
  console.log(`📝 Updating ${fileName}...`);
  
  // Add import at the beginning
  content = `import { apiClient } from '@/lib/api-client';\n\n` + content;
  
  // Replace fetch patterns
  // GET requests
  content = content.replace(
    /await fetch\(([^,]+),\s*{\s*method:\s*['"]GET['"]\s*,\s*credentials:\s*['"]include['"]\s*,?\s*}\)/g,
    'await apiClient.get($1)'
  );
  
  // POST requests with body
  content = content.replace(
    /await fetch\(([^,]+),\s*{\s*method:\s*['"]POST['"]\s*,\s*headers:\s*{[^}]*}\s*,\s*credentials:\s*['"]include['"]\s*,\s*body:\s*JSON\.stringify\(([^)]+)\)\s*}\)/g,
    'await apiClient.post($1, $2)'
  );
  
  // PUT requests with body
  content = content.replace(
    /await fetch\(([^,]+),\s*{\s*method:\s*['"]PUT['"]\s*,\s*headers:\s*{[^}]*}\s*,\s*credentials:\s*['"]include['"]\s*,\s*body:\s*JSON\.stringify\(([^)]+)\)\s*}\)/g,
    'await apiClient.put($1, $2)'
  );
  
  // DELETE requests
  content = content.replace(
    /await fetch\(([^,]+),\s*{\s*method:\s*['"]DELETE['"]\s*,\s*credentials:\s*['"]include['"]\s*,?\s*}\)/g,
    'await apiClient.delete($1)'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${fileName} updated`);
});

console.log('\n✅ All services updated!');