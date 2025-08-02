#!/bin/bash

# Development Database Setup Script

echo "🚀 Setting up development database..."

# Use the Supabase database from the migration scripts
echo "Enter the Supabase database password (from your Supabase dashboard):"
read -s DB_PASSWORD

# Export the DATABASE_URL for development
export DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.losjjureznviaoeefzet.supabase.co:5432/postgres"

echo "✅ Database URL configured"
echo ""
echo "Now you can run:"
echo "  npm run db:migrate      # Set up tables"
echo "  npm run db:seed-users   # Create users" 
echo "  npm run db:import-real  # Import real data"
echo "  npm run db:update-values # Update point values"
echo "  npm run dev             # Start the server"
echo ""
echo "To keep the DATABASE_URL for this session, run:"
echo "export DATABASE_URL=\"$DATABASE_URL\""