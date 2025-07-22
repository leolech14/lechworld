#!/bin/bash

# LechWorld Database Schema Execution Script
# This script creates the database schema using psql

echo "🚀 Creating LechWorld database schema..."

# Database connection string
DATABASE_URL="postgresql://postgres.ixzwjmbvmrefsivcmirz:LECHworld2025!!@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Execute the schema
psql "$DATABASE_URL" < create_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
else
    echo "❌ Failed to create database schema"
    echo ""
    echo "Alternative method:"
    echo "1. Go to: https://ixzwjmbvmrefsivcmirz.supabase.co/sql/new"
    echo "2. Copy the contents of create_schema.sql"
    echo "3. Paste and click 'Run'"
    exit 1
fi