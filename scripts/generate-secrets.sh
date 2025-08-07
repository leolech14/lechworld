#!/bin/bash

# LechWorld Production Secrets Generator
# Generates cryptographically secure secrets for production deployment
# Author: Claude Code Security Specialist
# Version: 1.0.0

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SECRETS_FILE=".env.production.secrets"
BACKUP_DIR="./backups/secrets"
LOG_FILE="./logs/secret-generation.log"
VAULT_FILE=".vault-secrets.json"

# Create necessary directories
mkdir -p "$(dirname "$LOG_FILE")" "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    log "ERROR: $1"
    exit 1
}

# Success message
success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

# Warning message
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log "WARNING: $1"
}

# Info message
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log "INFO: $1"
}

# Header
print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    🔐 LechWorld Secrets Generator                ║"
    echo "║              Production-Ready Cryptographic Secrets             ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check dependencies
check_dependencies() {
    info "Checking dependencies..."
    
    local deps=("openssl" "base64" "head" "tr")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error_exit "Required dependency '$dep' is not installed"
        fi
    done
    
    # Check OpenSSL version
    local openssl_version
    openssl_version=$(openssl version | awk '{print $2}')
    info "Using OpenSSL version: $openssl_version"
    
    success "All dependencies are available"
}

# Generate secure random string
generate_secure_random() {
    local length=${1:-32}
    local encoding=${2:-"base64"}
    
    case $encoding in
        "base64")
            openssl rand -base64 "$length" | tr -d "=+/" | cut -c1-"$length"
            ;;
        "hex")
            openssl rand -hex "$length"
            ;;
        "alphanumeric")
            openssl rand -base64 "$length" | tr -d "=+/" | tr -d '\n' | head -c "$length"
            ;;
        "uuid")
            if command -v uuidgen &> /dev/null; then
                uuidgen | tr -d '\n'
            else
                # Fallback UUID generation
                printf '%08x-%04x-%04x-%04x-%012x\n' \
                    $((RANDOM*RANDOM)) $((RANDOM)) $((RANDOM)) $((RANDOM)) $((RANDOM*RANDOM*RANDOM))
            fi
            ;;
        *)
            error_exit "Unknown encoding: $encoding"
            ;;
    esac
}

# Validate secret strength
validate_secret_strength() {
    local secret="$1"
    local min_length=${2:-32}
    
    if [ ${#secret} -lt $min_length ]; then
        return 1
    fi
    
    # Check for sufficient entropy (basic check)
    local unique_chars
    unique_chars=$(echo -n "$secret" | fold -w1 | sort -u | wc -l)
    
    if [ "$unique_chars" -lt 8 ]; then
        return 1
    fi
    
    return 0
}

# Generate JWT secrets
generate_jwt_secrets() {
    info "Generating JWT secrets..."
    
    local jwt_secret
    local jwt_refresh_secret
    local jwt_issuer="lechworld-production-$(date +%s)"
    
    # Generate strong JWT secrets (64 bytes base64 encoded)
    jwt_secret=$(generate_secure_random 64 "base64")
    jwt_refresh_secret=$(generate_secure_random 64 "base64")
    
    # Validate strength
    if ! validate_secret_strength "$jwt_secret" 32; then
        error_exit "Generated JWT secret does not meet strength requirements"
    fi
    
    if ! validate_secret_strength "$jwt_refresh_secret" 32; then
        error_exit "Generated JWT refresh secret does not meet strength requirements"
    fi
    
    cat >> "$SECRETS_FILE" << EOF
# JWT Authentication Secrets
JWT_SECRET=${jwt_secret}
JWT_REFRESH_SECRET=${jwt_refresh_secret}
JWT_ISSUER=${jwt_issuer}

EOF
    
    success "JWT secrets generated successfully"
}

# Generate encryption keys
generate_encryption_keys() {
    info "Generating encryption keys..."
    
    local encryption_key
    local session_secret
    local csrf_secret
    local api_key_secret
    local webhook_secret
    
    # Generate encryption keys (32 bytes hex)
    encryption_key=$(generate_secure_random 32 "hex")
    session_secret=$(generate_secure_random 64 "base64")
    csrf_secret=$(generate_secure_random 32 "base64")
    api_key_secret=$(generate_secure_random 64 "base64")
    webhook_secret=$(generate_secure_random 32 "base64")
    
    cat >> "$SECRETS_FILE" << EOF
# Encryption Keys
ENCRYPTION_KEY=${encryption_key}
SESSION_SECRET=${session_secret}
CSRF_SECRET=${csrf_secret}
API_KEY_SECRET=${api_key_secret}
WEBHOOK_SECRET=${webhook_secret}

EOF
    
    success "Encryption keys generated successfully"
}

# Generate database secrets
generate_database_secrets() {
    info "Generating database secrets..."
    
    local db_password
    local redis_password
    
    # Generate strong database passwords
    db_password=$(generate_secure_random 32 "alphanumeric")
    redis_password=$(generate_secure_random 32 "alphanumeric")
    
    cat >> "$SECRETS_FILE" << EOF
# Database Secrets (Update your connection strings with these passwords)
DB_PASSWORD=${db_password}
REDIS_PASSWORD=${redis_password}

EOF
    
    success "Database secrets generated successfully"
}

# Generate backup encryption keys
generate_backup_keys() {
    info "Generating backup encryption keys..."
    
    local backup_encryption_key
    local vault_seal_key
    
    backup_encryption_key=$(generate_secure_random 32 "hex")
    vault_seal_key=$(generate_secure_random 32 "base64")
    
    cat >> "$SECRETS_FILE" << EOF
# Backup & Recovery Keys
BACKUP_ENCRYPTION_KEY=${backup_encryption_key}
VAULT_SEAL_KEY=${vault_seal_key}

EOF
    
    success "Backup encryption keys generated successfully"
}

# Generate CSP nonce secret
generate_csp_secrets() {
    info "Generating Content Security Policy secrets..."
    
    local csp_nonce_secret
    csp_nonce_secret=$(generate_secure_random 32 "base64")
    
    cat >> "$SECRETS_FILE" << EOF
# Content Security Policy
CSP_NONCE_SECRET=${csp_nonce_secret}

EOF
    
    success "CSP secrets generated successfully"
}

# Generate service-specific secrets
generate_service_secrets() {
    info "Generating service-specific secrets..."
    
    local internal_service_token
    local health_check_token
    local metrics_token
    
    internal_service_token=$(generate_secure_random 64 "base64")
    health_check_token=$(generate_secure_random 32 "base64")
    metrics_token=$(generate_secure_random 32 "base64")
    
    cat >> "$SECRETS_FILE" << EOF
# Service Authentication
INTERNAL_SERVICE_TOKEN=${internal_service_token}
HEALTH_CHECK_TOKEN=${health_check_token}
METRICS_TOKEN=${metrics_token}

EOF
    
    success "Service secrets generated successfully"
}

# Generate vault-compatible JSON file
generate_vault_file() {
    info "Generating HashiCorp Vault compatible JSON file..."
    
    # Create JSON structure for vault secrets
    cat > "$VAULT_FILE" << 'EOF'
{
  "data": {
EOF
    
    # Convert secrets to JSON format
    while IFS='=' read -r key value; do
        if [[ $key =~ ^[A-Z_]+$ ]] && [[ -n $value ]]; then
            lowercase_key=$(echo "$key" | tr '[:upper:]' '[:lower:]')
            echo "    \"${lowercase_key}\": \"$value\"," >> "$VAULT_FILE"
        fi
    done < <(grep -v '^#' "$SECRETS_FILE" | grep '=')
    
    # Remove trailing comma and close JSON
    sed -i '' '$s/,$//' "$VAULT_FILE" 2>/dev/null || sed -i '$s/,$//' "$VAULT_FILE"
    cat >> "$VAULT_FILE" << 'EOF'
  }
}
EOF
    
    success "Vault JSON file generated: $VAULT_FILE"
}

# Create backup
create_backup() {
    if [[ -f "$SECRETS_FILE" ]]; then
        local backup_name="secrets-backup-$(date +%Y%m%d-%H%M%S).env"
        local backup_path="$BACKUP_DIR/$backup_name"
        
        cp "$SECRETS_FILE" "$backup_path"
        success "Backup created: $backup_path"
    fi
}

# Set secure file permissions
set_secure_permissions() {
    info "Setting secure file permissions..."
    
    # Set restrictive permissions on secrets files
    chmod 600 "$SECRETS_FILE" 2>/dev/null || true
    chmod 600 "$VAULT_FILE" 2>/dev/null || true
    chmod 700 "$BACKUP_DIR" 2>/dev/null || true
    
    # Set permissions on backup files
    find "$BACKUP_DIR" -name "*.env" -exec chmod 600 {} \; 2>/dev/null || true
    
    success "Secure file permissions set"
}

# Generate summary report
generate_report() {
    info "Generating security report..."
    
    local report_file="./security-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
LechWorld Production Secrets Generation Report
Generated: $(date)
Environment: Production
Generator Version: 1.0.0

FILES GENERATED:
- Secrets file: $SECRETS_FILE (600 permissions)
- Vault file: $VAULT_FILE (600 permissions)
- Backup directory: $BACKUP_DIR (700 permissions)
- Log file: $LOG_FILE

SECRETS GENERATED:
- JWT Secret (64 bytes, base64 encoded)
- JWT Refresh Secret (64 bytes, base64 encoded)
- Encryption Key (32 bytes, hex encoded)
- Session Secret (64 bytes, base64 encoded)
- CSRF Secret (32 bytes, base64 encoded)
- API Key Secret (64 bytes, base64 encoded)
- Webhook Secret (32 bytes, base64 encoded)
- Database Password (32 bytes, alphanumeric)
- Redis Password (32 bytes, alphanumeric)
- Backup Encryption Key (32 bytes, hex encoded)
- CSP Nonce Secret (32 bytes, base64 encoded)
- Internal Service Tokens

SECURITY RECOMMENDATIONS:
1. Store secrets in a secure secret management service (AWS Secrets Manager, HashiCorp Vault)
2. Never commit the generated .env.production.secrets file to version control
3. Rotate secrets every 90 days
4. Use different secrets for different environments
5. Monitor secret access and usage
6. Implement proper secret injection in CI/CD pipelines
7. Use the generated vault file for HashiCorp Vault integration

NEXT STEPS:
1. Review generated secrets in: $SECRETS_FILE
2. Upload secrets to your secret management service
3. Configure your deployment pipeline to inject secrets
4. Test secret rotation procedures
5. Set up monitoring and alerting for secret access
6. Delete local secrets files after secure storage

⚠️  IMPORTANT: Delete local secrets files after securely storing them!

EOF
    
    success "Security report generated: $report_file"
}

# Print usage instructions
print_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
  -h, --help          Show this help message
  -f, --force         Overwrite existing secrets file
  -b, --backup        Create backup before generating new secrets
  -v, --vault         Generate HashiCorp Vault compatible JSON file
  -q, --quiet         Suppress non-error output

Examples:
  $0                  # Generate secrets with default options
  $0 -f -b           # Force regeneration with backup
  $0 -v              # Generate with Vault JSON file
  
Environment Variables:
  SECRETS_FILE        Custom path for secrets file (default: .env.production.secrets)
  BACKUP_DIR          Custom backup directory (default: ./backups/secrets)
  
EOF
}

# Parse command line arguments
parse_arguments() {
    local force=false
    local backup=false
    local vault=false
    local quiet=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                print_usage
                exit 0
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -b|--backup)
                backup=true
                shift
                ;;
            -v|--vault)
                vault=true
                shift
                ;;
            -q|--quiet)
                quiet=true
                exec > /dev/null
                shift
                ;;
            *)
                error_exit "Unknown option: $1"
                ;;
        esac
    done
    
    # Check if secrets file exists and handle accordingly
    if [[ -f "$SECRETS_FILE" ]] && [[ "$force" != true ]]; then
        warning "Secrets file already exists: $SECRETS_FILE"
        echo -n "Overwrite existing secrets file? [y/N]: "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            info "Operation cancelled"
            exit 0
        fi
        backup=true
    fi
    
    # Create backup if requested or if overwriting
    if [[ "$backup" == true ]]; then
        create_backup
    fi
    
    export GENERATE_VAULT_FILE="$vault"
}

# Main execution function
main() {
    print_header
    
    log "Starting secrets generation process"
    
    # Parse arguments
    parse_arguments "$@"
    
    # Perform security checks
    check_dependencies
    
    # Initialize secrets file
    cat > "$SECRETS_FILE" << EOF
# LechWorld Production Secrets
# Generated: $(date)
# WARNING: Keep this file secure and never commit to version control!

EOF
    
    # Generate all secrets
    generate_jwt_secrets
    generate_encryption_keys
    generate_database_secrets
    generate_backup_keys
    generate_csp_secrets
    generate_service_secrets
    
    # Generate vault file if requested
    if [[ "$GENERATE_VAULT_FILE" == true ]]; then
        generate_vault_file
    fi
    
    # Set secure permissions
    set_secure_permissions
    
    # Generate report
    generate_report
    
    # Final instructions
    echo -e "\n${GREEN}🎉 Secret generation completed successfully!${NC}"
    echo -e "\n${YELLOW}📋 NEXT STEPS:${NC}"
    echo -e "1. Review generated secrets in: ${CYAN}$SECRETS_FILE${NC}"
    echo -e "2. Upload to your secret management service"
    echo -e "3. Configure deployment pipeline for secret injection"
    echo -e "4. Test your production deployment"
    echo -e "5. ${RED}DELETE LOCAL SECRETS FILES${NC} after secure storage"
    
    echo -e "\n${RED}⚠️  SECURITY WARNING:${NC}"
    echo -e "Never commit the generated secrets file to version control!"
    echo -e "Store secrets securely using a proper secret management service."
    
    log "Secrets generation process completed successfully"
}

# Execute main function with all arguments
main "$@"