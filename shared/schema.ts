/**
 * @purpose Database schema definitions and TypeScript types for all entities
 * @connects-to server/storage.ts
 * @connects-to server/routes.ts
 * @connects-to client/src/store/auth-store.ts
 * @connects-to client/src/components/members-table.tsx
 * @connects-to client/src/components/edit-member-modal.tsx
 * @connects-to client/src/components/new-member-modal.tsx
 * @connects-to client/src/components/edit-program-modal.tsx
 * @connects-to client/src/components/new-program-modal.tsx
 */
import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const families = pgTable("families", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // case-insensitive in DB
  email: text("email").notNull().unique(),
  password: text("password"), // nullable for first-time login
  name: text("name").notNull(),
  role: text("role").notNull().default("member"), // member, staff
  familyId: integer("family_id").references(() => families.id),
  
  // Login tracking
  isFirstLogin: boolean("is_first_login").default(true),
  lastLogin: timestamp("last_login"),
  passwordChangedAt: timestamp("password_changed_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // primary, extended, view_only
  userId: integer("user_id").references(() => users.id),
  familyId: integer("family_id").references(() => families.id),
  isActive: boolean("is_active").default(true),
  // New profile fields
  cpf: text("cpf"),
  phone: text("phone"),
  birthdate: text("birthdate"),
  frameColor: text("frame_color").default("#FED7E2"),
  frameBorderColor: text("frame_border_color").default("#F687B3"),
  profileEmoji: text("profile_emoji").default("👤"),
});

export const loyaltyPrograms = pgTable("loyalty_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  code: text("code"), // IATA code for airlines
  programType: text("program_type").notNull(), // miles, points, cashback
  logoColor: text("logo_color").default("#3B82F6"),
  transferPartners: json("transfer_partners"), // JSON array of partner programs
  pointValue: text("point_value").default("0.01"), // estimated value per point in BRL
  category: text("category").default("airline"), // airline, hotel, credit_card, retail
  website: text("website"),
  phoneNumber: text("phone_number"),
  
  // Transfer rules
  transferEnabled: boolean("transfer_enabled").default(false),
  minTransferAmount: integer("min_transfer_amount"),
  transferFeeType: text("transfer_fee_type"), // 'flat', 'percentage', 'tiered'
  transferFeeAmount: integer("transfer_fee_amount"),
  
  // Expiration rules
  expirationMonths: integer("expiration_months"),
  extendableOnActivity: boolean("extendable_on_activity").default(false),
  
  isActive: boolean("is_active").default(true),
  iconUrl: text("icon_url"), // Custom icon URL
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const memberPrograms = pgTable("member_programs", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => familyMembers.id),
  programId: integer("program_id").references(() => loyaltyPrograms.id),
  accountNumber: text("account_number"),
  login: text("login"),
  sitePassword: text("site_password"), // Website password
  milesPassword: text("miles_password"), // PIN or miles-specific password
  cpf: text("cpf"),
  pointsBalance: integer("points_balance").default(0),
  eliteTier: text("elite_tier"),
  notes: text("notes"),
  customFields: json("custom_fields"),
  estimatedValue: text("estimated_value"),
  expirationDate: timestamp("expiration_date"),
  statusLevel: text("status_level").default("basic"), // basic, silver, gold, platinum
  yearlyEarnings: integer("yearly_earnings").default(0),
  yearlySpending: integer("yearly_spending").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  lastUpdatedBy: integer("last_updated_by").references(() => users.id), // Track who made changes
  isActive: boolean("is_active").default(true),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(), // Who performed the action
  memberId: integer("member_id").references(() => familyMembers.id), // Whose data was affected
  action: text("action").notNull(),
  category: text("category").default("general"), // auth, security, miles, account
  description: text("description").notNull(),
  metadata: json("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Miles transactions - Track earning and redemption
export const mileTransactions = pgTable("mile_transactions", {
  id: serial("id").primaryKey(),
  memberProgramId: integer("member_program_id").references(() => memberPrograms.id).notNull(),
  miles: integer("miles").notNull(), // positive for earned, negative for redeemed
  description: text("description").notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  expirationDate: timestamp("expiration_date"),
  source: text("source").notNull(), // 'flight', 'credit_card', 'shopping', 'transfer', 'other'
  referenceNumber: text("reference_number"),
  recordedBy: integer("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  emailEnabled: boolean("email_enabled").default(true),
  emailFrequency: text("email_frequency").default("weekly"), // 'daily', 'weekly', 'monthly'
  expirationAlertDays: integer("expiration_alert_days").default(90),
  whatsappEnabled: boolean("whatsapp_enabled").default(false),
  whatsappNumber: text("whatsapp_number"),
  pushEnabled: boolean("push_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembers).omit({
  id: true,
});

export const insertLoyaltyProgramSchema = createInsertSchema(loyaltyPrograms).omit({
  id: true,
});

export const insertMemberProgramSchema = createInsertSchema(memberPrograms).omit({
  id: true,
  lastUpdated: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  timestamp: true,
});

export const insertMileTransactionSchema = createInsertSchema(mileTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Family = typeof families.$inferSelect;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;

export type LoyaltyProgram = typeof loyaltyPrograms.$inferSelect;
export type InsertLoyaltyProgram = z.infer<typeof insertLoyaltyProgramSchema>;

export type MemberProgram = typeof memberPrograms.$inferSelect;
export type InsertMemberProgram = z.infer<typeof insertMemberProgramSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type MileTransaction = typeof mileTransactions.$inferSelect;
export type InsertMileTransaction = z.infer<typeof insertMileTransactionSchema>;

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

// Extended types for API responses
export type MemberWithPrograms = FamilyMember & {
  programs: (MemberProgram & { program: LoyaltyProgram })[];
};

export type DashboardStats = {
  totalMembers: number;
  activePrograms: number;
  totalPoints: number;
  estimatedValue: string;
};
