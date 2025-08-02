# 🔄 Database & Data Source Merge Analysis

## 📊 Three Data Sources Overview

### 1. Schema 1 (`shared/schema.ts`) - Current Active Schema
- **Type**: Generic loyalty program system
- **Supports**: Airlines, hotels, credit cards, retail
- **Focus**: UI/UX features (colors, emojis, frames)

### 2. Schema 2 (`shared/schemas/database.ts`) - Alternative Schema
- **Type**: Airline-specific system
- **Supports**: Airlines only
- **Focus**: Performance, security, transactions

### 3. JSON/CSV Data (`loyalty_programs_data.json`)
- **Type**: Real family data
- **Contains**: 18 actual loyalty program enrollments
- **Members**: Osvandré, Marilise, Graciela, Leonardo
- **Airlines**: LATAM Pass, GOL/Smiles, Turkish, American, Copa, Azul

## 🎯 Key Insights from Data Merge

### Missing Airlines in Current System
The JSON data includes airlines not in the seed data:
- **Turkish Airlines** (Miles&Smiles program)
- **American Airlines** (AAdvantage program)
- **Copa Airlines** (ConnectMiles program)

### Data Structure Gaps

| Feature | Schema 1 | Schema 2 | JSON Data | Merge Requirement |
|---------|----------|----------|-----------|-------------------|
| **Multiple Passwords** | ❌ Single password | ❌ Single password + PIN | ✅ Site & Miles passwords | Need dual password fields |
| **Account Numbers** | ✅ Has field | ✅ memberNumber | ✅ Various formats | Support different formats |
| **Status Tiers** | ✅ eliteTier | ✅ statusLevel | ✅ PLATINUM, GOLD, DIAMANTE, etc | Map all tier names |
| **Miles/Points** | ✅ pointsBalance | ✅ currentMiles | ✅ Actual balances | Already supported |
| **Last Updated** | ✅ lastUpdated | ❌ Missing | ✅ Update dates | Use Schema 1 approach |
| **Partner Airlines** | ✅ transferPartners (JSON) | ❌ Not included | ✅ Extensive partner lists | Need partner mapping |

### Family Member Data
```
Members: 4
- Osvandré (Primary) - Has all 6 programs
- Marilise - Has 5 programs
- Graciela - Has 3 programs
- Leonardo - Has 4 programs
```

### Status Tier Mapping Needed
```
LATAM Pass: PLATINUM, GOLD, MULTIPLUS
GOL/Smiles: DIAMANTE, PRATA
Azul: DIAMANTE, SAFIRA
```

## 🔧 Recommended Merged Schema

```typescript
// Enhanced schema combining all three sources
export const loyaltyPrograms = pgTable("loyalty_programs", {
  // From Schema 1
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  programType: text("program_type").notNull(),
  logoColor: text("logo_color").default("#3B82F6"),
  category: text("category").default("airline"),
  website: text("website"),
  phoneNumber: text("phone_number"),
  iconUrl: text("icon_url"),
  
  // From Schema 2
  code: text("code"), // IATA code
  transferEnabled: boolean("transfer_enabled").default(false),
  minTransferAmount: integer("min_transfer_amount"),
  transferFeeType: text("transfer_fee_type"),
  transferFeeAmount: integer("transfer_fee_amount"),
  expirationMonths: integer("expiration_months"),
  
  // From JSON data insights
  transferPartners: json("transfer_partners"), // Array of partner codes
  tierNames: json("tier_names"), // Map of tier levels
  
  // Indexes from Schema 2
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const memberPrograms = pgTable("member_programs", {
  // Core fields
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => familyMembers.id),
  programId: integer("program_id").references(() => loyaltyPrograms.id),
  
  // Account access (from JSON data)
  accountNumber: text("account_number"),
  sitePassword: text("site_password"), // NEW: Separate from miles password
  milesPassword: text("miles_password"), // NEW: PIN or miles-specific password
  
  // From Schema 1
  pointsBalance: integer("points_balance").default(0),
  eliteTier: text("elite_tier"),
  notes: text("notes"),
  customFields: json("custom_fields"),
  estimatedValue: text("estimated_value"),
  
  // From Schema 2
  lifetimeMiles: integer("lifetime_miles"),
  documentNumber: text("document_number"),
  documentType: text("document_type"),
  lastSyncDate: timestamp("last_sync_date"),
  
  // Tracking
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Add from Schema 2 - Critical for tracking
export const mileTransactions = pgTable("mile_transactions", {
  id: serial("id").primaryKey(),
  memberProgramId: integer("member_program_id").references(() => memberPrograms.id),
  miles: integer("miles").notNull(),
  description: text("description").notNull(),
  transactionDate: date("transaction_date").notNull(),
  expirationDate: date("expiration_date"),
  source: text("source").notNull(),
  referenceNumber: text("reference_number"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## 📋 Migration Tasks

### 1. Database Schema Updates
- [ ] Add `sitePassword` and `milesPassword` fields to memberPrograms
- [ ] Add `mileTransactions` table from Schema 2
- [ ] Add `notificationPreferences` table from Schema 2
- [ ] Add proper indexes from Schema 2
- [ ] Add `tierNames` JSON field for status mapping

### 2. Seed Data Updates
- [ ] Add Turkish Airlines (TK - Miles&Smiles)
- [ ] Add American Airlines (AA - AAdvantage)
- [ ] Add Copa Airlines (CM - ConnectMiles)
- [ ] Update existing airlines with partner lists
- [ ] Add tier name mappings for each program

### 3. Data Import from JSON
- [ ] Import all 18 member program enrollments
- [ ] Map status tiers correctly
- [ ] Store both password types
- [ ] Handle notes and edge cases (e.g., "nenhuma das senhas deu certo")

### 4. Business Logic Updates
- [ ] Handle dual password authentication
- [ ] Support different account number formats
- [ ] Map all status tier variations
- [ ] Calculate total miles across all programs per member

## 🚀 Implementation Priority

1. **Immediate**: Add missing password fields (security critical)
2. **High**: Add transaction tracking table
3. **High**: Import missing airlines and real data
4. **Medium**: Add partner airline mappings
5. **Low**: Add notification preferences

This merged approach gives you:
- The flexibility of Schema 1
- The performance and security of Schema 2
- The real-world data structure from the JSON file