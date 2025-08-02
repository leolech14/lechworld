#!/bin/bash

# Run database migration non-interactively
echo "Running database migrations..."

# Use yes to automatically confirm prompts
yes | npx drizzle-kit push:pg

echo "Migrations complete!"