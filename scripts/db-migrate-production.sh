#!/bin/bash
set -euo pipefail

# Production Database Migration Script
# Compatible with Neon, Supabase, Railway PostgreSQL
# Author: Database Specialist
# Version: 1.0.0

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_PACKAGE_PATH="$PROJECT_ROOT/packages/database"
MIGRATION_LOG_FILE="/tmp/lechworld-migration-$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="/tmp/lechworld-backups"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        DEBUG)
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$MIGRATION_LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log INFO "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log ERROR "Node.js is not installed"
        exit 1
    fi
    
    # Check npm/yarn/pnpm
    if ! command -v npm &> /dev/null && ! command -v yarn &> /dev/null && ! command -v pnpm &> /dev/null; then
        log ERROR "No package manager found (npm, yarn, or pnpm)"
        exit 1
    fi
    
    # Check if DATABASE_URL is set
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log ERROR "DATABASE_URL environment variable is not set"
        echo "Set it using: export DATABASE_URL='your-database-url'"
        exit 1
    fi
    
    # Validate DATABASE_URL format
    if [[ ! $DATABASE_URL =~ ^postgresql:// ]]; then
        log ERROR "DATABASE_URL must be a PostgreSQL connection string"
        exit 1
    fi
    
    log INFO "Prerequisites check passed"
}

# Database connection test
test_connection() {
    log INFO "Testing database connection..."
    
    # Extract connection details for psql test
    local db_url="$DATABASE_URL"
    
    # Test with a simple query
    if psql "$db_url" -c "SELECT version();" > /dev/null 2>&1; then
        log INFO "Database connection successful"
    else
        log ERROR "Database connection failed"
        log INFO "Trying with node script fallback..."
        
        # Create temporary test script
        cat > /tmp/db-test.js << 'EOF'
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function testConnection() {
    try {
        await client.connect();
        const result = await client.query('SELECT version()');
        console.log('✅ Database connection successful');
        console.log('PostgreSQL version:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
EOF
        
        if node /tmp/db-test.js; then
            log INFO "Database connection test passed"
        else
            log ERROR "Database connection test failed"
            exit 1
        fi
        
        rm -f /tmp/db-test.js
    fi
}

# Create database backup
create_backup() {
    log INFO "Creating database backup..."
    
    local backup_file="$BACKUP_DIR/backup-$(date +%Y%m%d_%H%M%S).sql"
    
    # Try pg_dump first
    if command -v pg_dump &> /dev/null; then
        if pg_dump "$DATABASE_URL" > "$backup_file" 2>/dev/null; then
            log INFO "Database backup created: $backup_file"
            echo "$backup_file" > "$BACKUP_DIR/latest-backup.txt"
            return 0
        fi
    fi
    
    log WARN "pg_dump not available or failed, creating logical backup..."
    
    # Create Node.js backup script
    cat > /tmp/backup-script.js << 'EOF'
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function createBackup() {
    const backupFile = process.argv[2];
    
    try {
        await client.connect();
        
        // Get all tables
        const tablesResult = await client.query(`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE 'drizzle_%'
            ORDER BY tablename
        `);
        
        let backupSQL = `-- Database backup created on ${new Date().toISOString()}\n`;
        backupSQL += `-- This is a logical backup of data only\n\n`;
        
        for (const table of tablesResult.rows) {
            const tableName = table.tablename;
            
            // Get table data
            const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
            
            if (dataResult.rows.length > 0) {
                backupSQL += `-- Data for table: ${tableName}\n`;
                
                for (const row of dataResult.rows) {
                    const columns = Object.keys(row);
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        if (val instanceof Date) return `'${val.toISOString()}'`;
                        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                        return val;
                    });
                    
                    backupSQL += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
                }
                
                backupSQL += '\n';
            }
        }
        
        fs.writeFileSync(backupFile, backupSQL);
        console.log(`✅ Backup created: ${backupFile}`);
        
        await client.end();
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
        process.exit(1);
    }
}

createBackup();
EOF
    
    if node /tmp/backup-script.js "$backup_file"; then
        log INFO "Logical database backup created: $backup_file"
        echo "$backup_file" > "$BACKUP_DIR/latest-backup.txt"
    else
        log WARN "Backup creation failed, continuing with migration..."
    fi
    
    rm -f /tmp/backup-script.js
}

# Run migrations
run_migrations() {
    log INFO "Running database migrations..."
    
    cd "$DB_PACKAGE_PATH"
    
    # Generate new migrations if needed
    log INFO "Generating migrations..."
    if npm run db:generate; then
        log INFO "Migration generation completed"
    else
        log ERROR "Migration generation failed"
        exit 1
    fi
    
    # Check if there are pending migrations
    if ls src/migrations/*.sql 1> /dev/null 2>&1; then
        log INFO "Pending migrations found, applying..."
        
        # Apply migrations
        if npm run db:migrate; then
            log INFO "Migrations applied successfully"
        else
            log ERROR "Migration application failed"
            log INFO "Check the migration logs for details"
            exit 1
        fi
    else
        log INFO "No pending migrations found"
    fi
}

# Verify migration
verify_migration() {
    log INFO "Verifying migration..."
    
    # Create verification script
    cat > /tmp/verify-migration.js << 'EOF'
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function verify() {
    const sql = postgres(process.env.DATABASE_URL, { max: 1 });
    const db = drizzle(sql);
    
    try {
        // Test basic queries
        const tables = await sql`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE 'drizzle_%'
        `;
        
        console.log('✅ Database tables found:', tables.length);
        
        // Check for required tables
        const requiredTables = ['families', 'users', 'family_members', 'loyalty_programs', 'member_programs'];
        for (const table of requiredTables) {
            const exists = tables.some(t => t.tablename === table);
            if (exists) {
                console.log(`✅ Table '${table}' exists`);
            } else {
                console.log(`❌ Table '${table}' missing`);
                process.exit(1);
            }
        }
        
        // Test basic functionality
        const familyCount = await sql`SELECT COUNT(*) FROM families`;
        console.log(`✅ Families table accessible, count: ${familyCount[0].count}`);
        
        await sql.end();
        console.log('✅ Migration verification passed');
        
    } catch (error) {
        console.error('❌ Migration verification failed:', error.message);
        process.exit(1);
    }
}

verify();
EOF
    
    cd "$DB_PACKAGE_PATH"
    if node /tmp/verify-migration.js; then
        log INFO "Migration verification passed"
    else
        log ERROR "Migration verification failed"
        exit 1
    fi
    
    rm -f /tmp/verify-migration.js
}

# Rollback function
rollback() {
    log WARN "Rolling back migration..."
    
    local backup_file
    if [[ -f "$BACKUP_DIR/latest-backup.txt" ]]; then
        backup_file=$(cat "$BACKUP_DIR/latest-backup.txt")
        
        if [[ -f "$backup_file" ]]; then
            log INFO "Restoring from backup: $backup_file"
            
            # Try psql first
            if command -v psql &> /dev/null; then
                if psql "$DATABASE_URL" < "$backup_file"; then
                    log INFO "Database restored from backup"
                    return 0
                fi
            fi
            
            log ERROR "Failed to restore from backup"
            log INFO "Manual restoration may be required using: $backup_file"
        else
            log ERROR "Backup file not found: $backup_file"
        fi
    else
        log ERROR "No backup available for rollback"
    fi
    
    exit 1
}

# Health check
health_check() {
    log INFO "Running post-migration health check..."
    
    # Run the health check script
    if [[ -f "$PROJECT_ROOT/monitoring/db-health-check.js" ]]; then
        cd "$PROJECT_ROOT"
        if node monitoring/db-health-check.js; then
            log INFO "Health check passed"
        else
            log WARN "Health check failed - review system status"
        fi
    else
        log WARN "Health check script not found"
    fi
}

# Main execution
main() {
    log INFO "Starting production database migration..."
    log INFO "Migration log: $MIGRATION_LOG_FILE"
    
    # Set error handler
    trap rollback ERR
    
    check_prerequisites
    test_connection
    create_backup
    run_migrations
    verify_migration
    health_check
    
    log INFO "Production database migration completed successfully!"
    log INFO "Migration log saved to: $MIGRATION_LOG_FILE"
    
    if [[ -f "$BACKUP_DIR/latest-backup.txt" ]]; then
        local backup_file=$(cat "$BACKUP_DIR/latest-backup.txt")
        log INFO "Backup available at: $backup_file"
    fi
}

# Handle script arguments
case "${1:-}" in
    --dry-run)
        log INFO "Dry run mode - no changes will be made"
        check_prerequisites
        test_connection
        log INFO "Dry run completed - migration would proceed normally"
        exit 0
        ;;
    --rollback)
        rollback
        ;;
    --help|-h)
        cat << EOF
Usage: $0 [OPTIONS]

Production Database Migration Script

OPTIONS:
    --dry-run    Test prerequisites and connection without making changes
    --rollback   Restore from the latest backup
    --help, -h   Show this help message

ENVIRONMENT VARIABLES:
    DATABASE_URL    PostgreSQL connection string (required)

EXAMPLES:
    $0                    # Run full migration
    $0 --dry-run         # Test without changes
    $0 --rollback        # Restore from backup

For more information, see: packages/database/README.md
EOF
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log ERROR "Unknown option: $1"
        log INFO "Use --help for usage information"
        exit 1
        ;;
esac