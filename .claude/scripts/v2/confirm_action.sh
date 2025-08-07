#!/usr/bin/env bash
# Confirmation helper for destructive operations

confirm_destructive_action() {
    local action="$1"
    local target="$2"
    local agent="${3:-unknown}"
    
    echo "⚠️  DESTRUCTIVE ACTION REQUESTED"
    echo "================================"
    echo "Agent: $agent"
    echo "Action: $action"
    echo "Target: $target"
    echo ""
    
    # Log the request
    python3 "$(dirname "$0")/audit_logger.py" <<< "{
        \"event\": \"destructive_action_request\",
        \"agent\": \"$agent\",
        \"action\": \"$action\",
        \"target\": \"$target\"
    }"
    
    # In automated mode, check policy
    if [ "$DREAM_TEAM_AUTO_MODE" = "true" ]; then
        # Check if action is in allowlist
        if grep -q "^$action$" "$(dirname "$0")/../../config/allowed_destructive_actions.txt" 2>/dev/null; then
            echo "✓ Action allowed by policy"
            return 0
        else
            echo "✗ Action blocked by policy"
            return 1
        fi
    fi
    
    # Interactive confirmation
    read -p "Are you sure you want to proceed? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "✓ Action confirmed"
        return 0
    else
        echo "✗ Action cancelled"
        return 1
    fi
}

# Export for use in other scripts
export -f confirm_destructive_action