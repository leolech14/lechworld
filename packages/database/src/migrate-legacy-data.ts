/**
 * @fileoverview Legacy Data Migration Script
 * @description Migrates data from Supabase export and CSV files to new schema format
 * @security Encrypts all site_password and miles_password fields
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { getDefaultDatabase, encryptionUtils, validateEncryptionSetup } from './index';
import {
  families,
  users,
  familyMembers,
  loyaltyPrograms,
  memberPrograms,
  type InsertUser,
  type InsertFamilyMember,
  type InsertLoyaltyProgram,
  type InsertMemberProgram,
} from './schema';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface LegacyUser {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: string;
}

interface LegacyFamilyMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  cpf: string | null;
  birthdate: string | null;
  frame_color: string;
  frame_border_color: string;
  profile_emoji: string;
}

interface LegacyLoyaltyProgram {
  id: number;
  name: string;
  company: string;
  logo_color: string;
  website: string | null;
  created_at: string;
}

interface LegacyMemberProgram {
  id: number;
  member_id: number;
  program_id: number;
  account_number: string;
  login: string;
  password: string | null;
  cpf: string | null;
  points_balance: number;
  elite_tier: string | null;
  is_active: boolean;
  notes: string | null;
  custom_fields: Record<string, any>;
  last_updated: string;
}

interface LegacyData {
  users: LegacyUser[];
  family_members: LegacyFamilyMember[];
  loyalty_programs: LegacyLoyaltyProgram[];
  member_programs: LegacyMemberProgram[];
}

interface CSVRow {
  airline: string;
  name: string;
  status: string;
  account: string;
  site_password: string;
  miles_password: string;
  miles: string;
  updated: string;
  notes: string;
  password: string;
}

// ============================================================================
// MIGRATION CLASS
// ============================================================================

class LegacyDataMigrator {
  private db: any;
  private legacyDataPath = '/Users/lech/lechworld/legacy/supabase-export.json';
  private csvDataPath = '/Users/lech/lechworld/legacy/loyalty_programs_data.csv';
  private familyId: number = 1; // Main family ID

  // User mapping: name -> new user ID
  private userMapping = new Map<string, number>([
    ['Leonardo', 7],
    ['Graciela', 8],
    ['Osvandré', 9],
    ['Marilise', 10],
    ['Denise', 11],
  ]);

  private csvPasswordData = new Map<string, { site_password?: string; miles_password?: string; notes?: string }>();

  constructor() {
    this.db = getDefaultDatabase();
  }

  /**
   * Main migration function
   */
  async migrate(): Promise<void> {
    console.log('🚀 Starting legacy data migration...\n');

    try {
      // Validate encryption setup
      if (!validateEncryptionSetup()) {
        throw new Error('Encryption setup validation failed. Please check ENCRYPTION_KEY environment variable.');
      }
      console.log('✅ Encryption setup validated');

      // Connect to database
      const database = await this.db.connect();
      
      // Load data sources
      const legacyData = await this.loadLegacyData();
      await this.loadCSVData();
      
      console.log(`📊 Loaded ${legacyData.users.length} users from JSON`);
      console.log(`📊 Loaded ${this.csvPasswordData.size} accounts from CSV\n`);

      // Execute migration steps
      await this.createFamily(database);
      await this.migrateUsers(database, legacyData.users);
      await this.migrateFamilyMembers(database, legacyData.family_members);
      await this.migrateLoyaltyPrograms(database, legacyData.loyalty_programs);
      await this.migrateMemberPrograms(database, legacyData.member_programs);

      console.log('\n🎉 Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      await this.db.disconnect();
    }
  }

  /**
   * Load legacy JSON data
   */
  private async loadLegacyData(): Promise<LegacyData> {
    try {
      const data = fs.readFileSync(this.legacyDataPath, 'utf8');
      return JSON.parse(data) as LegacyData;
    } catch (error) {
      throw new Error(`Failed to load legacy data from ${this.legacyDataPath}: ${error}`);
    }
  }

  /**
   * Load CSV data for password mapping
   */
  private async loadCSVData(): Promise<void> {
    try {
      const csvContent = fs.readFileSync(this.csvDataPath, 'utf8');
      const records: CSVRow[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
      });

      // Build password mapping based on account numbers
      for (const row of records) {
        const key = `${row.name.toUpperCase()}-${row.account}`;
        this.csvPasswordData.set(key, {
          site_password: row.site_password && row.site_password !== '?' ? row.site_password : undefined,
          miles_password: row.miles_password && row.miles_password !== '?' ? row.miles_password : undefined,
          notes: row.notes || row.password ? `CSV notes: ${row.notes || ''} ${row.password || ''}`.trim() : undefined,
        });
      }

      console.log(`📋 CSV password data loaded: ${this.csvPasswordData.size} entries`);
    } catch (error) {
      throw new Error(`Failed to load CSV data from ${this.csvDataPath}: ${error}`);
    }
  }

  /**
   * Create the main family
   */
  private async createFamily(database: any): Promise<void> {
    console.log('👨‍👩‍👧‍👦 Creating family...');
    
    try {
      await database.insert(families).values({
        id: this.familyId,
        name: 'Lech Family',
      }).onConflictDoNothing();
      
      console.log('✅ Family created/verified');
    } catch (error) {
      console.error('❌ Failed to create family:', error);
      throw error;
    }
  }

  /**
   * Migrate users with name-only authentication
   */
  private async migrateUsers(database: any, legacyUsers: LegacyUser[]): Promise<void> {
    console.log('👤 Migrating users...');

    const targetUsers = legacyUsers.filter(user => this.userMapping.has(user.name));
    
    for (const legacyUser of targetUsers) {
      const newUserId = this.userMapping.get(legacyUser.name);
      if (!newUserId) continue;

      const userData: InsertUser = {
        username: legacyUser.name.toLowerCase(),
        email: legacyUser.email,
        // Keep first name only for authentication (case insensitive)
        name: legacyUser.name,
        role: 'member' as const,
        familyId: this.familyId,
        // No password hash - using name-only auth as specified
        passwordHash: null,
        isFirstLogin: false, // These are existing users
      };

      try {
        await database.insert(users).values({ ...userData, id: newUserId }).onConflictDoNothing();
        console.log(`✅ User migrated: ${legacyUser.name} (ID: ${newUserId})`);
      } catch (error) {
        console.error(`❌ Failed to migrate user ${legacyUser.name}:`, error);
        throw error;
      }
    }
  }

  /**
   * Migrate family members and map to users
   */
  private async migrateFamilyMembers(database: any, legacyMembers: LegacyFamilyMember[]): Promise<void> {
    console.log('👪 Migrating family members...');

    for (const legacyMember of legacyMembers) {
      // Map family member to corresponding user
      const correspondingUserId = this.userMapping.get(legacyMember.name);

      const memberData: InsertFamilyMember = {
        name: legacyMember.name,
        email: legacyMember.email,
        role: 'primary' as const, // All legacy members are primary
        userId: correspondingUserId || null,
        familyId: this.familyId,
        isActive: true,
        cpf: legacyMember.cpf,
        phone: legacyMember.phone,
        birthdate: legacyMember.birthdate,
        frameColor: legacyMember.frame_color,
        frameBorderColor: legacyMember.frame_border_color,
        profileEmoji: legacyMember.profile_emoji,
      };

      try {
        await database.insert(familyMembers).values({ ...memberData, id: legacyMember.id }).onConflictDoNothing();
        console.log(`✅ Family member migrated: ${legacyMember.name} (ID: ${legacyMember.id})`);
      } catch (error) {
        console.error(`❌ Failed to migrate family member ${legacyMember.name}:`, error);
        throw error;
      }
    }
  }

  /**
   * Migrate loyalty programs
   */
  private async migrateLoyaltyPrograms(database: any, legacyPrograms: LegacyLoyaltyProgram[]): Promise<void> {
    console.log('🛫 Migrating loyalty programs...');

    for (const legacyProgram of legacyPrograms) {
      const programData: InsertLoyaltyProgram = {
        name: legacyProgram.name,
        company: legacyProgram.company,
        programType: 'miles' as const, // Most are airline miles programs
        category: this.determineProgramCategory(legacyProgram.name),
        logoColor: legacyProgram.logo_color,
        website: legacyProgram.website,
        isActive: true,
      };

      try {
        await database.insert(loyaltyPrograms).values({ ...programData, id: legacyProgram.id }).onConflictDoNothing();
        console.log(`✅ Loyalty program migrated: ${legacyProgram.name} (ID: ${legacyProgram.id})`);
      } catch (error) {
        console.error(`❌ Failed to migrate loyalty program ${legacyProgram.name}:`, error);
        throw error;
      }
    }
  }

  /**
   * Migrate member programs with password encryption
   */
  private async migrateMemberPrograms(database: any, legacyMemberPrograms: LegacyMemberProgram[]): Promise<void> {
    console.log('🎫 Migrating member programs...');

    for (const legacyProgram of legacyMemberPrograms) {
      // Get member name for CSV lookup
      const memberName = await this.getMemberName(database, legacyProgram.member_id);
      if (!memberName) {
        console.warn(`⚠️ Could not find member name for member ID ${legacyProgram.member_id}`);
        continue;
      }

      // Try to get additional password data from CSV
      const csvKey = `${memberName.toUpperCase()}-${legacyProgram.account_number}`;
      const csvData = this.csvPasswordData.get(csvKey);

      // Extract passwords from legacy data and CSV
      const sitePassword = this.extractPassword(legacyProgram, 'site_password', csvData?.site_password);
      const milesPassword = this.extractPassword(legacyProgram, 'miles_password', csvData?.miles_password);
      
      // Encrypt passwords
      const encryptedData = encryptionUtils.encryptMemberProgramData({
        sitePassword,
        milesPassword,
      });

      // Combine notes from legacy and CSV
      const combinedNotes = this.combineNotes(legacyProgram.notes, csvData?.notes);

      const memberProgramData: InsertMemberProgram = {
        memberId: legacyProgram.member_id,
        programId: legacyProgram.program_id,
        accountNumber: legacyProgram.account_number,
        login: legacyProgram.login,
        cpf: legacyProgram.cpf,
        pointsBalance: legacyProgram.points_balance,
        eliteTier: legacyProgram.elite_tier,
        statusLevel: this.mapStatusLevel(legacyProgram.elite_tier),
        notes: combinedNotes,
        customFields: legacyProgram.custom_fields,
        isActive: legacyProgram.is_active,
        lastUpdatedBy: this.userMapping.get(memberName) || null,
      };

      try {
        await database.insert(memberPrograms).values({
          ...memberProgramData,
          id: legacyProgram.id,
          sitePasswordEncrypted: encryptedData.sitePasswordEncrypted,
          milesPasswordEncrypted: encryptedData.milesPasswordEncrypted,
        }).onConflictDoNothing();

        console.log(`✅ Member program migrated: ${memberName} - ${await this.getProgramName(database, legacyProgram.program_id)} (ID: ${legacyProgram.id})`);
        if (sitePassword) console.log(`   🔐 Site password encrypted`);
        if (milesPassword) console.log(`   🔐 Miles password encrypted`);
        if (csvData) console.log(`   📋 CSV data merged`);
        
      } catch (error) {
        console.error(`❌ Failed to migrate member program ${legacyProgram.id}:`, error);
        throw error;
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private determineProgramCategory(programName: string): 'airline' | 'hotel' | 'credit_card' | 'retail' {
    const lowerName = programName.toLowerCase();
    
    if (lowerName.includes('accor') || lowerName.includes('hotel')) return 'hotel';
    if (lowerName.includes('card') || lowerName.includes('credit')) return 'credit_card';
    if (lowerName.includes('retail') || lowerName.includes('shop')) return 'retail';
    
    return 'airline'; // Default for most loyalty programs
  }

  private extractPassword(
    legacyProgram: LegacyMemberProgram, 
    fieldName: 'site_password' | 'miles_password',
    csvPassword?: string
  ): string | null {
    // Priority: 1. CSV data, 2. Legacy custom_fields, 3. Legacy main password field
    if (csvPassword) return csvPassword;
    
    const customFieldPassword = legacyProgram.custom_fields?.[fieldName];
    if (customFieldPassword && customFieldPassword !== '?') return customFieldPassword;
    
    // For legacy compatibility, try the main password field as fallback
    if (fieldName === 'site_password' && legacyProgram.password) return legacyProgram.password;
    
    return null;
  }

  private combineNotes(legacyNotes?: string | null, csvNotes?: string): string | null {
    const notes: string[] = [];
    
    if (legacyNotes) notes.push(`Legacy: ${legacyNotes}`);
    if (csvNotes) notes.push(`CSV: ${csvNotes}`);
    
    return notes.length > 0 ? notes.join(' | ') : null;
  }

  private mapStatusLevel(eliteTier?: string | null): 'basic' | 'silver' | 'gold' | 'platinum' | 'diamond' {
    if (!eliteTier) return 'basic';
    
    const tier = eliteTier.toLowerCase();
    if (tier.includes('diamond') || tier.includes('diamante')) return 'diamond';
    if (tier.includes('platinum')) return 'platinum';
    if (tier.includes('gold') || tier.includes('ouro')) return 'gold';
    if (tier.includes('silver') || tier.includes('prata') || tier.includes('safira')) return 'silver';
    
    return 'basic';
  }

  private async getMemberName(database: any, memberId: number): Promise<string | null> {
    try {
      const result = await database.select({ name: familyMembers.name })
        .from(familyMembers)
        .where({ id: memberId })
        .limit(1);
      
      return result[0]?.name || null;
    } catch (error) {
      console.error(`Error getting member name for ID ${memberId}:`, error);
      return null;
    }
  }

  private async getProgramName(database: any, programId: number): Promise<string> {
    try {
      const result = await database.select({ name: loyaltyPrograms.name })
        .from(loyaltyPrograms)
        .where({ id: programId })
        .limit(1);
      
      return result[0]?.name || 'Unknown Program';
    } catch (error) {
      console.error(`Error getting program name for ID ${programId}:`, error);
      return 'Unknown Program';
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const migrator = new LegacyDataMigrator();
  
  try {
    await migrator.migrate();
    process.exit(0);
  } catch (error) {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { LegacyDataMigrator };