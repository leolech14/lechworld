/**
 * @purpose Database schema definitions and TypeScript types for Family Loyalty Program
 * @description Production-ready schema with security improvements, proper indexes, and clean organization
 */

import { pgTable, text, serial, integer, boolean, timestamp, json, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ============================================================================
// CORE TABLES
// ============================================================================

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("idx_families_name").on(table.name),
  createdAtIdx: index("idx_families_created_at").on(table.createdAt),
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").notNull(),
  // Password will be hashed using bcrypt (never store plain text)
  passwordHash: text("password_hash"), // nullable for first-time login
  name: text("name").notNull(),
  role: text("role", { enum: ["member", "staff", "admin"] }).notNull().default("member"),
  familyId: integer("family_id").references(() => families.id).notNull(),
  
  // Security & Login tracking
  isFirstLogin: boolean("is_first_login").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  passwordChangedAt: timestamp("password_changed_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  usernameUniqueIdx: uniqueIndex("idx_users_username_unique").on(table.username),
  emailUniqueIdx: uniqueIndex("idx_users_email_unique").on(table.email),
  familyIdIdx: index("idx_users_family_id").on(table.familyId),
  roleIdx: index("idx_users_role").on(table.role),
  lastLoginIdx: index("idx_users_last_login").on(table.lastLogin),
}));

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["primary", "extended", "view_only"] }).notNull(),
  userId: integer("user_id").references(() => users.id),
  familyId: integer("family_id").references(() => families.id).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  
  // Profile fields
  cpf: text("cpf"), // Brazilian tax ID
  phone: text("phone"),
  birthdate: text("birthdate"), // YYYY-MM-DD format
  
  // UI customization
  frameColor: text("frame_color").default("#FED7E2").notNull(),
  frameBorderColor: text("frame_border_color").default("#F687B3").notNull(),
  profileEmoji: text("profile_emoji").default("👤").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailIdx: index("idx_family_members_email").on(table.email),
  familyIdIdx: index("idx_family_members_family_id").on(table.familyId),
  userIdIdx: index("idx_family_members_user_id").on(table.userId),
  activeIdx: index("idx_family_members_active").on(table.isActive),
  roleIdx: index("idx_family_members_role").on(table.role),
}));

// ============================================================================
// LOYALTY PROGRAM TABLES
// ============================================================================

export const loyaltyPrograms = pgTable("loyalty_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  code: text("code"), // IATA code for airlines
  programType: text("program_type", { enum: ["miles", "points", "cashback"] }).notNull(),
  category: text("category", { enum: ["airline", "hotel", "credit_card", "retail"] }).default("airline").notNull(),
  
  // Visual branding
  logoColor: text("logo_color").default("#3B82F6").notNull(),
  iconUrl: text("icon_url"),
  
  // Point valuation
  pointValue: text("point_value").default("0.01").notNull(), // estimated value per point in BRL
  
  // Transfer configuration
  transferEnabled: boolean("transfer_enabled").default(false).notNull(),
  minTransferAmount: integer("min_transfer_amount"),
  transferFeeType: text("transfer_fee_type", { enum: ["flat", "percentage", "tiered"] }),
  transferFeeAmount: integer("transfer_fee_amount"),
  transferPartners: json("transfer_partners"), // JSON array of partner programs
  
  // Expiration rules
  expirationMonths: integer("expiration_months"),
  extendableOnActivity: boolean("extendable_on_activity").default(false).notNull(),
  
  // Contact information
  website: text("website"),
  phoneNumber: text("phone_number"),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("idx_loyalty_programs_name").on(table.name),
  companyIdx: index("idx_loyalty_programs_company").on(table.company),
  codeIdx: index("idx_loyalty_programs_code").on(table.code),
  categoryIdx: index("idx_loyalty_programs_category").on(table.category),
  activeIdx: index("idx_loyalty_programs_active").on(table.isActive),
  transferEnabledIdx: index("idx_loyalty_programs_transfer_enabled").on(table.transferEnabled),
}));

export const memberPrograms = pgTable("member_programs", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => familyMembers.id).notNull(),
  programId: integer("program_id").references(() => loyaltyPrograms.id).notNull(),
  
  // Account credentials (encrypted)
  accountNumber: text("account_number"),
  login: text("login"),
  // These will be encrypted before storage
  sitePasswordEncrypted: text("site_password_encrypted"),
  milesPasswordEncrypted: text("miles_password_encrypted"),
  
  // Member details
  cpf: text("cpf"),
  pointsBalance: integer("points_balance").default(0).notNull(),
  eliteTier: text("elite_tier"),
  statusLevel: text("status_level", { 
    enum: ["basic", "silver", "gold", "platinum", "diamond"] 
  }).default("basic").notNull(),
  
  // Financial tracking
  yearlyEarnings: integer("yearly_earnings").default(0).notNull(),
  yearlySpending: integer("yearly_spending").default(0).notNull(),
  estimatedValue: text("estimated_value"),
  
  // Metadata
  notes: text("notes"),
  customFields: json("custom_fields"),
  expirationDate: timestamp("expiration_date"),
  
  // Audit trail
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  lastUpdatedBy: integer("last_updated_by").references(() => users.id),
  
  // Status
  isActive: boolean("is_active").default(true).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  memberIdIdx: index("idx_member_programs_member_id").on(table.memberId),
  programIdIdx: index("idx_member_programs_program_id").on(table.programId),
  activeIdx: index("idx_member_programs_active").on(table.isActive),
  statusLevelIdx: index("idx_member_programs_status_level").on(table.statusLevel),
  expirationIdx: index("idx_member_programs_expiration").on(table.expirationDate),
  pointsBalanceIdx: index("idx_member_programs_points_balance").on(table.pointsBalance),
  // Unique constraint to prevent duplicate program memberships
  memberProgramUniqueIdx: uniqueIndex("idx_member_programs_unique").on(table.memberId, table.programId),
}));

// ============================================================================
// TRANSACTION & ACTIVITY TABLES
// ============================================================================

export const mileTransactions = pgTable("mile_transactions", {
  id: serial("id").primaryKey(),
  memberProgramId: integer("member_program_id").references(() => memberPrograms.id).notNull(),
  miles: integer("miles").notNull(), // positive for earned, negative for redeemed
  description: text("description").notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  expirationDate: timestamp("expiration_date"),
  source: text("source", { 
    enum: ["flight", "credit_card", "shopping", "transfer", "bonus", "correction", "other"] 
  }).notNull(),
  referenceNumber: text("reference_number"),
  recordedBy: integer("recorded_by").references(() => users.id),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  memberProgramIdIdx: index("idx_mile_transactions_member_program_id").on(table.memberProgramId),
  transactionDateIdx: index("idx_mile_transactions_transaction_date").on(table.transactionDate),
  expirationDateIdx: index("idx_mile_transactions_expiration_date").on(table.expirationDate),
  sourceIdx: index("idx_mile_transactions_source").on(table.source),
  milesIdx: index("idx_mile_transactions_miles").on(table.miles),
}));

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Who performed the action
  memberId: integer("member_id").references(() => familyMembers.id), // Whose data was affected
  action: text("action").notNull(),
  category: text("category", { 
    enum: ["auth", "security", "miles", "account", "general"] 
  }).default("general").notNull(),
  description: text("description").notNull(),
  metadata: json("metadata"),
  
  // Timestamps
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_activity_log_user_id").on(table.userId),
  memberIdIdx: index("idx_activity_log_member_id").on(table.memberId),
  categoryIdx: index("idx_activity_log_category").on(table.category),
  timestampIdx: index("idx_activity_log_timestamp").on(table.timestamp),
  actionIdx: index("idx_activity_log_action").on(table.action),
}));

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Email preferences
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  emailFrequency: text("email_frequency", { 
    enum: ["daily", "weekly", "monthly"] 
  }).default("weekly").notNull(),
  
  // Alert settings
  expirationAlertDays: integer("expiration_alert_days").default(90).notNull(),
  
  // Other channels
  whatsappEnabled: boolean("whatsapp_enabled").default(false).notNull(),
  whatsappNumber: text("whatsapp_number"),
  pushEnabled: boolean("push_enabled").default(false).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdUniqueIdx: uniqueIndex("idx_notification_preferences_user_id_unique").on(table.userId),
  emailEnabledIdx: index("idx_notification_preferences_email_enabled").on(table.emailEnabled),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const familiesRelations = relations(families, ({ many }) => ({
  users: many(users),
  familyMembers: many(familyMembers),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  family: one(families, { fields: [users.familyId], references: [families.id] }),
  familyMember: one(familyMembers, { fields: [users.id], references: [familyMembers.userId] }),
  activityLogs: many(activityLog),
  notificationPreferences: one(notificationPreferences),
}));

export const familyMembersRelations = relations(familyMembers, ({ one, many }) => ({
  family: one(families, { fields: [familyMembers.familyId], references: [families.id] }),
  user: one(users, { fields: [familyMembers.userId], references: [users.id] }),
  programs: many(memberPrograms),
}));

export const loyaltyProgramsRelations = relations(loyaltyPrograms, ({ many }) => ({
  memberPrograms: many(memberPrograms),
}));

export const memberProgramsRelations = relations(memberPrograms, ({ one, many }) => ({
  member: one(familyMembers, { fields: [memberPrograms.memberId], references: [familyMembers.id] }),
  program: one(loyaltyPrograms, { fields: [memberPrograms.programId], references: [loyaltyPrograms.id] }),
  transactions: many(mileTransactions),
  lastUpdatedByUser: one(users, { fields: [memberPrograms.lastUpdatedBy], references: [users.id] }),
}));

export const mileTransactionsRelations = relations(mileTransactions, ({ one }) => ({
  memberProgram: one(memberPrograms, { fields: [mileTransactions.memberProgramId], references: [memberPrograms.id] }),
  recordedByUser: one(users, { fields: [mileTransactions.recordedBy], references: [users.id] }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  user: one(users, { fields: [activityLog.userId], references: [users.id] }),
  member: one(familyMembers, { fields: [activityLog.memberId], references: [familyMembers.id] }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] }),
}));

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  name: z.string().min(1).max(255),
  role: z.enum(["member", "staff", "admin"]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  passwordChangedAt: true,
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers, {
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: z.enum(["primary", "extended", "view_only"]),
  cpf: z.string().regex(/^\d{11}$/, "CPF must be 11 digits").optional(),
  phone: z.string().min(10).max(20).optional(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyProgramSchema = createInsertSchema(loyaltyPrograms, {
  name: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  programType: z.enum(["miles", "points", "cashback"]),
  category: z.enum(["airline", "hotel", "credit_card", "retail"]),
  website: z.string().url().optional(),
  phoneNumber: z.string().min(10).max(20).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMemberProgramSchema = createInsertSchema(memberPrograms, {
  accountNumber: z.string().min(1).max(100).optional(),
  cpf: z.string().regex(/^\d{11}$/, "CPF must be 11 digits").optional(),
  pointsBalance: z.number().int().min(0),
  yearlyEarnings: z.number().int().min(0),
  yearlySpending: z.number().int().min(0),
}).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
  sitePasswordEncrypted: true,
  milesPasswordEncrypted: true,
});

export const insertMileTransactionSchema = createInsertSchema(mileTransactions, {
  miles: z.number().int(),
  description: z.string().min(1).max(500),
  source: z.enum(["flight", "credit_card", "shopping", "transfer", "bonus", "correction", "other"]),
}).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog, {
  action: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  category: z.enum(["auth", "security", "miles", "account", "general"]),
}).omit({
  id: true,
  timestamp: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences, {
  emailFrequency: z.enum(["daily", "weekly", "monthly"]),
  expirationAlertDays: z.number().int().min(1).max(365),
  whatsappNumber: z.string().min(10).max(20).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = Partial<InsertUser>;

export type Family = typeof families.$inferSelect;
export type InsertFamily = typeof families.$inferInsert;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type UpdateFamilyMember = Partial<InsertFamilyMember>;

export type LoyaltyProgram = typeof loyaltyPrograms.$inferSelect;
export type InsertLoyaltyProgram = z.infer<typeof insertLoyaltyProgramSchema>;
export type UpdateLoyaltyProgram = Partial<InsertLoyaltyProgram>;

export type MemberProgram = typeof memberPrograms.$inferSelect;
export type InsertMemberProgram = z.infer<typeof insertMemberProgramSchema>;
export type UpdateMemberProgram = Partial<InsertMemberProgram>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type MileTransaction = typeof mileTransactions.$inferSelect;
export type InsertMileTransaction = z.infer<typeof insertMileTransactionSchema>;

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type UpdateNotificationPreferences = Partial<InsertNotificationPreferences>;

// ============================================================================
// EXTENDED TYPES FOR API RESPONSES
// ============================================================================

export type MemberWithPrograms = FamilyMember & {
  programs: (MemberProgram & { program: LoyaltyProgram })[];
  totalPoints: number;
  estimatedValue: string;
};

export type ProgramWithMember = MemberProgram & {
  program: LoyaltyProgram;
  member: FamilyMember;
};

export type TransactionWithDetails = MileTransaction & {
  memberProgram: MemberProgram & { program: LoyaltyProgram; member: FamilyMember };
  recordedByUser?: User;
};

export type DashboardStats = {
  totalMembers: number;
  activePrograms: number;
  totalPoints: number;
  estimatedValue: string;
  expiringPoints: number;
  recentTransactions: number;
};

export type FamilyOverview = Family & {
  members: FamilyMember[];
  totalPrograms: number;
  totalPoints: number;
  estimatedValue: string;
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ProgramType = "miles" | "points" | "cashback";
export type ProgramCategory = "airline" | "hotel" | "credit_card" | "retail";
export type UserRole = "member" | "staff" | "admin";
export type FamilyMemberRole = "primary" | "extended" | "view_only";
export type TransactionSource = "flight" | "credit_card" | "shopping" | "transfer" | "bonus" | "correction" | "other";
export type ActivityCategory = "auth" | "security" | "miles" | "account" | "general";
export type NotificationFrequency = "daily" | "weekly" | "monthly";
export type StatusLevel = "basic" | "silver" | "gold" | "platinum" | "diamond";