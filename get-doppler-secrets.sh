#!/bin/bash

echo "🔐 Fetching Supabase Credentials from Doppler"
echo ""

# Check if Homebrew is installed
if command -v brew &> /dev/null; then
    echo "Installing Doppler via Homebrew..."
    brew install dopplerhq/cli/doppler
else
    echo "Installing Doppler via curl..."
    curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh
    export PATH=$PATH:/usr/local/bin
fi

# Check if logged in
if ! doppler me &> /dev/null; then
    echo "Please login to Doppler:"
    doppler login
fi

echo ""
echo "Fetching secrets from milhaslech project..."
echo ""

# Try to get all Supabase-related secrets
doppler secrets download --no-file --format env --project milhaslech --config prd | grep -E "SUPABASE|DATABASE|POSTGRES" || {
    echo "Could not fetch from milhaslech/prd"
    echo ""
    echo "Available projects:"
    doppler projects
    echo ""
    echo "Try manually with:"
    echo "doppler secrets download --no-file --format env --project PROJECT_NAME --config CONFIG_NAME | grep SUPABASE"
}