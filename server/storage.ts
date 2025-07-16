import { 
  users, familyMembers, loyaltyPrograms, memberPrograms, activityLog,
  type User, type InsertUser,
  type FamilyMember, type InsertFamilyMember,
  type LoyaltyProgram, type InsertLoyaltyProgram,
  type MemberProgram, type InsertMemberProgram,
  type ActivityLog, type InsertActivityLog,
  type MemberWithPrograms, type DashboardStats
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Family member methods
  getFamilyMembers(userId: number): Promise<FamilyMember[]>;
  getFamilyMember(id: number): Promise<FamilyMember | undefined>;
  createFamilyMember(member: InsertFamilyMember): Promise<FamilyMember>;
  updateFamilyMember(id: number, member: Partial<FamilyMember>): Promise<FamilyMember>;
  deleteFamilyMember(id: number): Promise<void>;
  
  // Loyalty program methods
  getLoyaltyPrograms(): Promise<LoyaltyProgram[]>;
  getLoyaltyProgram(id: number): Promise<LoyaltyProgram | undefined>;
  createLoyaltyProgram(program: InsertLoyaltyProgram): Promise<LoyaltyProgram>;
  updateLoyaltyProgram(id: number, program: Partial<LoyaltyProgram>): Promise<LoyaltyProgram>;
  deleteLoyaltyProgram(id: number): Promise<void>;
  
  // Member program methods
  getMemberPrograms(memberId: number): Promise<(MemberProgram & { program: LoyaltyProgram })[]>;
  getMemberProgram(id: number): Promise<MemberProgram | undefined>;
  createMemberProgram(memberProgram: InsertMemberProgram): Promise<MemberProgram>;
  updateMemberProgram(id: number, memberProgram: Partial<MemberProgram>): Promise<MemberProgram>;
  deleteMemberProgram(id: number): Promise<void>;
  
  // Member program field updates
  updateMemberProgramFields(memberId: number, companyId: string, fields: Record<string, any>): Promise<{ message: string; changes: string[] }>;
  updateMemberProgramCustomFields(memberId: number, companyId: string, customFields: Record<string, string>): Promise<{ message: string }>;
  
  // Dashboard methods
  getDashboardStats(userId: number): Promise<DashboardStats>;
  getMembersWithPrograms(userId: number): Promise<MemberWithPrograms[]>;
  
  // Activity log methods
  logActivity(activity: InsertActivityLog): Promise<ActivityLog>;
  getActivityLog(userId: number, limit?: number): Promise<ActivityLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private familyMembers: Map<number, FamilyMember> = new Map();
  private loyaltyPrograms: Map<number, LoyaltyProgram> = new Map();
  private memberPrograms: Map<number, MemberProgram> = new Map();
  private activityLogs: Map<number, ActivityLog> = new Map();
  private currentIds = {
    user: 1,
    familyMember: 1,
    loyaltyProgram: 1,
    memberProgram: 1,
    activityLog: 1,
  };

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create admin user
    const adminUser: User = {
      id: this.currentIds.user++,
      email: "lech",
      password: "world",
      name: "Leonardo",
      role: "admin",
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create default loyalty programs
    const programs: LoyaltyProgram[] = [
      {
        id: this.currentIds.loyaltyProgram++,
        name: "Latam Pass",
        company: "LATAM Airlines",
        programType: "miles",
        logoColor: "#E53E3E",
        transferPartners: ["Azul", "Gol", "Delta"],
        pointValue: "0.015",
        category: "airline",
        website: "https://www.latampass.com",
        phoneNumber: "0800-570-5700",
        isActive: true,
      },
      {
        id: this.currentIds.loyaltyProgram++,
        name: "Azul",
        company: "Azul Airlines",
        programType: "points",
        logoColor: "#2563EB",
        transferPartners: ["Latam Pass", "Gol Smiles"],
        pointValue: "0.005",
        category: "airline",
        website: "https://www.tudoazul.com",
        phoneNumber: "4003-1118",
        isActive: true,
      },
      {
        id: this.currentIds.loyaltyProgram++,
        name: "Gol Smiles",
        company: "Gol Airlines",
        programType: "points",
        logoColor: "#EA580C",
        transferPartners: ["Latam Pass", "Azul"],
        pointValue: "0.01",
        category: "airline",
        website: "https://www.smiles.com.br",
        phoneNumber: "0300-115-7001",
        isActive: true,
      },
    ];

    programs.forEach(program => this.loyaltyPrograms.set(program.id, program));

    // Create family members from MilhasLech data
    const members: FamilyMember[] = [
      {
        id: this.currentIds.familyMember++,
        name: "Osvandré",
        email: "osvandre@lech.world",
        role: "primary",
        userId: adminUser.id,
        isActive: true,
      },
      {
        id: this.currentIds.familyMember++,
        name: "Marilise",
        email: "marilise@lech.world",
        role: "primary",
        userId: adminUser.id,
        isActive: true,
      },
      {
        id: this.currentIds.familyMember++,
        name: "Graciela",
        email: "graciela@lech.world",
        role: "primary",
        userId: adminUser.id,
        isActive: true,
      },
      {
        id: this.currentIds.familyMember++,
        name: "Leonardo",
        email: "leonardo@lech.world",
        role: "primary",
        userId: adminUser.id,
        isActive: true,
      },
    ];

    members.forEach(member => this.familyMembers.set(member.id, member));

    // Create member programs for each family member with all three loyalty programs
    const memberPrograms: MemberProgram[] = [];
    
    // Osvandré's programs
    memberPrograms.push(
      {
        id: this.currentIds.memberProgram++,
        memberId: members[0].id, // Osvandré
        programId: programs[0].id, // LATAM Pass
        accountNumber: "123456789",
        loginCredentials: JSON.stringify({ username: "osvandre@latam.com", password: "encrypted_password" }),
        pointsBalance: 45000,
        estimatedValue: "R$ 1.350,00",
        statusLevel: "platinum",
        yearlyEarnings: 25000,
        yearlySpending: 18000,
        expirationDate: new Date("2024-12-31"),
        isActive: true,
        lastUpdated: new Date(),
      },
      {
        id: this.currentIds.memberProgram++,
        memberId: members[0].id, // Osvandré
        programId: programs[1].id, // Azul
        accountNumber: "987654321",
        loginCredentials: JSON.stringify({ username: "osvandre@azul.com.br", password: "encrypted_password" }),
        pointsBalance: 32000,
        estimatedValue: "R$ 640,00",
        statusLevel: "gold",
        yearlyEarnings: 18000,
        yearlySpending: 15000,
        expirationDate: new Date("2024-11-30"),
        isActive: true,
        lastUpdated: new Date(),
      },
      {
        id: this.currentIds.memberProgram++,
        memberId: members[0].id, // Osvandré
        programId: programs[2].id, // Gol Smiles
        accountNumber: "456789123",
        loginCredentials: JSON.stringify({ username: "osvandre@smiles.com.br", password: "encrypted_password" }),
        pointsBalance: 28000,
        estimatedValue: "R$ 420,00",
        statusLevel: "gold",
        yearlyEarnings: 15000,
        yearlySpending: 12000,
        expirationDate: new Date("2024-10-15"),
        isActive: true,
        lastUpdated: new Date(),
      }
    );

    // Marilise's programs
    memberPrograms.push(
      {
        id: this.currentIds.memberProgram++,
        memberId: members[1].id, // Marilise
        programId: programs[0].id, // LATAM Pass
        accountNumber: "234567890",
        loginCredentials: JSON.stringify({ username: "marilise@latam.com", password: "encrypted_password" }),
        pointsBalance: 38000,
        estimatedValue: "R$ 1.140,00",
        statusLevel: "gold",
        yearlyEarnings: 22000,
        yearlySpending: 16000,
        expirationDate: new Date("2024-12-31"),
        isActive: true,
        lastUpdated: new Date(),
      },
      {
        id: this.currentIds.memberProgram++,
        memberId: members[1].id, // Marilise
        programId: programs[1].id, // Azul
        accountNumber: "345678901",
        loginCredentials: JSON.stringify({ username: "marilise@smiles.com.br", password: "encrypted_password" }),
        pointsBalance: 25000,
        estimatedValue: "R$ 500,00",
        statusLevel: "silver",
        yearlyEarnings: 14000,
        yearlySpending: 11000,
        expirationDate: new Date("2024-11-30"),
        isActive: true,
        lastUpdated: new Date(),
      },
      {
        id: this.currentIds.memberProgram++,
        memberId: members[1].id, // Marilise
        programId: programs[2].id, // Gol Smiles
        accountNumber: "567890234",
        loginCredentials: JSON.stringify({ username: "marilise@smiles.com.br", password: "encrypted_password" }),
        pointsBalance: 22000,
        estimatedValue: "R$ 330,00",
        statusLevel: "silver",
        yearlyEarnings: 12000,
        yearlySpending: 9000,
        expirationDate: new Date("2024-10-15"),
        isActive: true,
        lastUpdated: new Date(),
      }
    );

    // Graciela's programs
    memberPrograms.push(
      {
        id: this.currentIds.memberProgram++,
        memberId: members[2].id, // Graciela
        programId: programs[0].id, // LATAM Pass
        accountNumber: "678901345",
        loginCredentials: JSON.stringify({ username: "graciela@latam.com", password: "encrypted_password" }),
        pointsBalance: 18000,
        estimatedValue: "R$ 540,00",
        statusLevel: "silver",
        yearlyEarnings: 10000,
        yearlySpending: 8000,
        expirationDate: new Date("2024-12-31"),
        isActive: true,
        lastUpdated: new Date(),
      },
      {
        id: this.currentIds.memberProgram++,
        memberId: members[2].id, // Graciela
        programId: programs[1].id, // Azul
        accountNumber: "789012456",
        loginCredentials: JSON.stringify({ username: "graciela@azul.com.br", password: "encrypted_password" }),
        pointsBalance: 15000,
        estimatedValue: "R$ 300,00",
        statusLevel: "basic",
        yearlyEarnings: 8000,
        yearlySpending: 6000,
        expirationDate: new Date("2024-11-30"),
        isActive: true,
        lastUpdated: new Date(),
      },
      {
        id: this.currentIds.memberProgram++,
        memberId: members[2].id, // Graciela
        programId: programs[2].id, // Gol Smiles
        accountNumber: "890123567",
        loginCredentials: JSON.stringify({ username: "graciela@smiles.com.br", password: "encrypted_password" }),
        pointsBalance: 12000,
        estimatedValue: "R$ 180,00",
        statusLevel: "basic",
        yearlyEarnings: 6000,
        yearlySpending: 4500,
        expirationDate: new Date("2024-10-15"),
        isActive: true,
        lastUpdated: new Date(),
      }
    );

    // Leonardo's programs
    memberPrograms.push(
      {
        id: this.currentIds.memberProgram++,
        memberId: members[3].id, // Leonardo
        programId: programs[0].id, // LATAM Pass
        accountNumber: "901234678",
        loginCredentials: JSON.stringify({ username: "leonardo@latam.com", password: "encrypted_password" }),
        pointsBalance: 25000,
        estimatedValue: "R$ 750,00",
        statusLevel: "gold",
        yearlyEarnings: 15000,
        yearlySpending: 12000,
        expirationDate: new Date("2024-12-31"),
        isActive: true,
        lastUpdated: new Date(),
      },
      {
        id: this.currentIds.memberProgram++,
        memberId: members[3].id, // Leonardo
        programId: programs[1].id, // Azul
        accountNumber: "012345789",
        loginCredentials: JSON.stringify({ username: "leonardo@azul.com.br", password: "encrypted_password" }),
        pointsBalance: 20000,
        estimatedValue: "R$ 400,00",
        statusLevel: "silver",
        yearlyEarnings: 12000,
        yearlySpending: 9000,
        expirationDate: new Date("2024-11-30"),
        isActive: true,
        lastUpdated: new Date(),
      },
      {
        id: this.currentIds.memberProgram++,
        memberId: members[3].id, // Leonardo
        programId: programs[2].id, // Gol Smiles
        accountNumber: "123456890",
        loginCredentials: JSON.stringify({ username: "leonardo@smiles.com.br", password: "encrypted_password" }),
        pointsBalance: 16000,
        estimatedValue: "R$ 240,00",
        statusLevel: "silver",
        yearlyEarnings: 9000,
        yearlySpending: 7000,
        expirationDate: new Date("2024-10-15"),
        isActive: true,
        lastUpdated: new Date(),
      }
    );

    memberPrograms.forEach(mp => this.memberPrograms.set(mp.id, mp));

    // Add some initial activity logs
    const initialActivities: ActivityLog[] = [
      {
        id: this.currentIds.activityLog++,
        userId: adminUser.id,
        action: "member_created",
        description: "Família Lech foi inicializada no sistema",
        details: "4 membros da família foram adicionados: Osvandré, Marilise, Graciela, Leonardo",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentIds.activityLog++,
        userId: adminUser.id,
        action: "program_enrolled",
        description: "Osvandré inscrito no LATAM Pass",
        details: "Status: Platinum, Saldo: 45.000 pontos",
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentIds.activityLog++,
        userId: adminUser.id,
        action: "program_enrolled",
        description: "Marilise inscrita no Azul",
        details: "Status: Silver, Saldo: 25.000 pontos",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentIds.activityLog++,
        userId: adminUser.id,
        action: "points_updated",
        description: "Saldo atualizado para Leonardo no TudoAzul",
        details: "Novo saldo: 16.000 pontos (+2.000)",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: this.currentIds.activityLog++,
        userId: adminUser.id,
        action: "status_updated",
        description: "Graciela promovida para Silver no LATAM Pass",
        details: "Status anterior: Basic → Novo status: Silver",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    initialActivities.forEach(activity => this.activityLogs.set(activity.id, activity));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentIds.user++,
      createdAt: new Date(),
      role: insertUser.role || "member",
    };
    this.users.set(user.id, user);
    return user;
  }

  async getFamilyMembers(userId: number): Promise<FamilyMember[]> {
    return Array.from(this.familyMembers.values()).filter(member => member.userId === userId);
  }

  async getFamilyMember(id: number): Promise<FamilyMember | undefined> {
    return this.familyMembers.get(id);
  }

  async createFamilyMember(insertMember: InsertFamilyMember): Promise<FamilyMember> {
    const member: FamilyMember = {
      ...insertMember,
      id: this.currentIds.familyMember++,
      userId: insertMember.userId || null,
      isActive: insertMember.isActive ?? true,
    };
    this.familyMembers.set(member.id, member);
    
    // Auto-create default programs for new member
    const programs = await this.getLoyaltyPrograms();
    for (const program of programs) {
      const memberProgram: MemberProgram = {
        id: this.currentIds.memberProgram++,
        memberId: member.id,
        programId: program.id,
        accountNumber: "",
        loginCredentials: JSON.stringify({ username: "", password: "" }),
        pointsBalance: 0,
        estimatedValue: "R$ 0,00",
        statusLevel: "basic",
        yearlyEarnings: 0,
        yearlySpending: 0,
        expirationDate: null,
        isActive: true,
        lastUpdated: new Date(),
      };
      this.memberPrograms.set(memberProgram.id, memberProgram);
    }
    
    return member;
  }

  async updateFamilyMember(id: number, update: Partial<FamilyMember>): Promise<FamilyMember> {
    const existing = this.familyMembers.get(id);
    if (!existing) throw new Error("Member not found");
    
    const updated = { ...existing, ...update };
    this.familyMembers.set(id, updated);
    return updated;
  }

  async deleteFamilyMember(id: number): Promise<void> {
    this.familyMembers.delete(id);
    // Also delete associated member programs
    const toDelete = Array.from(this.memberPrograms.entries())
      .filter(([_, mp]) => mp.memberId === id)
      .map(([id]) => id);
    toDelete.forEach(id => this.memberPrograms.delete(id));
  }

  async getLoyaltyPrograms(): Promise<LoyaltyProgram[]> {
    return Array.from(this.loyaltyPrograms.values());
  }

  async getLoyaltyProgram(id: number): Promise<LoyaltyProgram | undefined> {
    return this.loyaltyPrograms.get(id);
  }

  async createLoyaltyProgram(insertProgram: InsertLoyaltyProgram): Promise<LoyaltyProgram> {
    const program: LoyaltyProgram = {
      ...insertProgram,
      id: this.currentIds.loyaltyProgram++,
      isActive: insertProgram.isActive ?? true,
      logoColor: insertProgram.logoColor || "#3B82F6",
      transferPartners: insertProgram.transferPartners || null,
      pointValue: insertProgram.pointValue || "0.01",
      category: insertProgram.category || "airline",
      website: insertProgram.website || null,
      phoneNumber: insertProgram.phoneNumber || null,
    };
    this.loyaltyPrograms.set(program.id, program);
    return program;
  }

  async updateLoyaltyProgram(id: number, update: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
    const existing = this.loyaltyPrograms.get(id);
    if (!existing) throw new Error("Program not found");
    
    const updated = { ...existing, ...update };
    this.loyaltyPrograms.set(id, updated);
    return updated;
  }

  async deleteLoyaltyProgram(id: number): Promise<void> {
    this.loyaltyPrograms.delete(id);
  }

  async getMemberPrograms(memberId: number): Promise<(MemberProgram & { program: LoyaltyProgram })[]> {
    const memberPrograms = Array.from(this.memberPrograms.values())
      .filter(mp => mp.memberId === memberId);
    
    return memberPrograms.map(mp => ({
      ...mp,
      program: this.loyaltyPrograms.get(mp.programId!)!,
    }));
  }

  async getMemberProgram(id: number): Promise<MemberProgram | undefined> {
    return this.memberPrograms.get(id);
  }

  async createMemberProgram(insertMemberProgram: InsertMemberProgram): Promise<MemberProgram> {
    const memberProgram: MemberProgram = {
      ...insertMemberProgram,
      id: this.currentIds.memberProgram++,
      memberId: insertMemberProgram.memberId || null,
      programId: insertMemberProgram.programId || null,
      accountNumber: insertMemberProgram.accountNumber || null,
      loginCredentials: insertMemberProgram.loginCredentials || null,
      pointsBalance: insertMemberProgram.pointsBalance || 0,
      estimatedValue: insertMemberProgram.estimatedValue || null,
      expirationDate: insertMemberProgram.expirationDate || null,
      statusLevel: insertMemberProgram.statusLevel || "basic",
      yearlyEarnings: insertMemberProgram.yearlyEarnings || 0,
      yearlySpending: insertMemberProgram.yearlySpending || 0,
      isActive: insertMemberProgram.isActive ?? true,
      lastUpdated: new Date(),
    };
    this.memberPrograms.set(memberProgram.id, memberProgram);
    return memberProgram;
  }

  async updateMemberProgram(id: number, update: Partial<MemberProgram>): Promise<MemberProgram> {
    const existing = this.memberPrograms.get(id);
    if (!existing) throw new Error("Member program not found");
    
    const updated = { ...existing, ...update, lastUpdated: new Date() };
    this.memberPrograms.set(id, updated);
    return updated;
  }

  async deleteMemberProgram(id: number): Promise<void> {
    this.memberPrograms.delete(id);
  }

  async getDashboardStats(userId: number): Promise<DashboardStats> {
    const userMembers = await this.getFamilyMembers(userId);
    const allMemberPrograms = userMembers.flatMap(member => 
      Array.from(this.memberPrograms.values()).filter(mp => mp.memberId === member.id)
    );

    const totalPoints = allMemberPrograms.reduce((sum, mp) => sum + (mp.pointsBalance || 0), 0);
    const estimatedValues = allMemberPrograms
      .map(mp => parseFloat(mp.estimatedValue?.replace(/[^\d,]/g, '').replace(',', '.') || '0'))
      .reduce((sum, val) => sum + val, 0);

    return {
      totalMembers: userMembers.length,
      activePrograms: allMemberPrograms.filter(mp => mp.isActive).length,
      totalPoints,
      estimatedValue: `R$ ${estimatedValues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    };
  }

  async getMembersWithPrograms(userId: number): Promise<MemberWithPrograms[]> {
    const members = await this.getFamilyMembers(userId);
    
    return Promise.all(members.map(async member => ({
      ...member,
      programs: await this.getMemberPrograms(member.id),
    })));
  }

  async logActivity(insertActivity: InsertActivityLog): Promise<ActivityLog> {
    const activity: ActivityLog = {
      ...insertActivity,
      id: this.currentIds.activityLog++,
      userId: insertActivity.userId || null,
      metadata: insertActivity.metadata || {},
      timestamp: new Date(),
    };
    this.activityLogs.set(activity.id, activity);
    return activity;
  }

  async getActivityLog(userId: number, limit = 10): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  async updateMemberProgramFields(memberId: number, companyId: string, fields: Record<string, any>): Promise<{ message: string; changes: string[] }> {
    // Map company ID to program ID
    const companyToProgram: Record<string, number> = {
      "latam": 1,
      "azul": 2,
      "smiles": 3
    };
    
    const programId = companyToProgram[companyId];
    if (!programId) {
      throw new Error(`Invalid company ID: ${companyId}`);
    }

    // Find the member program
    const memberProgram = Array.from(this.memberPrograms.values())
      .find(mp => mp.memberId === memberId && mp.programId === programId);
    
    if (!memberProgram) {
      throw new Error(`Member program not found for member ${memberId} and company ${companyId}`);
    }

    const changes: string[] = [];
    
    // Update standard fields
    if (fields.login !== undefined) {
      const currentCredentials = memberProgram.loginCredentials ? 
        JSON.parse(memberProgram.loginCredentials) : {};
      currentCredentials.username = fields.login;
      memberProgram.loginCredentials = JSON.stringify(currentCredentials);
      changes.push("login");
    }
    
    if (fields.password !== undefined) {
      const currentCredentials = memberProgram.loginCredentials ? 
        JSON.parse(memberProgram.loginCredentials) : {};
      currentCredentials.password = fields.password;
      memberProgram.loginCredentials = JSON.stringify(currentCredentials);
      changes.push("password");
    }
    
    if (fields.card_number !== undefined) {
      memberProgram.accountNumber = fields.card_number;
      changes.push("card_number");
    }
    
    if (fields.current_balance !== undefined) {
      memberProgram.pointsBalance = fields.current_balance;
      changes.push("current_balance");
    }
    
    if (fields.elite_tier !== undefined) {
      memberProgram.statusLevel = fields.elite_tier;
      changes.push("elite_tier");
    }
    
    // Update last updated timestamp
    memberProgram.lastUpdated = new Date();
    
    // Store the updated member program
    this.memberPrograms.set(memberProgram.id, memberProgram);
    
    // Log the activity
    const member = await this.getFamilyMember(memberId);
    const program = await this.getLoyaltyProgram(programId);
    
    if (member && program) {
      await this.logActivity({
        userId: member.userId,
        action: "program_updated",
        description: `${member.name} updated ${program.name} program`,
        metadata: { changes, memberId, programId, companyId },
      });
    }
    
    return {
      message: "Fields updated successfully",
      changes
    };
  }

  async updateMemberProgramCustomFields(memberId: number, companyId: string, customFields: Record<string, string>): Promise<{ message: string }> {
    // Map company ID to program ID
    const companyToProgram: Record<string, number> = {
      "latam": 1,
      "azul": 2,
      "smiles": 3
    };
    
    const programId = companyToProgram[companyId];
    if (!programId) {
      throw new Error(`Invalid company ID: ${companyId}`);
    }

    // Find the member program
    const memberProgram = Array.from(this.memberPrograms.values())
      .find(mp => mp.memberId === memberId && mp.programId === programId);
    
    if (!memberProgram) {
      throw new Error(`Member program not found for member ${memberId} and company ${companyId}`);
    }

    // For now, we'll store custom fields in the estimatedValue field as JSON
    // In a real implementation, this would be a separate table/field
    const existingCustomFields = memberProgram.estimatedValue?.startsWith('{') ? 
      JSON.parse(memberProgram.estimatedValue) : {};
    
    const updatedCustomFields = { ...existingCustomFields, ...customFields };
    memberProgram.estimatedValue = JSON.stringify(updatedCustomFields);
    memberProgram.lastUpdated = new Date();
    
    this.memberPrograms.set(memberProgram.id, memberProgram);
    
    // Log the activity
    const member = await this.getFamilyMember(memberId);
    const program = await this.getLoyaltyProgram(programId);
    
    if (member && program) {
      await this.logActivity({
        userId: member.userId,
        action: "custom_fields_updated",
        description: `${member.name} updated custom fields for ${program.name}`,
        metadata: { customFields, memberId, programId, companyId },
      });
    }
    
    return {
      message: "Custom fields updated successfully"
    };
  }
}

export const storage = new MemStorage();
