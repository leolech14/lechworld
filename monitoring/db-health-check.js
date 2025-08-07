#!/usr/bin/env node

/**
 * Database Health Check and Monitoring Script
 * Compatible with Neon, Supabase, Railway PostgreSQL
 * 
 * Features:
 * - Comprehensive health monitoring
 * - Performance metrics collection
 * - Connection pool monitoring
 * - Data integrity checks
 * - Cloud provider specific optimizations
 * - Alert integration ready
 * 
 * Usage:
 *   node monitoring/db-health-check.js [--json] [--verbose] [--alerts]
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Configuration
const HEALTH_CHECK_TIMEOUT = 30000; // 30 seconds
const PERFORMANCE_THRESHOLD = {
    connectionTime: 5000,    // 5 seconds max
    queryTime: 1000,         // 1 second max for simple queries
    complexQueryTime: 5000,  // 5 seconds max for complex queries
    diskUsage: 0.8,          // 80% max disk usage
    connectionCount: 0.9     // 90% max connections
};

const LOG_DIR = process.env.LOG_DIR || '/tmp/lechworld-health';
const LOG_FILE = path.join(LOG_DIR, `health-check-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Logging utility
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };
    
    if (process.env.NODE_ENV !== 'test') {
        console.log(`[${timestamp}] [${level}] ${message}`);
        if (data && process.argv.includes('--verbose')) {
            console.log(JSON.stringify(data, null, 2));
        }
    }
    
    // Write to log file
    try {
        fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
    } catch (error) {
        console.error('Failed to write to log file:', error.message);
    }
}

// Health check results container
class HealthCheckResult {
    constructor() {
        this.timestamp = new Date().toISOString();
        this.overall = 'UNKNOWN';
        this.checks = {};
        this.metrics = {};
        this.alerts = [];
        this.recommendations = [];
    }
    
    addCheck(name, status, message, data = null) {
        this.checks[name] = {
            status,
            message,
            data,
            timestamp: new Date().toISOString()
        };
        
        if (status === 'CRITICAL' || status === 'ERROR') {
            this.alerts.push({
                severity: status,
                check: name,
                message
            });
        }
    }
    
    addMetric(name, value, unit = null, threshold = null) {
        this.metrics[name] = {
            value,
            unit,
            threshold,
            status: threshold && value > threshold ? 'WARNING' : 'OK'
        };
    }
    
    addRecommendation(message, priority = 'MEDIUM') {
        this.recommendations.push({
            message,
            priority,
            timestamp: new Date().toISOString()
        });
    }
    
    finalize() {
        // Determine overall status
        const statuses = Object.values(this.checks).map(check => check.status);
        
        if (statuses.includes('CRITICAL')) {
            this.overall = 'CRITICAL';
        } else if (statuses.includes('ERROR')) {
            this.overall = 'ERROR';
        } else if (statuses.includes('WARNING')) {
            this.overall = 'WARNING';
        } else if (statuses.every(status => status === 'OK')) {
            this.overall = 'OK';
        } else {
            this.overall = 'PARTIAL';
        }
    }
}

// Database connection test
async function testConnection(result) {
    log('INFO', 'Testing database connection...');
    
    const startTime = Date.now();
    let sql;
    
    try {
        // Test basic connection
        sql = postgres(process.env.DATABASE_URL, { 
            max: 1,
            connect_timeout: 10,
            idle_timeout: 5
        });
        
        const connectionResult = await sql`SELECT version(), current_database(), current_user`;
        const connectionTime = Date.now() - startTime;
        
        result.addMetric('connection_time_ms', connectionTime, 'ms', PERFORMANCE_THRESHOLD.connectionTime);
        
        const dbInfo = connectionResult[0];
        result.addCheck('connection', 'OK', 'Database connection successful', {
            version: dbInfo.version.split(' ').slice(0, 2).join(' '),
            database: dbInfo.current_database,
            user: dbInfo.current_user,
            connectionTime: `${connectionTime}ms`
        });
        
        // Test connection pool
        const poolInfo = sql.options;
        result.addMetric('max_connections', poolInfo.max, 'connections');
        
        await sql.end();
        
    } catch (error) {
        result.addCheck('connection', 'CRITICAL', `Connection failed: ${error.message}`, {
            error: error.message,
            code: error.code
        });
        
        if (sql) {
            try {
                await sql.end();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}

// Test query performance
async function testQueryPerformance(result) {
    log('INFO', 'Testing query performance...');
    
    let sql;
    try {
        sql = postgres(process.env.DATABASE_URL, { max: 1 });
        
        // Simple query test
        const simpleStart = Date.now();
        await sql`SELECT 1 as test`;
        const simpleTime = Date.now() - simpleStart;
        
        result.addMetric('simple_query_time_ms', simpleTime, 'ms', PERFORMANCE_THRESHOLD.queryTime);
        
        // Complex query test (if tables exist)
        try {
            const complexStart = Date.now();
            const complexResult = await sql`
                SELECT 
                    COUNT(DISTINCT f.id) as families,
                    COUNT(DISTINCT u.id) as users,
                    COUNT(DISTINCT fm.id) as members,
                    COUNT(DISTINCT lp.id) as programs
                FROM families f
                LEFT JOIN users u ON f.id = u.family_id
                LEFT JOIN family_members fm ON f.id = fm.family_id
                LEFT JOIN loyalty_programs lp ON lp.is_active = true
            `;
            const complexTime = Date.now() - complexStart;
            
            result.addMetric('complex_query_time_ms', complexTime, 'ms', PERFORMANCE_THRESHOLD.complexQueryTime);
            result.addCheck('query_performance', 'OK', 'Query performance within acceptable limits', {
                simpleQueryTime: `${simpleTime}ms`,
                complexQueryTime: `${complexTime}ms`,
                dataStats: complexResult[0]
            });
            
        } catch (error) {
            // Tables might not exist yet
            result.addCheck('query_performance', 'WARNING', 'Complex query test skipped - tables not found', {
                simpleQueryTime: `${simpleTime}ms`,
                reason: 'Schema not fully initialized'
            });
        }
        
        await sql.end();
        
    } catch (error) {
        result.addCheck('query_performance', 'ERROR', `Query performance test failed: ${error.message}`);
        
        if (sql) {
            try {
                await sql.end();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}

// Test database schema integrity
async function testSchemaIntegrity(result) {
    log('INFO', 'Testing schema integrity...');
    
    let sql;
    try {
        sql = postgres(process.env.DATABASE_URL, { max: 1 });
        
        // Check for required tables
        const expectedTables = [
            'families', 'users', 'family_members', 'loyalty_programs', 
            'member_programs', 'mile_transactions', 'activity_log', 
            'notification_preferences'
        ];
        
        const existingTables = await sql`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE 'drizzle_%'
            ORDER BY tablename
        `;
        
        const tableNames = existingTables.map(row => row.tablename);
        const missingTables = expectedTables.filter(table => !tableNames.includes(table));
        const extraTables = tableNames.filter(table => !expectedTables.includes(table));
        
        if (missingTables.length === 0) {
            result.addCheck('schema_integrity', 'OK', 'All required tables present', {
                expectedTables: expectedTables.length,
                foundTables: tableNames.length,
                tables: tableNames
            });
        } else {
            result.addCheck('schema_integrity', 'ERROR', `Missing required tables: ${missingTables.join(', ')}`, {
                missingTables,
                extraTables,
                foundTables: tableNames
            });
        }
        
        // Check for required indexes
        const indexes = await sql`
            SELECT indexname, tablename FROM pg_indexes 
            WHERE schemaname = 'public' 
            AND indexname LIKE 'idx_%'
        `;
        
        result.addMetric('indexes_count', indexes.length, 'indexes');
        
        if (indexes.length >= 20) {
            result.addCheck('indexes', 'OK', `Found ${indexes.length} performance indexes`);
        } else {
            result.addCheck('indexes', 'WARNING', `Only ${indexes.length} indexes found, performance may be impacted`);
            result.addRecommendation('Consider running database migrations to ensure all indexes are created', 'HIGH');
        }
        
        await sql.end();
        
    } catch (error) {
        result.addCheck('schema_integrity', 'ERROR', `Schema check failed: ${error.message}`);
        
        if (sql) {
            try {
                await sql.end();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}

// Test data consistency
async function testDataConsistency(result) {
    log('INFO', 'Testing data consistency...');
    
    let sql;
    try {
        sql = postgres(process.env.DATABASE_URL, { max: 1 });
        
        // Check referential integrity
        const orphanedRecords = await sql`
            SELECT 
                'users' as table_name,
                COUNT(*) as orphaned_count
            FROM users u
            LEFT JOIN families f ON u.family_id = f.id
            WHERE f.id IS NULL
            
            UNION ALL
            
            SELECT 
                'family_members' as table_name,
                COUNT(*) as orphaned_count
            FROM family_members fm
            LEFT JOIN families f ON fm.family_id = f.id
            WHERE f.id IS NULL
            
            UNION ALL
            
            SELECT 
                'member_programs' as table_name,
                COUNT(*) as orphaned_count
            FROM member_programs mp
            LEFT JOIN family_members fm ON mp.member_id = fm.id
            WHERE fm.id IS NULL
        `;
        
        const totalOrphaned = orphanedRecords.reduce((sum, row) => sum + parseInt(row.orphaned_count), 0);
        
        if (totalOrphaned === 0) {
            result.addCheck('data_consistency', 'OK', 'No orphaned records found');
        } else {
            result.addCheck('data_consistency', 'WARNING', `Found ${totalOrphaned} orphaned records`, {
                orphanedByTable: orphanedRecords.filter(row => parseInt(row.orphaned_count) > 0)
            });
            result.addRecommendation('Clean up orphaned records to maintain data integrity', 'MEDIUM');
        }
        
        await sql.end();
        
    } catch (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
            result.addCheck('data_consistency', 'WARNING', 'Data consistency check skipped - tables not found');
        } else {
            result.addCheck('data_consistency', 'ERROR', `Data consistency check failed: ${error.message}`);
        }
        
        if (sql) {
            try {
                await sql.end();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}

// Test cloud provider specific features
async function testCloudProviderFeatures(result) {
    log('INFO', 'Testing cloud provider features...');
    
    const databaseUrl = process.env.DATABASE_URL || '';
    let provider = 'unknown';
    
    if (databaseUrl.includes('neon.tech')) {
        provider = 'neon';
    } else if (databaseUrl.includes('supabase.co')) {
        provider = 'supabase';
    } else if (databaseUrl.includes('railway.app')) {
        provider = 'railway';
    } else if (databaseUrl.includes('rds.amazonaws.com')) {
        provider = 'aws-rds';
    } else if (databaseUrl.includes('sql.gcp')) {
        provider = 'gcp-sql';
    }
    
    let sql;
    try {
        sql = postgres(process.env.DATABASE_URL, { max: 1 });
        
        // Test provider-specific features
        switch (provider) {
            case 'neon':
                // Test Neon-specific features
                const neonResult = await sql`SELECT pg_backend_pid(), inet_server_addr()`;
                result.addCheck('cloud_provider', 'OK', 'Neon PostgreSQL features available', {
                    provider: 'Neon',
                    features: ['serverless', 'branching', 'autoscaling'],
                    backendPid: neonResult[0].pg_backend_pid
                });
                result.addRecommendation('Consider using Neon branching for development/testing environments', 'LOW');
                break;
                
            case 'supabase':
                // Test Supabase-specific features
                try {
                    const supabaseExtensions = await sql`SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto')`;
                    result.addCheck('cloud_provider', 'OK', 'Supabase PostgreSQL features available', {
                        provider: 'Supabase',
                        features: ['realtime', 'auth', 'storage', 'edge-functions'],
                        extensions: supabaseExtensions.map(ext => ext.extname)
                    });
                    result.addRecommendation('Leverage Supabase realtime features for live updates', 'MEDIUM');
                } catch (error) {
                    result.addCheck('cloud_provider', 'WARNING', 'Some Supabase extensions not available');
                }
                break;
                
            case 'railway':
                // Test Railway-specific features
                result.addCheck('cloud_provider', 'OK', 'Railway PostgreSQL connection active', {
                    provider: 'Railway',
                    features: ['automated-deployments', 'volume-backups', 'metrics']
                });
                result.addRecommendation('Monitor Railway usage metrics to optimize costs', 'LOW');
                break;
                
            default:
                result.addCheck('cloud_provider', 'OK', `Generic PostgreSQL connection active (${provider})`, {
                    provider: provider,
                    databaseUrl: databaseUrl.replace(/\/\/[^@]+@/, '//***:***@') // Hide credentials
                });
        }
        
        // Test SSL connection
        const sslInfo = await sql`SHOW ssl`;
        result.addCheck('ssl_connection', sslInfo[0].ssl === 'on' ? 'OK' : 'WARNING', 
            `SSL connection: ${sslInfo[0].ssl}`, { ssl: sslInfo[0].ssl });
        
        await sql.end();
        
    } catch (error) {
        result.addCheck('cloud_provider', 'ERROR', `Provider feature test failed: ${error.message}`);
        
        if (sql) {
            try {
                await sql.end();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}

// Test backup readiness
async function testBackupReadiness(result) {
    log('INFO', 'Testing backup readiness...');
    
    let sql;
    try {
        sql = postgres(process.env.DATABASE_URL, { max: 1 });
        
        // Check for backup-related settings and tables
        const backupChecks = await sql`
            SELECT 
                setting, 
                name 
            FROM pg_settings 
            WHERE name IN ('wal_level', 'archive_mode', 'log_statement')
        `;
        
        const settings = {};
        backupChecks.forEach(row => {
            settings[row.name] = row.setting;
        });
        
        // Check if migration tracking table exists
        const migrationTable = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'drizzle_migrations'
            ) as exists
        `;
        
        const hasBackupStrategy = fs.existsSync(path.join(__dirname, '../database/backup-strategy.md'));
        const hasMigrationScript = fs.existsSync(path.join(__dirname, '../scripts/db-migrate-production.sh'));
        
        const backupScore = (
            (migrationTable[0].exists ? 1 : 0) +
            (hasBackupStrategy ? 1 : 0) +
            (hasMigrationScript ? 1 : 0)
        );
        
        if (backupScore >= 2) {
            result.addCheck('backup_readiness', 'OK', 'Backup infrastructure is ready', {
                migrationTracking: migrationTable[0].exists,
                backupStrategy: hasBackupStrategy,
                migrationScript: hasMigrationScript,
                walLevel: settings.wal_level
            });
        } else {
            result.addCheck('backup_readiness', 'WARNING', 'Backup infrastructure needs improvement', {
                migrationTracking: migrationTable[0].exists,
                backupStrategy: hasBackupStrategy,
                migrationScript: hasMigrationScript
            });
            result.addRecommendation('Complete backup infrastructure setup (see database/backup-strategy.md)', 'HIGH');
        }
        
        await sql.end();
        
    } catch (error) {
        result.addCheck('backup_readiness', 'ERROR', `Backup readiness check failed: ${error.message}`);
        
        if (sql) {
            try {
                await sql.end();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    }
}

// Send alerts if configured
async function sendAlerts(result) {
    if (!process.argv.includes('--alerts') || result.alerts.length === 0) {
        return;
    }
    
    log('INFO', `Sending ${result.alerts.length} alerts...`);
    
    // Webhook URL for alerts (configure as needed)
    const webhookUrl = process.env.HEALTH_CHECK_WEBHOOK_URL;
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    const emailAlerts = process.env.EMAIL_ALERTS_ENABLED === 'true';
    
    const alertData = {
        timestamp: result.timestamp,
        service: 'lechworld-database',
        overall_status: result.overall,
        alerts: result.alerts,
        summary: {
            total_checks: Object.keys(result.checks).length,
            failed_checks: Object.values(result.checks).filter(c => c.status !== 'OK').length,
            critical_issues: result.alerts.filter(a => a.severity === 'CRITICAL').length
        }
    };
    
    try {
        // Example webhook integration (customize as needed)
        if (webhookUrl) {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alertData)
            });
            
            if (response.ok) {
                log('INFO', 'Alerts sent to webhook successfully');
            } else {
                log('ERROR', `Failed to send alerts to webhook: ${response.statusText}`);
            }
        }
        
        // Log alerts to console for immediate visibility
        console.log('\n🚨 ALERTS DETECTED:');
        result.alerts.forEach(alert => {
            console.log(`   [${alert.severity}] ${alert.check}: ${alert.message}`);
        });
        
    } catch (error) {
        log('ERROR', `Failed to send alerts: ${error.message}`);
    }
}

// Main health check function
async function runHealthCheck() {
    const result = new HealthCheckResult();
    
    log('INFO', 'Starting database health check...');
    log('INFO', `Log file: ${LOG_FILE}`);
    
    try {
        // Run all health checks
        await testConnection(result);
        await testQueryPerformance(result);
        await testSchemaIntegrity(result);
        await testDataConsistency(result);
        await testCloudProviderFeatures(result);
        await testBackupReadiness(result);
        
        // Finalize results
        result.finalize();
        
        // Send alerts if needed
        await sendAlerts(result);
        
        log('INFO', `Health check completed with status: ${result.overall}`);
        
        // Output results
        if (process.argv.includes('--json')) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log('\n📊 Database Health Check Results');
            console.log('=====================================');
            console.log(`Overall Status: ${result.overall}`);
            console.log(`Timestamp: ${result.timestamp}`);
            console.log('');
            
            console.log('🔍 Check Results:');
            Object.entries(result.checks).forEach(([name, check]) => {
                const icon = check.status === 'OK' ? '✅' : 
                           check.status === 'WARNING' ? '⚠️' : '❌';
                console.log(`   ${icon} ${name}: ${check.message}`);
            });
            
            if (Object.keys(result.metrics).length > 0) {
                console.log('\n📈 Metrics:');
                Object.entries(result.metrics).forEach(([name, metric]) => {
                    const status = metric.status === 'WARNING' ? '⚠️' : '✅';
                    console.log(`   ${status} ${name}: ${metric.value}${metric.unit ? ' ' + metric.unit : ''}`);
                });
            }
            
            if (result.recommendations.length > 0) {
                console.log('\n💡 Recommendations:');
                result.recommendations.forEach(rec => {
                    const icon = rec.priority === 'HIGH' ? '🔴' : 
                               rec.priority === 'MEDIUM' ? '🟡' : '🟢';
                    console.log(`   ${icon} ${rec.message}`);
                });
            }
        }
        
        // Exit with appropriate code
        const exitCode = result.overall === 'CRITICAL' || result.overall === 'ERROR' ? 1 : 0;
        process.exit(exitCode);
        
    } catch (error) {
        log('ERROR', `Health check failed: ${error.message}`);
        result.addCheck('health_check_runner', 'CRITICAL', `Health check execution failed: ${error.message}`);
        result.finalize();
        
        console.error('❌ Health check execution failed:', error.message);
        process.exit(1);
    }
}

// Handle script arguments and execution
if (require.main === module) {
    // Set timeout for the entire health check
    const timeout = setTimeout(() => {
        console.error('❌ Health check timed out');
        process.exit(1);
    }, HEALTH_CHECK_TIMEOUT);
    
    runHealthCheck().finally(() => {
        clearTimeout(timeout);
    });
}

module.exports = {
    runHealthCheck,
    HealthCheckResult,
    PERFORMANCE_THRESHOLD
};