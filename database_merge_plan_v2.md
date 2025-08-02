# 🎯 Database Merge Plan v2 - Family Loyalty Program Vault

## 📋 Core Purpose Understanding
This is a **shared family vault** for managing airline/loyalty program credentials, not a miles tracking app. The focus is:
- **Credential Storage**: Save login info so family members can access each other's accounts
- **Password Management**: Track password changes with audit logs
- **Point Visibility**: Show current balances and values in BRL
- **Activity Tracking**: Log who changed what and when
- **Flexible Storage**: Add custom fields as needed

## 🔄 Revised Database Design

### Core Tables Needed

```typescript
// 1. Keep it simple - One user account for the whole family
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // 'lech' for simple login
  password: text("password").notNull(), // 'world' or whatever they want
  familyName: text("family_name").default("Lech Family"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Family members - who can access/modify accounts
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Osvandré, Marilise, etc.
  emoji: text("emoji").default("👤"), // Visual identifier
  color: text("color").default("#3B82F6"), // For UI
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. Loyalty programs - Airlines and their programs
export const loyaltyPrograms = pgTable("loyalty_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "LATAM Pass"
  company: text("company").notNull(), // "LATAM Airlines"
  programType: text("program_type").default("miles"),
  
  // For point value calculations
  pointValueBRL: numeric("point_value_brl").default("0.03"), // Average value per point in BRL
  
  // Visual
  logoUrl: text("logo_url"),
  logoColor: text("logo_color").default("#3B82F6"),
  
  // Info
  website: text("website"),
  phoneNumber: text("phone_number"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// 4. Member program accounts - The core table
export const memberProgramAccounts = pgTable("member_program_accounts", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => familyMembers.id).notNull(),
  programId: integer("program_id").references(() => loyaltyPrograms.id).notNull(),
  
  // Account credentials (from JSON data insights)
  accountNumber: text("account_number").notNull(), // Can be email or member number
  loginEmail: text("login_email"), // Some programs use email
  sitePassword: text("site_password"), // Website password
  milesPassword: text("miles_password"), // PIN or secondary password
  
  // Account data
  currentPoints: integer("current_points").default(0),
  statusTier: text("status_tier"), // PLATINUM, GOLD, etc.
  
  // Notes and custom fields
  notes: text("notes"), // "senha não funciona", etc.
  customFields: json("custom_fields"), // Flexible additional fields
  
  // Tracking
  lastUpdated: timestamp("last_updated").defaultNow(),
  lastUpdatedBy: integer("last_updated_by").references(() => familyMembers.id),
  
  // Calculated field
  estimatedValueBRL: numeric("estimated_value_brl").generatedAlwaysAs(
    sql`current_points * (SELECT point_value_brl FROM loyalty_programs WHERE id = program_id)`
  ),
});

// 5. Activity log - Who changed what
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => familyMembers.id).notNull(),
  accountId: integer("account_id").references(() => memberProgramAccounts.id).notNull(),
  action: text("action").notNull(), // 'password_changed', 'points_updated', 'used_miles'
  
  // What changed
  fieldChanged: text("field_changed"), // 'site_password', 'current_points', etc.
  oldValue: text("old_value"),
  newValue: text("new_value"),
  
  // Optional memo
  memo: text("memo"), // "Comprei passagem para SP", "Troquei senha", etc.
  
  timestamp: timestamp("timestamp").defaultNow(),
});

// 6. Indexes for performance
// Add indexes on frequently queried fields
createIndex("idx_member_accounts", memberProgramAccounts, ["memberId", "programId"]);
createIndex("idx_activity_member", activityLog, ["memberId"]);
createIndex("idx_activity_account", activityLog, ["accountId"]);
```

## 📊 Data Import Strategy

### From JSON Data (`loyalty_programs_data.json`):
1. **Create Programs**: LATAM Pass, GOL/Smiles, Turkish, American, Copa, Azul
2. **Create Members**: Osvandré, Marilise, Graciela, Leonardo
3. **Import Accounts**: All 18 account entries with proper credential mapping
4. **Handle Edge Cases**: 
   - Missing passwords marked as "?"
   - Notes like "nenhuma das senhas deu certo"
   - Different password types (site vs miles)

### Point Value Calculations:
```typescript
// Average values per mile/point in BRL (based on market rates)
const POINT_VALUES = {
  "LATAM Pass": 0.03,      // 3 centavos per point
  "GOL/Smiles": 0.025,     // 2.5 centavos per point
  "TudoAzul": 0.028,       // 2.8 centavos per point
  "American Airlines": 0.04, // 4 centavos per point (international)
  "Turkish Airlines": 0.035, // 3.5 centavos per point
  "Copa Airlines": 0.03     // 3 centavos per point
};
```

## 🚀 Implementation Priority

### Phase 1: Core Functionality (Week 1)
1. **Simplify Authentication**: Keep the mock login (lech/world) but add session tracking
2. **Import Real Data**: Load all 18 accounts from JSON
3. **Fix Password Storage**: Implement dual password fields
4. **Activity Logging**: Track all changes with member attribution

### Phase 2: Calculations & Display (Week 2)
1. **Fix Point Values**: Implement proper BRL calculations per airline
2. **Dashboard Totals**: Sum all points with correct valuations
3. **Auto-save**: Ensure it works with activity logging
4. **Custom Fields**: Allow flexible field addition

### Phase 3: Enhanced Features (Week 3)
1. **Password Change Alerts**: Notify when credentials updated
2. **Points Usage Tracking**: Log when miles are spent
3. **Export/Import**: Backup family data
4. **Mobile Optimization**: Better mobile UI

## 🔧 Key Differences from Original Plan

### What to REMOVE:
- Complex authentication systems (keep it simple)
- Transaction history tables (not needed for password vault)
- Notification systems (overkill for family use)
- Rate limiting (internal use only)

### What to FOCUS ON:
- **Credential Management**: Primary purpose
- **Activity Logging**: Who changed what
- **Simple UI**: Easy for family members
- **Accurate Calculations**: Correct BRL values
- **Flexible Storage**: Custom fields per account

## 📝 Database Migration Steps

1. **Choose Single Schema**: Use PostgreSQL + Drizzle (remove Supabase)
2. **Simplify Tables**: Focus on credentials, not transactions
3. **Import JSON Data**: All 18 real accounts
4. **Add Activity Logging**: Track all changes
5. **Fix Calculations**: Correct point-to-BRL conversions

This approach aligns with the actual purpose: a **simple, shared family vault** for managing loyalty program credentials, not a complex miles tracking system.