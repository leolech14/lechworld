#!/bin/bash

# Monorepo Boilerplate Initialization Script
# Usage: ./init-template.sh "project-name" "organization-name"

set -e

PROJECT_NAME="${1:-my-project}"
ORG_NAME="${2:-my-org}"
AUTHOR="${3:-$(git config user.name 2>/dev/null || echo 'Your Name')}"

echo "🚀 Initializing monorepo boilerplate..."
echo "   Project: $PROJECT_NAME"
echo "   Organization: $ORG_NAME"
echo "   Author: $AUTHOR"
echo ""

# Update package.json files
echo "📦 Updating package configurations..."
find . -name "package.json" -type f -exec sed -i '' \
  -e "s/@your-org/@$ORG_NAME/g" \
  -e "s/monorepo/$PROJECT_NAME/g" {} \;

# Update CODEOWNERS
echo "👥 Setting code owners..."
sed -i '' "s/@YOUR_TEAM/@$ORG_NAME/g" CODEOWNERS

# Update README with project name
echo "📚 Updating README..."
sed -i '' \
  -e "s/AI-Ready Monorepo Boilerplate/$PROJECT_NAME/g" \
  -e "s/monorepo-boilerplate/$PROJECT_NAME/g" \
  -e "s/>.*Based on O3-Pro.*/>Production-ready monorepo for $ORG_NAME/g" README.md

# Initialize git repository
if [ ! -d .git ]; then
  echo "📝 Initializing git repository..."
  git init
  git add .
  git commit -m "🎉 Initial commit from monorepo-boilerplate"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Make tools executable
echo "🔧 Setting up tools..."
chmod +x tools/*
chmod +x .claude/scripts/v2/*.sh 2>/dev/null || true

# Create .env from example
if [ ! -f .env ]; then
  echo "🔐 Creating .env file..."
  cp .env.example .env
  echo "   ⚠️  Please update .env with your configuration"
fi

# Optional: Remove template files
echo ""
read -p "🗑️  Remove template files (init-template.sh, template.json)? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -f init-template.sh template.json
  echo "   Template files removed"
fi

# Setup complete
echo ""
echo "✅ Monorepo boilerplate initialized successfully!"
echo ""
echo "📚 Next steps:"
echo "   1. Update .env with your configuration"
echo "   2. Review .claude/agents/ for AI agent configurations"
echo "   3. Run 'npm run dev' to start development"
echo "   4. Check README.md for detailed documentation"
echo ""
echo "🛠️  Available commands:"
echo "   npm run dev       - Start development servers"
echo "   npm run build     - Build all packages"
echo "   npm run test      - Run tests"
echo "   npm run lint      - Lint code"
echo "   ./tools/agent-orchestrate - Run AI agent system"
echo ""