import { pgTable, serial, text, integer, timestamp, date, boolean, json, uniqueIndex, index, decimal } from 'drizzle-orm/pg-core';
import { InferModel } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').unique(),
  email: text('email').notNull().unique(),
  password: text('password'), // nullable for first-time login
  name: text('name').notNull(),
  role: text('role').default('member'),
  familyMemberId: integer('family_member_id'),
  isFirstLogin: boolean('is_first_login').default(true),
  lastLogin: timestamp('last_login'),
  passwordChangedAt: timestamp('password_changed_at'),
  failedLoginAttempts: integer('failed_login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Airline programs table
export const airlines = pgTable('airlines', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(), // IATA code (e.g., 'AA', 'UA', 'DL')
  name: text('name').notNull(),
  programName: text('program_name').notNull(), // e.g., 'AAdvantage', 'MileagePlus'
  transferEnabled: boolean('transfer_enabled').default(false),
  minTransferAmount: integer('min_transfer_amount'),
  transferFeeType: text('transfer_fee_type'), // 'flat', 'percentage', 'tiered'
  transferFeeAmount: integer('transfer_fee_amount'),
  transferFeePoints: integer('transfer_fee_points'),
  transferDelayHours: integer('transfer_delay_hours').default(0),
  expirationMonths: integer('expiration_months'), // null if no expiration
  extendableOnActivity: boolean('extendable_on_activity').default(false),
  googleWalletSupported: boolean('google_wallet_supported').default(false),
  mileValueBrl: decimal('mile_value_brl', { precision: 10, scale: 6 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Family members table
export const familyMembers = pgTable('family_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  profilePhoto: text('profile_photo'),
  color: text('color').default('#3b82f6'),
  role: text('role').default('member'), // 'primary', 'extended', 'viewer'
  // Personal information fields
  cpf: text('cpf'),
  phone: text('phone'),
  birthdate: text('birthdate'),
  // Appearance fields
  frameColor: text('frame_color').default('#FED7E2'),
  frameBorderColor: text('frame_border_color').default('#F687B3'),
  profileEmoji: text('profile_emoji').default('👤'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Member loyalty programs
export const memberPrograms = pgTable('member_programs', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').references(() => familyMembers.id).notNull(),
  airlineId: integer('airline_id').references(() => airlines.id).notNull(),
  memberNumber: text('member_number').notNull(),
  statusLevel: text('status_level'), // 'Basic', 'Silver', 'Gold', 'Platinum', etc.
  currentMiles: integer('current_miles').default(0).notNull(),
  lifetimeMiles: integer('lifetime_miles').default(0),
  pinCiphertext: text('pin_ciphertext'),
  pinNonce: text('pin_nonce'),
  documentNumber: text('document_number'), // CPF/RUT/DNI
  documentType: text('document_type'), // Type of document
  googleWalletEnabled: boolean('google_wallet_enabled').default(false),
  lastSyncDate: timestamp('last_sync_date'),
  syncMethod: text('sync_method'), // 'manual', 'email', 'api', 'wallet'
  accountPasswordCiphertext: text('account_password_ciphertext'),
  accountPasswordNonce: text('account_password_nonce'),
  customFields: json('custom_fields').$type<Array<{id: string, label: string, value: string}>>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueMemberProgram: uniqueIndex('unique_member_program').on(table.memberId, table.airlineId),
}));

// Mile transactions
export const mileTransactions = pgTable('mile_transactions', {
  id: serial('id').primaryKey(),
  memberProgramId: integer('member_program_id').references(() => memberPrograms.id).notNull(),
  miles: integer('miles').notNull(), // positive for earned, negative for redeemed
  description: text('description').notNull(),
  transactionDate: date('transaction_date').notNull(),
  expirationDate: date('expiration_date'),
  source: text('source').notNull(), // 'flight', 'credit_card', 'shopping', 'transfer', 'other'
  referenceNumber: text('reference_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  idxMemberProgram: index('idx_member_program').on(table.memberProgramId),
  idxExpiration: index('idx_expiration').on(table.expirationDate),
}));

// Activity log
export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  action: text('action').notNull(),
  description: text('description').notNull(),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  idxUser: index('idx_user_activity').on(table.userId),
  idxCreatedAt: index('idx_activity_created').on(table.createdAt),
}));

// Notification preferences
export const notificationPreferences = pgTable('notification_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  emailEnabled: boolean('email_enabled').default(true),
  emailFrequency: text('email_frequency').default('weekly'), // 'daily', 'weekly', 'monthly'
  expirationAlertDays: integer('expiration_alert_days').default(90),
  whatsappEnabled: boolean('whatsapp_enabled').default(false),
  whatsappNumber: text('whatsapp_number'),
  pushEnabled: boolean('push_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type User = InferModel<typeof users>;
export type Airline = InferModel<typeof airlines>;
export type FamilyMember = InferModel<typeof familyMembers>;
export type MemberProgram = InferModel<typeof memberPrograms>;
export type MileTransaction = InferModel<typeof mileTransactions>;
export type ActivityLog = InferModel<typeof activityLog>;
export type NotificationPreferences = InferModel<typeof notificationPreferences>;