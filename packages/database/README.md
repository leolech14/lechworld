# @monorepo/database

Production-ready database package for the Family Loyalty Program application using Drizzle ORM with PostgreSQL.

## Features

- ✅ **Type-safe schema** with Drizzle ORM
- ✅ **Security-first design** with encrypted passwords
- ✅ **Performance optimized** with proper indexes
- ✅ **Family-centric architecture** for loyalty programs
- ✅ **Comprehensive seeding** with 5 family members
- ✅ **Migration management** with rollback support
- ✅ **Query helpers** for common operations
- ✅ **Activity logging** for audit trails

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
# Required
DATABASE_URL="postgresql://username:password@localhost:5432/family_loyalty_db"

# Optional (for encryption)
ENCRYPTION_KEY="your-32-byte-hex-key" # Will generate if not provided
```

### 3. Generate Schema & Run Migrations

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (development)
npm run db:push
```

### 4. Seed Database

```bash
# Seed with family data
npm run db:seed

# Or reset and reseed (development only)
npm run db:reset
```

### 5. Explore Data

```bash
# Launch Drizzle Studio
npm run db:studio
```

## Database Schema

### Core Tables

- **`families`** - Family groups
- **`users`** - System users with authentication
- **`family_members`** - Family members with profiles
- **`loyalty_programs`** - Available loyalty programs
- **`member_programs`** - Member enrollments in programs
- **`mile_transactions`** - Point earning/redemption history
- **`activity_log`** - Audit trail of all actions
- **`notification_preferences`** - User notification settings

### Key Features

#### Security
- Passwords hashed with bcrypt (12 rounds)
- Sensitive data encrypted with AES-256-GCM
- Failed login tracking and account locking
- Role-based access control

#### Performance
- Comprehensive indexing strategy
- Query optimization for common operations
- Efficient relationship mapping
- Connection pooling

#### Family Structure
```
Silva Family
├── Carlos Silva (Admin) - Primary account holder
├── Maria Silva (Member) - Active traveler
├── João Silva (Member) - Young adult, moderate usage
├── Ana Silva (Member) - Student, light usage
└── Pedro Silva (View Only) - Minor, parent-managed
```

## Usage Examples

### Basic Database Connection

```typescript
import { getDefaultDatabase } from '@monorepo/database';

const dbManager = getDefaultDatabase();
const db = await dbManager.connect();
```

### Using Query Helpers

```typescript
import { userQueries, dashboardQueries } from '@monorepo/database';

// Find user by email
const user = await userQueries.findByEmail(db, 'carlos.silva@email.com');

// Get dashboard stats
const stats = await dashboardQueries.getStats(db, familyId);
```

### Working with Encrypted Data

```typescript
import { memberProgramQueries, encryptionUtils } from '@monorepo/database';

// Get programs with decrypted passwords (for authorized users)
const programs = await memberProgramQueries.findByMemberWithDecryption(db, memberId);

// Encrypt new password before storage
const encrypted = encryptionUtils.encryptMemberProgramData({
  sitePassword: 'newPassword123',
  milesPassword: '4567'
});
```

### Activity Logging

```typescript
import { activityLogQueries } from '@monorepo/database';

// Log user action
await activityLogQueries.create(db, {
  userId: user.id,
  memberId: member.id,
  action: 'points_updated',
  category: 'miles',
  description: 'Updated points balance for GOL Smiles program',
  metadata: { oldBalance: 50000, newBalance: 52000 }
});
```

## Scripts

- **`npm run db:generate`** - Generate migration files from schema
- **`npm run db:migrate`** - Run pending migrations
- **`npm run db:push`** - Push schema directly (development)
- **`npm run db:studio`** - Launch Drizzle Studio web UI
- **`npm run db:seed`** - Seed database with initial data
- **`npm run db:reset`** - Reset and reseed database (development only)

## Development

### Adding New Tables

1. Define table in `src/schema.ts`
2. Add relationships if needed
3. Create validation schemas
4. Generate migration: `npm run db:generate`
5. Run migration: `npm run db:migrate`

### Adding Query Helpers

Add new query functions in `src/queries/index.ts`:

```typescript
export const newTableQueries = {
  findById: (db: DatabaseInstance, id: number) =>
    db.select().from(newTable).where(eq(newTable.id, id)),
  
  // More queries...
};
```

### Security Best Practices

- Never store plain text passwords
- Always encrypt sensitive member data
- Use parameterized queries (Drizzle handles this)
- Implement proper access controls
- Log security-relevant actions

## Migration Strategy

### Development
- Use `npm run db:push` for rapid iteration
- Use `npm run db:reset` to start fresh

### Production
- Always use `npm run db:migrate`
- Test migrations on staging first
- Have rollback plans ready
- Monitor performance after schema changes

## Seeded Data Overview

The database comes pre-seeded with realistic test data:

### Family: Silva Family
- **5 members** with different roles and access levels
- **7+ loyalty programs** (Brazilian & International)
- **~10 member enrollments** across different programs
- **Sample transactions** showing earning/redemption patterns
- **Notification preferences** configured per user

### Loyalty Programs Included
- **Airlines**: GOL Smiles, Azul TudoAzul, LATAM Pass
- **Credit Cards**: Livelo, Bradesco Esfera
- **Hotels**: Accor Live Limitless
- **Retail**: Dotz

## Troubleshooting

### Connection Issues
- Verify `DATABASE_URL` environment variable
- Ensure PostgreSQL is running
- Check network connectivity and firewall settings

### Migration Errors
- Check for syntax errors in schema
- Verify no conflicting constraints
- Review migration order dependencies

### Seeding Problems
- Ensure migrations ran successfully first
- Check for unique constraint violations
- Verify encryption setup is working

## Contributing

1. Follow the existing schema patterns
2. Add proper TypeScript types
3. Include comprehensive indexes
4. Write query helpers for common operations
5. Test migrations thoroughly
6. Update documentation

## License

MIT License - see LICENSE file for details.