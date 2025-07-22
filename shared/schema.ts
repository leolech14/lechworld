import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("member"), // admin, member
  createdAt: timestamp("created_at").defaultNow(),
});

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(), // primary, extended, view_only
  userId: integer("user_id").references(() => users.id),
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
  programType: text("program_type").notNull(), // miles, points, cashback
  logoColor: text("logo_color").default("#3B82F6"),
  transferPartners: json("transfer_partners"), // JSON array of partner programs
  pointValue: text("point_value").default("0.01"), // estimated value per point
  category: text("category").default("airline"), // airline, hotel, credit_card, retail
  website: text("website"),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").default(true),
});

export const memberPrograms = pgTable("member_programs", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => familyMembers.id),
  programId: integer("program_id").references(() => loyaltyPrograms.id),
  accountNumber: text("account_number"),
  loginCredentials: text("login_credentials"), // encrypted JSON
  pointsBalance: integer("points_balance").default(0),
  estimatedValue: text("estimated_value"),
  expirationDate: timestamp("expiration_date"),
  statusLevel: text("status_level").default("basic"), // basic, silver, gold, platinum
  yearlyEarnings: integer("yearly_earnings").default(0),
  yearlySpending: integer("yearly_spending").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  description: text("description").notNull(),
  metadata: json("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FamilyMember = typeof familyMembers.$inferSelect;
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;

export type LoyaltyProgram = typeof loyaltyPrograms.$inferSelect;
export type InsertLoyaltyProgram = z.infer<typeof insertLoyaltyProgramSchema>;

export type MemberProgram = typeof memberPrograms.$inferSelect;
export type InsertMemberProgram = z.infer<typeof insertMemberProgramSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

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
