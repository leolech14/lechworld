#!/bin/bash
# Make all tool scripts executable

find ./tools -type f -exec chmod +x {} \;
find ./.claude/scripts -name "*.sh" -exec chmod +x {} \;

echo "✅ All tool scripts are now executable"