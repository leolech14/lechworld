# 🎯 Database Merge Plan Final - Family Loyalty Program Hub

## 📋 Complete Purpose Understanding
This is a **comprehensive family loyalty program management system** that:
1. **Stores Credentials**: Shared vault for login information
2. **Tracks Miles/Points**: Current balances and values in BRL
3. **Logs Activity**: Who changed passwords, used miles, earned points
4. **Manages Programs**: Multiple airlines/hotels per family member
5. **Calculates Values**: Real-time point-to-BRL conversions

## 🔄 Complete Database Design

### Core Tables Structure

```typescript
// 1. Individual user authentication for family members
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // 'leonardo', 'graciela', etc. (case-insensitive)
  password: text("password"), // NULL until first login, then bcrypt hashed
  name: text("name").notNull(), // Display name
  familyMemberId: integer("family_member_id").references(() => familyMembers.id),
  
  // First login tracking
  isFirstLogin: boolean("is_first_login").default(true),
  lastLogin: timestamp("last_login"),
  
  // Security
  passwordChangedAt: timestamp("password_changed_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Family members
export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Osvandré, Marilise, etc.
  emoji: text("emoji").default("👤"),
  frameColor: text("frame_color").default("#FED7E2"),
  frameBorderColor: text("frame_border_color").default("#F687B3"),
  cpf: text("cpf"), // Brazilian ID
  phone: text("phone"),
  birthdate: text("birthdate"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. Loyalty programs with accurate point values
export const loyaltyPrograms = pgTable("loyalty_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "LATAM Pass"
  company: text("company").notNull(), // "LATAM Airlines"
  code: text("code"), // "LA", "G3", "AD", etc.
  programType: text("program_type").default("miles"), // miles, points, cashback
  
  // Point valuation in BRL
  pointValueBRL: decimal("point_value_brl", { precision: 10, scale: 4 }).default(0.03),
  
  // Transfer rules (from Schema 2)
  transferEnabled: boolean("transfer_enabled").default(false),
  minTransferAmount: integer("min_transfer_amount"),
  transferFeeType: text("transfer_fee_type"), // 'flat', 'percentage'
  transferFeeAmount: integer("transfer_fee_amount"),
  transferPartners: json("transfer_partners"), // Partner airline codes
  
  // Expiration rules
  expirationMonths: integer("expiration_months"),
  extendableOnActivity: boolean("extendable_on_activity").default(false),
  
  // Visual and info
  logoUrl: text("logo_url"),
  logoColor: text("logo_color").default("#3B82F6"),
  website: text("website"),
  phoneNumber: text("phone_number"),
  
  // Status tier names mapping
  tierNames: json("tier_names"), // {"basic": "MULTIPLUS", "silver": "PRATA", "gold": "GOLD", "platinum": "PLATINUM", "diamond": "DIAMANTE"}
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 4. Member program accounts - Core credential and miles tracking
export const memberProgramAccounts = pgTable("member_program_accounts", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => familyMembers.id).notNull(),
  programId: integer("program_id").references(() => loyaltyPrograms.id).notNull(),
  
  // Credentials (from JSON insights)
  accountNumber: text("account_number").notNull(),
  loginEmail: text("login_email"),
  sitePassword: text("site_password"), // Website password
  milesPassword: text("miles_password"), // PIN or miles-specific password
  
  // Miles tracking
  currentPoints: integer("current_points").default(0),
  lifetimePoints: integer("lifetime_points").default(0),
  yearlyPoints: integer("yearly_points").default(0),
  statusTier: text("status_tier"), // PLATINUM, GOLD, DIAMANTE, etc.
  statusExpiryDate: date("status_expiry_date"),
  
  // Additional data
  documentNumber: text("document_number"), // CPF/Passport
  documentType: text("document_type"), // 'CPF', 'RG', 'Passport'
  notes: text("notes"),
  customFields: json("custom_fields"),
  
  // Tracking
  lastUpdated: timestamp("last_updated").defaultNow(),
  lastUpdatedBy: integer("last_updated_by").references(() => users.id),
  lastSyncDate: timestamp("last_sync_date"), // When points were last checked
  
  isActive: boolean("is_active").default(true),
}, (table) => ({
  uniqueMemberProgram: uniqueIndex("unique_member_program").on(table.memberId, table.programId),
}));

// 5. Miles transactions - Track earning and redemption
export const mileTransactions = pgTable("mile_transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => memberProgramAccounts.id).notNull(),
  memberId: integer("member_id").references(() => familyMembers.id).notNull(),
  
  // Transaction details
  type: text("type").notNull(), // 'earned', 'redeemed', 'expired', 'transferred'
  miles: integer("miles").notNull(), // positive for earned, negative for used
  description: text("description").notNull(),
  
  // Financial tracking
  costBRL: decimal("cost_brl", { precision: 10, scale: 2 }), // For purchases
  valueBRL: decimal("value_brl", { precision: 10, scale: 2 }), // Calculated value
  
  // References
  referenceNumber: text("reference_number"), // Ticket number, order ID, etc.
  source: text("source"), // 'flight', 'credit_card', 'shopping', 'transfer'
  
  // Dates
  transactionDate: date("transaction_date").notNull(),
  expirationDate: date("expiration_date"),
  
  // Who recorded this
  recordedBy: integer("recorded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  idxAccount: index("idx_transaction_account").on(table.accountId),
  idxMember: index("idx_transaction_member").on(table.memberId),
  idxDate: index("idx_transaction_date").on(table.transactionDate),
}));

// 6. Activity log - Audit trail for all changes
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Who performed the action
  memberId: integer("member_id").references(() => familyMembers.id), // Which family member's data was affected
  accountId: integer("account_id").references(() => memberProgramAccounts.id),
  
  // What happened
  action: text("action").notNull(), // 'password_changed', 'points_updated', 'miles_redeemed', 'account_created', 'login'
  category: text("category").notNull(), // 'security', 'miles', 'account', 'profile', 'auth'
  
  // Details
  description: text("description").notNull(),
  fieldChanged: text("field_changed"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  metadata: json("metadata"), // Additional context like IP address, user agent
  
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  idxUser: index("idx_activity_user").on(table.userId),
  idxMember: index("idx_activity_member").on(table.memberId),
  idxTimestamp: index("idx_activity_timestamp").on(table.timestamp),
}));

// 7. Calculated views for dashboard
export const dashboardStatsView = sql`
CREATE VIEW dashboard_stats AS
SELECT 
  fm.id as member_id,
  fm.name as member_name,
  COUNT(DISTINCT mpa.id) as total_programs,
  SUM(mpa.current_points) as total_points,
  SUM(mpa.current_points * lp.point_value_brl) as total_value_brl,
  MAX(mpa.last_updated) as last_activity
FROM family_members fm
LEFT JOIN member_program_accounts mpa ON fm.id = mpa.member_id
LEFT JOIN loyalty_programs lp ON mpa.program_id = lp.id
WHERE fm.is_active = true AND mpa.is_active = true
GROUP BY fm.id, fm.name;
`;
```

## 📊 Data Import from JSON

### Programs to Create:
```typescript
const PROGRAMS_DATA = {
  "LATAM Pass": { 
    code: "LA", 
    pointValueBRL: 0.030,
    tiers: { basic: "MULTIPLUS", gold: "GOLD", platinum: "PLATINUM" }
  },
  "GOL/Smiles": { 
    code: "G3", 
    pointValueBRL: 0.025,
    tiers: { basic: "SMILES", silver: "PRATA", diamond: "DIAMANTE" }
  },
  "Azul TudoAzul": { 
    code: "AD", 
    pointValueBRL: 0.028,
    tiers: { basic: "TOPÁZIO", sapphire: "SAFIRA", diamond: "DIAMANTE" }
  },
  "American Airlines AAdvantage": { 
    code: "AA", 
    pointValueBRL: 0.040,
    tiers: { basic: "MEMBER", gold: "GOLD", platinum: "PLATINUM" }
  },
  "Turkish Airlines Miles&Smiles": { 
    code: "TK", 
    pointValueBRL: 0.035,
    tiers: { basic: "CLASSIC", elite: "ELITE", elite_plus: "ELITE PLUS" }
  },
  "Copa Airlines ConnectMiles": { 
    code: "CM", 
    pointValueBRL: 0.032,
    tiers: { basic: "MEMBER", silver: "SILVER", gold: "GOLD" }
  }
};
```

### Import Strategy:
1. Create all 6 airline programs with accurate point values
2. Create 5 users: Leonardo, Graciela, Osvandré, Marilise, Denise (case-insensitive usernames)
3. Create 4 family members linked to users (Denise is staff, not a family member)
4. Import all 18 account credentials with dual passwords
5. Set current points from JSON data
6. Map status tiers correctly

### User Authentication Flow:
1. **Login Page**: Enter username (case-insensitive: "LEONARDO" = "leonardo")
2. **First Login Detection**: If password is NULL, prompt to create password
3. **Password Creation**: Validate and hash with bcrypt
4. **Session Management**: Store user ID in session
5. **Activity Tracking**: All actions logged with correct user attribution

## 🚀 Implementation Phases

### Phase 1: Foundation (Days 1-3)
1. **User Authentication**: Implement individual user login system
   - Case-insensitive username login
   - First-time password creation flow
   - Session management with user tracking
2. **Merge Schemas**: Combine best of all three sources
3. **Fix Security**: Use bcrypt for all password hashing
4. **Import Data**: Create 5 users and load all accounts from JSON
5. **Fix Calculations**: Implement accurate BRL valuations

### Phase 2: Core Features (Days 4-7)
1. **Activity Logging**: Track all changes with user attribution
   - "Leonardo changed LATAM password at 14:32"
   - "Marilise updated GOL miles: 30,109 → 35,000"
   - "Graciela logged in from mobile device"
2. **Transaction History**: Add miles earning/redemption
3. **Dashboard Stats**: Real-time totals and analytics per user
4. **Auto-save**: With proper user tracking in logs

### Phase 3: Enhanced Tracking (Week 2)
1. **Expiration Alerts**: Track points expiring soon
2. **Transfer Calculator**: Show transfer costs between programs
3. **Trip Planning**: Track planned redemptions
4. **Points Goals**: Set and track earning targets

### Phase 4: Polish (Week 3)
1. **Mobile Optimization**: Better responsive design
2. **Export/Import**: Full data backup
3. **Search & Filter**: Find transactions quickly
4. **Charts**: Visual analytics

## 📈 Key Metrics to Track

1. **Total Family Points**: Sum across all programs
2. **Total Value in BRL**: With accurate conversions
3. **Expiring Soon**: Points expiring in next 90 days
4. **Recent Activity**: Last 30 days of changes
5. **Elite Status**: Members maintaining status

## 🎯 Success Criteria

1. **Individual User Accounts**: Each family member logs in with their own credentials
2. **Accurate Values**: Fix the "10 BRL" bug with real calculations
3. **Complete History**: Track WHO (user) changed WHAT (data) and WHEN
4. **Dual Purpose**: Both credential vault AND miles tracker
5. **Family Friendly**: Simple login for all family members
6. **Reliable Data**: Import and maintain real account data
7. **Audit Trail**: Every action shows "Leonardo did X" not just "X happened"

## 🔐 Security & Privacy Features

1. **Personal Accountability**: Each user responsible for their actions
2. **First Login Flow**: Users create their own passwords
3. **Case-Insensitive Login**: "LEONARDO" = "Leonardo" = "leonardo"
4. **Session Tracking**: Know who's currently logged in
5. **Failed Login Protection**: Lock account after X attempts
6. **Activity Visibility**: Everyone can see who made changes

This comprehensive approach serves both needs: secure credential storage AND complete miles/points tracking with accurate valuations and full user-attributed audit trails.