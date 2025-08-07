#!/bin/bash

# SIMPLE DEPLOYMENT - Use the working legacy app directly!

echo "🚀 Deploying the WORKING legacy app to Railway..."

# Copy the working legacy server to root
cp -r legacy/server/* .
cp legacy/package.json .
cp legacy/package-lock.json .

# Create simple start script
cat > start.sh << 'EOF'
#!/bin/bash
cd /app
npm install
node index.js
EOF

chmod +x start.sh

# Create Railway config for simple Node.js app
cat > railway.json << 'EOF'
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server/index.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
EOF

echo "✅ Ready to deploy!"
echo "Run: railway up"