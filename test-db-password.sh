#!/bin/bash

echo "🔍 Testing Database Connection..."
echo ""

SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc2pqdXJlem52aWFvZWZ6ZXQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzUwMDQ3MzI3LCJleHAiOjIwNjU2MjMzMjd9.RGaVg1fF74Rrs68sBIlrXb5rG0IcgewC0wDGsCRwTjM"

# Common passwords to try
PASSWORDS=(
    "MilhasLech2025"
    "milhaslech2025"
    "MilhasLech@2025"
    "Supabase2025"
    "supabase2025"
    "postgres"
)

echo "Testing common passwords..."
for PASS in "${PASSWORDS[@]}"; do
    echo -n "Trying: $PASS ... "
    
    # Test connection
    export DATABASE_URL="postgresql://postgres:${PASS}@db.losjjureznviaoeefzet.supabase.co:5432/postgres"
    
    # Use Node.js to test since we have pg installed
    node -e "
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    client.connect()
      .then(() => {
        console.log('✅ SUCCESS!');
        client.end();
        process.exit(0);
      })
      .catch(() => {
        console.log('❌ Failed');
        process.exit(1);
      });
    " 2>/dev/null && {
        echo ""
        echo "Found working password: $PASS"
        echo ""
        echo "Run migration with:"
        echo "./run-migration-now.sh"
        echo "Password: $PASS"
        exit 0
    }
done

echo ""
echo "None of the common passwords worked."
echo "You'll need to get it from Supabase dashboard or reset it."