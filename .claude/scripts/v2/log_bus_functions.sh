#!/usr/bin/env bash
# Log bus functions for agent system - v3 with sharding
# Source this file to use jlog function

# Configuration
LOG_BUS_DIR="${CLAUDE_LOG_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/dream-team/logs}"
mkdir -p "$LOG_BUS_DIR"

# Generate UUID for task tracking
generate_uuid() {
    if command -v uuidgen >/dev/null 2>&1; then
        uuidgen | tr '[:upper:]' '[:lower:]'
    else
        # Fallback: use random hex
        od -x /dev/urandom | head -1 | awk '{OFS="-"; print $2$3,$4,$5,$6,$7$8$9}'
    fi
}

# Calculate shard ID based on agent family and topic
calculate_shard_id() {
    local agent_family="$1"
    local topic="$2"
    local combined="${agent_family}:${topic}"
    
    # Use MD5 hash for shard ID (first 8 chars)
    if command -v md5sum >/dev/null 2>&1; then
        echo -n "$combined" | md5sum | cut -c1-8
    elif command -v md5 >/dev/null 2>&1; then
        echo -n "$combined" | md5 | cut -c1-8
    else
        # Fallback: use simple hash based on string length
        echo "${combined}" | cksum | cut -d' ' -f1
    fi
}

# Get shard file path
_logfile() {
    local agent_family="${AGENT_FAMILY:-general}"
    local topic="${1:-general}"
    local shard_id=$(calculate_shard_id "$agent_family" "$topic")
    
    # Create family directory if needed
    mkdir -p "$LOG_BUS_DIR/$agent_family"
    
    echo "$LOG_BUS_DIR/$agent_family/shard_${shard_id}.jsonl"
}

# JSON log function with sharding and schema versioning
jlog() {
    local topic="${1:-general}"
    local level="${2:-info}"
    local msg="$3"
    local task_id="${TASK_ID:-$(generate_uuid)}"
    local timestamp
    
    # Get timestamp in ISO format
    if date --version >/dev/null 2>&1; then
        # GNU date
        timestamp=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
    else
        # BSD date (macOS)
        timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    fi
    
    # Calculate shard ID
    local shard_id=$(calculate_shard_id "${AGENT_FAMILY:-general}" "$topic")
    
    # Build JSON log entry with schema version
    local line
    line=$(printf '{"schema":"1","ts":"%s","agent":"%s","family":"%s","level":"%s","topic":"%s","msg":"%s","task_id":"%s","shard_id":"%s"}\n' \
        "$timestamp" \
        "${AGENT_NAME:-unknown}" \
        "${AGENT_FAMILY:-general}" \
        "$level" \
        "$topic" \
        "$msg" \
        "$task_id" \
        "$shard_id")
    
    # Get log file for this shard
    local logfile=$(_logfile "$topic")
    
    # Check size and rotate if needed (50MB limit)
    if [[ -f "$logfile" ]]; then
        local size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null || echo 0)
        if [[ $size -gt 52428800 ]]; then  # 50MB in bytes
            local timestamp_suffix=$(date +"%Y%m%d_%H%M%S")
            local rotated_file="${logfile%.jsonl}_${timestamp_suffix}.jsonl"
            mv "$logfile" "$rotated_file"
            
            # Compress in background
            (gzip "$rotated_file" 2>/dev/null || true) &
        fi
    fi
    
    # Append with file locking (timeout after 2 seconds)
    if command -v flock >/dev/null 2>&1; then
        # Linux with flock
        {
            if flock -w 2 200; then
                printf '%s' "$line"
            else
                # Emergency fallback
                printf '%s' "$line" >> "$LOG_BUS_DIR/emergency.jsonl"
                return 1
            fi
        } 200>> "$logfile"
    else
        # macOS or no flock - use basic append
        printf '%s' "$line" >> "$logfile"
    fi
    
    # Export task ID for subsequent calls
    export TASK_ID="$task_id"
}

# Convenience functions
jlog_info() {
    jlog "$1" "info" "$2"
}

jlog_warn() {
    jlog "$1" "warn" "$2"
}

jlog_error() {
    jlog "$1" "error" "$2"
}

jlog_debug() {
    jlog "$1" "debug" "$2"
}

# Export functions for use by agents
export -f jlog jlog_info jlog_warn jlog_error jlog_debug _logfile generate_uuid calculate_shard_id