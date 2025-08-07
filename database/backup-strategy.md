# Database Backup Strategy

## Overview

This document outlines the comprehensive backup strategy for the LechWorld Family Loyalty Program database, designed for high availability and disaster recovery across cloud PostgreSQL providers.

## Supported Providers

### Primary Cloud PostgreSQL Providers
- **Neon**: Serverless PostgreSQL with automatic branching
- **Supabase**: Open-source Firebase alternative with PostgreSQL
- **Railway**: Container-based PostgreSQL hosting
- **AWS RDS**: Enterprise-grade PostgreSQL
- **Google Cloud SQL**: Managed PostgreSQL service

## Backup Types

### 1. Automated Backups (Provider-Level)

#### Neon
- **Point-in-time Recovery**: Up to 7 days (Pro plan)
- **Automated Snapshots**: Daily backups retained for 7 days
- **Branch-based Backups**: Create database branches for testing
- **Recovery Time**: < 5 minutes for most scenarios

```bash
# Neon CLI backup commands
neon branches create --name backup-$(date +%Y%m%d)
neon branches restore --branch main --timestamp "2024-01-15 14:30:00"
```

#### Supabase
- **Daily Backups**: Automatic daily backups retained for 7 days (Pro plan)
- **Point-in-time Recovery**: Available for Pro+ plans
- **Manual Snapshots**: On-demand backup creation
- **Recovery Time**: 5-15 minutes depending on database size

```bash
# Supabase backup via CLI
supabase db dump --file backup-$(date +%Y%m%d).sql
supabase db reset --restore backup-20240115.sql
```

#### Railway
- **Automatic Snapshots**: Daily backups for Pro plans
- **Volume Backups**: Complete database volume snapshots
- **Recovery Time**: 10-30 minutes
- **Retention**: 30 days for Pro plans

```bash
# Railway backup (manual export)
railway run pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### 2. Application-Level Backups

#### Logical Backups (Custom Scripts)

Our production migration script (`scripts/db-migrate-production.sh`) includes:
- **Pre-migration Backups**: Automatic backup before any schema changes
- **Data Consistency Checks**: Verification of backup integrity
- **Rollback Capability**: Restore from backup in case of failure

#### Schema-Only Backups
```bash
# Generate schema-only backup
pg_dump --schema-only $DATABASE_URL > schema-backup-$(date +%Y%m%d).sql

# Using Drizzle
cd packages/database
npm run db:generate
```

#### Data-Only Backups
```bash
# Generate data-only backup
pg_dump --data-only --exclude-table=drizzle_migrations $DATABASE_URL > data-backup-$(date +%Y%m%d).sql
```

### 3. Business-Critical Data Exports

#### Family Loyalty Data
```javascript
// Export critical loyalty data
const exportLoyaltyData = async () => {
  const families = await db.select().from(schema.families);
  const members = await db.select().from(schema.familyMembers);
  const programs = await db.select().from(schema.memberPrograms);
  const transactions = await db.select().from(schema.mileTransactions);
  
  return {
    exportDate: new Date().toISOString(),
    families,
    members,
    programs,
    transactions
  };
};
```

## Backup Schedules

### Production Environment
- **Automated Provider Backups**: Daily at 02:00 UTC
- **Application Backups**: Before every migration
- **Business Data Exports**: Weekly on Sundays at 03:00 UTC
- **Schema Snapshots**: After every schema change

### Staging Environment
- **Automated Backups**: Weekly
- **Schema Snapshots**: Daily during development cycles

### Development Environment
- **Local Backups**: Before major changes
- **Seed Data Preservation**: Maintain clean seed state

## Recovery Procedures

### 1. Point-in-Time Recovery (PITR)

#### Neon Recovery
```bash
# Create recovery branch
neon branches create --name recovery-$(date +%Y%m%d-%H%M%S) \
  --parent main \
  --timestamp "2024-01-15 10:30:00"

# Test recovery branch
DATABASE_URL="recovered-branch-url" npm run db:health-check

# Promote recovery branch to main
neon branches rename --branch recovery-20240115 --name main-new
```

#### Supabase Recovery
```bash
# Download backup
supabase db dump --file recovery-backup.sql

# Create new project for testing
supabase projects create recovery-test

# Restore backup to test project
supabase db reset --restore recovery-backup.sql
```

#### Railway Recovery
```bash
# Create new database service
railway service create --name recovery-db

# Restore from backup
cat backup-20240115.sql | railway run psql $RECOVERY_DATABASE_URL
```

### 2. Application-Level Recovery

#### Using Migration Script Rollback
```bash
# Automatic rollback if migration fails
./scripts/db-migrate-production.sh --rollback

# Manual rollback from specific backup
export BACKUP_FILE="/tmp/lechworld-backups/backup-20240115.sql"
./scripts/db-migrate-production.sh --rollback
```

#### Manual Recovery Process
```bash
# 1. Stop application
systemctl stop lechworld-api

# 2. Create emergency backup of current state
pg_dump $DATABASE_URL > emergency-backup-$(date +%Y%m%d-%H%M%S).sql

# 3. Drop and recreate database (if needed)
dropdb --if-exists lechworld_recovery
createdb lechworld_recovery

# 4. Restore from backup
psql lechworld_recovery < backup-20240115.sql

# 5. Update connection string
export DATABASE_URL="postgresql://user:pass@host:5432/lechworld_recovery"

# 6. Verify integrity
node monitoring/db-health-check.js

# 7. Restart application
systemctl start lechworld-api
```

### 3. Disaster Recovery

#### Complete Database Loss
1. **Assess Situation**: Determine extent of data loss
2. **Activate DR Plan**: Switch to backup provider if needed
3. **Data Recovery**: Use latest available backup
4. **Integrity Verification**: Run comprehensive health checks
5. **Application Testing**: Verify all functionality
6. **Gradual Rollout**: Staged return to full service

#### Partial Data Corruption
1. **Isolate Affected Tables**: Identify corrupted data
2. **Selective Restore**: Restore only affected tables
3. **Data Reconciliation**: Merge with clean data where possible
4. **Validation**: Verify data consistency

## Monitoring and Alerting

### Backup Success Monitoring
```javascript
// Health check for backup systems
const backupHealthCheck = {
  lastBackupTime: new Date(),
  backupSize: '150MB',
  integrityCheck: 'PASSED',
  retentionCompliance: 'OK'
};
```

### Automated Alerts
- **Backup Failures**: Immediate notification via email/Slack
- **Large Data Changes**: Alert on >10% data volume changes
- **Schema Drift**: Notification on unexpected schema changes
- **Recovery Time**: SLA monitoring for RTO/RPO targets

## Security and Compliance

### Encryption
- **At Rest**: All backups encrypted using AES-256
- **In Transit**: TLS 1.3 for all backup transfers
- **Key Management**: Provider-managed encryption keys

### Access Control
- **Backup Access**: Limited to database administrators
- **Recovery Operations**: Require two-person authorization
- **Audit Logging**: All backup/recovery operations logged

### Data Retention
- **Operational Backups**: 30 days retention
- **Archive Backups**: Quarterly long-term storage (1 year)
- **Compliance**: LGPD/GDPR data retention compliance

## Testing and Validation

### Monthly Backup Testing
```bash
# Automated backup validation
./scripts/test-backup-integrity.sh

# Recovery time testing
time ./scripts/db-migrate-production.sh --rollback
```

### Quarterly DR Drills
1. Simulate complete database loss
2. Execute full recovery procedure
3. Validate application functionality
4. Document lessons learned
5. Update procedures as needed

## Cost Optimization

### Provider Cost Management
- **Neon**: Use compute scaling to minimize costs
- **Supabase**: Optimize backup retention periods
- **Railway**: Leverage volume snapshots efficiently

### Storage Optimization
```bash
# Compress backups
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Clean old backups
find /backup-path -name "*.sql" -mtime +30 -delete
```

## Performance Considerations

### Backup Impact
- **Non-blocking Backups**: Use online backup methods
- **Off-peak Scheduling**: Schedule during low-traffic periods
- **Resource Throttling**: Limit backup process CPU/IO usage

### Recovery Optimization
- **Parallel Restore**: Use multiple connections for large datasets
- **Index Recreation**: Rebuild indexes after restore for optimal performance
- **Statistics Update**: Run ANALYZE after recovery

## Backup Script Integration

### Environment Variables
```bash
# Required for all backup operations
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
export BACKUP_ENCRYPTION_KEY="your-encryption-key"
export NOTIFICATION_WEBHOOK="https://your-monitoring-system.com/webhook"
```

### Automated Backup Script
```bash
#!/bin/bash
# Production backup automation
set -euo pipefail

BACKUP_DIR="/var/backups/lechworld"
DATE=$(date +%Y%m%d_%H%M%S)

# Create encrypted backup
pg_dump $DATABASE_URL | \
  gpg --symmetric --cipher-algo AES256 --compress-algo 1 --compress-level 6 \
  > "$BACKUP_DIR/backup_$DATE.sql.gpg"

# Verify backup integrity
if gpg --decrypt --quiet "$BACKUP_DIR/backup_$DATE.sql.gpg" | head -10 > /dev/null; then
  echo "✅ Backup verification successful"
else
  echo "❌ Backup verification failed"
  exit 1
fi

# Clean old backups (keep last 30 days)
find "$BACKUP_DIR" -name "backup_*.sql.gpg" -mtime +30 -delete

echo "✅ Backup completed: backup_$DATE.sql.gpg"
```

## Documentation Updates

This backup strategy document should be reviewed and updated:
- **Monthly**: After any infrastructure changes
- **Quarterly**: During DR drill exercises
- **Annually**: Complete strategy review and optimization

## Contact and Escalation

### Primary Contacts
- **Database Administrator**: [Your contact information]
- **DevOps Lead**: [DevOps contact]
- **Emergency Escalation**: [24/7 contact]

### Escalation Matrix
1. **Level 1**: Database Administrator (15 minutes)
2. **Level 2**: DevOps Lead (30 minutes)
3. **Level 3**: CTO/Technical Director (1 hour)
4. **Level 4**: CEO/Executive Team (4 hours)

---

**Document Version**: 1.0  
**Last Updated**: 2024-08-07  
**Next Review**: 2024-11-07