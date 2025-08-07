# Legacy Data Migration Guide

## Overview

This migration script imports data from the legacy Supabase export and CSV files into the new database schema format with proper encryption and security measures.

## Data Sources

1. **Supabase Export**: `/Users/lech/lechworld/legacy/supabase-export.json`
   - Contains users, family_members, loyalty_programs, and member_programs
   - Primary data source for structure and relationships

2. **CSV Data**: `/Users/lech/lechworld/legacy/loyalty_programs_data.csv`
   - Contains additional password data missing from JSON export
   - Provides supplementary account credentials and notes

## User Mapping

The migration maps legacy users to new user IDs:
- Leonardo → ID: 7
- Graciela → ID: 8
- Osvandré → ID: 9
- Marilise → ID: 10
- Denise → ID: 11

## Security Features

### Password Encryption
- All `site_password` and `miles_password` fields are encrypted using AES-256-GCM
- Uses the encryption utility from `src/utils/encryption.ts`
- Requires `ENCRYPTION_KEY` environment variable to be set

### Authentication
- Users are set up for name-only authentication (case insensitive)
- No password hashes are stored since we're using first-name authentication
- `isFirstLogin` is set to `false` for existing users

## Data Processing

### Password Merging Strategy
The script merges password data with the following priority:
1. CSV data (highest priority)
2. Legacy custom_fields
3. Legacy main password field (fallback)

### Status Level Mapping
Elite tiers are mapped to standardized status levels:
- "DIAMOND"/"DIAMANTE" → `diamond`
- "PLATINUM" → `platinum` 
- "GOLD"/"OURO" → `gold`
- "SILVER"/"PRATA"/"SAFIRA" → `silver`
- Default → `basic`

### Program Category Detection
Loyalty programs are categorized automatically:
- Hotel: Accor, etc. → `hotel`
- Credit Card: Contains "card"/"credit" → `credit_card`
- Retail: Contains "retail"/"shop" → `retail`
- Default: Airlines → `airline`

## Usage

### Prerequisites

1. Ensure the database is set up and accessible
2. Set the `ENCRYPTION_KEY` environment variable:
   ```bash
   export ENCRYPTION_KEY="your-32-byte-encryption-key-here"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Migration

```bash
# From the database package directory
npm run migrate:legacy

# Or from the root of the monorepo
npm run migrate:legacy --workspace=@monorepo/database
```

### Migration Output

The script provides detailed logging:
- ✅ Successful operations
- ⚠️ Warnings for missing data
- ❌ Errors with details
- 🔐 Indicates when passwords are encrypted
- 📋 Shows when CSV data is merged

## Verification

After migration, you can verify the data:

1. **Check user count**: Should have 5 users (Leonardo, Graciela, Osvandré, Marilise, Denise)
2. **Verify family members**: All legacy family members should be present
3. **Loyalty programs**: All programs should be migrated with proper categories
4. **Member programs**: All accounts with encrypted passwords
5. **Encryption test**: Run the validation function to ensure encryption works

## Troubleshooting

### Common Issues

1. **Encryption validation fails**
   ```
   Solution: Check that ENCRYPTION_KEY environment variable is set to a 32-byte key
   ```

2. **Database connection fails**
   ```
   Solution: Verify DATABASE_URL environment variable and database accessibility
   ```

3. **Missing CSV data**
   ```
   Solution: Ensure /Users/lech/lechworld/legacy/loyalty_programs_data.csv exists
   ```

4. **File not found errors**
   ```
   Solution: Verify legacy data files exist at the specified paths
   ```

### Manual Verification Queries

```sql
-- Check migrated users
SELECT id, username, name, role FROM users WHERE id IN (7,8,9,10,11);

-- Check encrypted passwords (should see encrypted strings)
SELECT account_number, 
       CASE WHEN site_password_encrypted IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END as site_pw,
       CASE WHEN miles_password_encrypted IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END as miles_pw
FROM member_programs 
WHERE site_password_encrypted IS NOT NULL OR miles_password_encrypted IS NOT NULL;

-- Check program distribution
SELECT category, COUNT(*) FROM loyalty_programs GROUP BY category;
```

## Data Integrity

The migration ensures:
- No duplicate entries (uses `onConflictDoNothing()`)
- All foreign key relationships are maintained
- Password data is never stored in plain text
- CSV and JSON data are properly merged
- Legacy custom fields are preserved
- Notes from both sources are combined

## Post-Migration

After successful migration:
1. Test login functionality with name-only authentication
2. Verify encrypted password decryption works
3. Check that all loyalty program relationships are correct
4. Ensure family member mappings are accurate
5. Review activity logs for any issues

## Rollback

If you need to rollback the migration:
1. Use the database reset script: `npm run db:reset`
2. Re-run your normal database migrations: `npm run db:migrate`
3. Re-seed with fresh data if needed: `npm run db:seed`