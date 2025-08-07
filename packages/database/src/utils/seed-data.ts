/**
 * @fileoverview Seed data for the family loyalty program
 * @description Contains initial data for 5 family members and loyalty programs
 */

import type { 
  InsertFamily, 
  InsertUser, 
  InsertFamilyMember, 
  InsertLoyaltyProgram,
  InsertMemberProgram,
  InsertNotificationPreferences
} from '../schema';

// ============================================================================
// FAMILY DATA
// ============================================================================

export const seedFamily: InsertFamily = {
  name: "Silva Family",
};

// ============================================================================
// USERS DATA (5 family members)
// ============================================================================

export const seedUsers: Omit<InsertUser, 'familyId'>[] = [
  {
    username: "carlos_silva",
    email: "carlos.silva@email.com",
    name: "Carlos Silva",
    role: "admin",
    isFirstLogin: false,
  },
  {
    username: "maria_silva",
    email: "maria.silva@email.com",
    name: "Maria Silva",
    role: "member",
    isFirstLogin: false,
  },
  {
    username: "joao_silva",
    email: "joao.silva@email.com",
    name: "João Silva",
    role: "member",
    isFirstLogin: true,
  },
  {
    username: "ana_silva",
    email: "ana.silva@email.com",
    name: "Ana Silva",
    role: "member",
    isFirstLogin: true,
  },
  {
    username: "pedro_silva",
    email: "pedro.silva@email.com",
    name: "Pedro Silva",
    role: "member",
    isFirstLogin: true,
  },
];

// ============================================================================
// FAMILY MEMBERS DATA
// ============================================================================

export const seedFamilyMembers: Omit<InsertFamilyMember, 'familyId' | 'userId'>[] = [
  {
    name: "Carlos Silva",
    email: "carlos.silva@email.com",
    role: "primary",
    cpf: "12345678901",
    phone: "+55 11 99999-1234",
    birthdate: "1975-03-15",
    frameColor: "#E3F2FD",
    frameBorderColor: "#2196F3",
    profileEmoji: "👨‍💼",
  },
  {
    name: "Maria Silva",
    email: "maria.silva@email.com",
    role: "primary",
    cpf: "12345678902",
    phone: "+55 11 99999-1235",
    birthdate: "1978-07-22",
    frameColor: "#FCE4EC",
    frameBorderColor: "#E91E63",
    profileEmoji: "👩‍💼",
  },
  {
    name: "João Silva",
    email: "joao.silva@email.com",
    role: "extended",
    cpf: "12345678903",
    phone: "+55 11 99999-1236",
    birthdate: "2000-11-08",
    frameColor: "#E8F5E8",
    frameBorderColor: "#4CAF50",
    profileEmoji: "👨‍🎓",
  },
  {
    name: "Ana Silva",
    email: "ana.silva@email.com",
    role: "extended",
    cpf: "12345678904",
    phone: "+55 11 99999-1237",
    birthdate: "2003-04-12",
    frameColor: "#FFF3E0",
    frameBorderColor: "#FF9800",
    profileEmoji: "👩‍🎨",
  },
  {
    name: "Pedro Silva",
    email: "pedro.silva@email.com",
    role: "view_only",
    cpf: "12345678905",
    phone: "+55 11 99999-1238",
    birthdate: "2010-09-25",
    frameColor: "#F3E5F5",
    frameBorderColor: "#9C27B0",
    profileEmoji: "👦",
  },
];

// ============================================================================
// LOYALTY PROGRAMS DATA (Major Brazilian & International Programs)
// ============================================================================

export const seedLoyaltyPrograms: InsertLoyaltyProgram[] = [
  // Airlines - Brazilian
  {
    name: "Smiles",
    company: "GOL Linhas Aéreas",
    code: "G3",
    programType: "miles",
    category: "airline",
    logoColor: "#FF6B00",
    pointValue: "0.015",
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: "flat",
    transferFeeAmount: 50,
    expirationMonths: 36,
    extendableOnActivity: true,
    website: "https://www.smiles.com.br",
    phoneNumber: "0300 115 7777",
  },
  {
    name: "TudoAzul",
    company: "Azul Linhas Aéreas",
    code: "AD",
    programType: "points",
    category: "airline",
    logoColor: "#003F7F",
    pointValue: "0.012",
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: "percentage",
    transferFeeAmount: 5,
    expirationMonths: 24,
    extendableOnActivity: true,
    website: "https://www.tudoazul.com",
    phoneNumber: "4003 1118",
  },
  {
    name: "LATAM Pass",
    company: "LATAM Airlines",
    code: "LA",
    programType: "miles",
    category: "airline",
    logoColor: "#663399",
    pointValue: "0.018",
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: "tiered",
    transferFeeAmount: 100,
    expirationMonths: 36,
    extendableOnActivity: true,
    website: "https://www.latampass.com",
    phoneNumber: "0300 570 5700",
  },
  
  // Credit Cards
  {
    name: "Livelo",
    company: "Bradesco & BB",
    programType: "points",
    category: "credit_card",
    logoColor: "#00A859",
    pointValue: "0.010",
    transferEnabled: true,
    minTransferAmount: 500,
    transferFeeType: "flat",
    transferFeeAmount: 30,
    expirationMonths: 24,
    extendableOnActivity: true,
    website: "https://www.livelo.com.br",
    phoneNumber: "4004 0117",
  },
  {
    name: "Esfera",
    company: "Bradesco",
    programType: "points",
    category: "credit_card",
    logoColor: "#D50000",
    pointValue: "0.008",
    transferEnabled: true,
    minTransferAmount: 1000,
    transferFeeType: "percentage",
    transferFeeAmount: 3,
    expirationMonths: 36,
    extendableOnActivity: false,
    website: "https://www.esfera.com.br",
    phoneNumber: "0800 704 8383",
  },
  
  // Hotels
  {
    name: "Accor Live Limitless",
    company: "Accor Hotels",
    programType: "points",
    category: "hotel",
    logoColor: "#E4002B",
    pointValue: "0.020",
    transferEnabled: false,
    expirationMonths: 24,
    extendableOnActivity: true,
    website: "https://all.accor.com",
    phoneNumber: "0800 703 7000",
  },
  
  // Retail
  {
    name: "Dotz",
    company: "Dotz",
    programType: "points",
    category: "retail",
    logoColor: "#FF4081",
    pointValue: "0.005",
    transferEnabled: true,
    minTransferAmount: 100,
    transferFeeType: "flat",
    transferFeeAmount: 10,
    expirationMonths: 12,
    extendableOnActivity: true,
    website: "https://www.dotz.com.br",
    phoneNumber: "0800 770 3689",
  },
];

// ============================================================================
// NOTIFICATION PREFERENCES (Default for all users)
// ============================================================================

export const seedNotificationPreferences: Omit<InsertNotificationPreferences, 'userId'>[] = [
  {
    emailEnabled: true,
    emailFrequency: "weekly",
    expirationAlertDays: 90,
    whatsappEnabled: false,
    pushEnabled: true,
  },
  {
    emailEnabled: true,
    emailFrequency: "monthly",
    expirationAlertDays: 60,
    whatsappEnabled: true,
    whatsappNumber: "+55 11 99999-1235",
    pushEnabled: true,
  },
  {
    emailEnabled: true,
    emailFrequency: "weekly",
    expirationAlertDays: 30,
    whatsappEnabled: false,
    pushEnabled: false,
  },
  {
    emailEnabled: true,
    emailFrequency: "daily",
    expirationAlertDays: 120,
    whatsappEnabled: false,
    pushEnabled: true,
  },
  {
    emailEnabled: false,
    emailFrequency: "monthly",
    expirationAlertDays: 180,
    whatsappEnabled: false,
    pushEnabled: false,
  },
];

// ============================================================================
// SAMPLE MEMBER PROGRAMS (Each member has 2-3 programs)
// ============================================================================

export const createSampleMemberPrograms = (memberIds: number[], programIds: number[]): Omit<InsertMemberProgram, 'sitePasswordEncrypted' | 'milesPasswordEncrypted'>[] => {
  return [
    // Carlos Silva - Primary member with multiple programs
    {
      memberId: memberIds[0],
      programId: programIds[0], // Smiles
      accountNumber: "123456789",
      login: "carlos.silva@email.com",
      cpf: "12345678901",
      pointsBalance: 85000,
      eliteTier: "Gold",
      statusLevel: "gold",
      yearlyEarnings: 45000,
      yearlySpending: 12000,
      estimatedValue: "R$ 1.275,00",
      notes: "Primary account holder, frequent traveler",
    },
    {
      memberId: memberIds[0],
      programId: programIds[1], // TudoAzul
      accountNumber: "987654321",
      login: "carlos.silva@email.com",
      cpf: "12345678901",
      pointsBalance: 65000,
      eliteTier: "Safira",
      statusLevel: "platinum",
      yearlyEarnings: 32000,
      yearlySpending: 8500,
      estimatedValue: "R$ 780,00",
      notes: "Secondary airline program",
    },
    {
      memberId: memberIds[0],
      programId: programIds[3], // Livelo
      accountNumber: "LIV123456",
      login: "carlos.silva@email.com",
      cpf: "12345678901",
      pointsBalance: 125000,
      statusLevel: "gold",
      yearlyEarnings: 78000,
      yearlySpending: 25000,
      estimatedValue: "R$ 1.250,00",
      notes: "Credit card rewards program",
    },

    // Maria Silva - Active member
    {
      memberId: memberIds[1],
      programId: programIds[2], // LATAM Pass
      accountNumber: "LA789012",
      login: "maria.silva@email.com",
      cpf: "12345678902",
      pointsBalance: 45000,
      eliteTier: "LATAM Pass Silver",
      statusLevel: "silver",
      yearlyEarnings: 28000,
      yearlySpending: 6500,
      estimatedValue: "R$ 810,00",
      notes: "Travel for work occasionally",
    },
    {
      memberId: memberIds[1],
      programId: programIds[5], // Accor Live Limitless
      accountNumber: "ALL345678",
      login: "maria.silva@email.com",
      cpf: "12345678902",
      pointsBalance: 15000,
      statusLevel: "silver",
      yearlyEarnings: 12000,
      yearlySpending: 3200,
      estimatedValue: "R$ 300,00",
      notes: "Hotel stays for vacation",
    },

    // João Silva - Young adult, moderate usage
    {
      memberId: memberIds[2],
      programId: programIds[6], // Dotz
      accountNumber: "DOT567890",
      login: "joao.silva@email.com",
      cpf: "12345678903",
      pointsBalance: 8500,
      statusLevel: "basic",
      yearlyEarnings: 6000,
      yearlySpending: 1200,
      estimatedValue: "R$ 42,50",
      notes: "Shopping rewards from retail purchases",
    },
    {
      memberId: memberIds[2],
      programId: programIds[0], // Smiles
      accountNumber: "SMI789123",
      login: "joao.silva@email.com",
      cpf: "12345678903",
      pointsBalance: 12000,
      statusLevel: "basic",
      yearlyEarnings: 8000,
      yearlySpending: 2100,
      estimatedValue: "R$ 180,00",
      notes: "Occasional domestic flights",
    },

    // Ana Silva - Student, light usage
    {
      memberId: memberIds[3],
      programId: programIds[1], // TudoAzul
      accountNumber: "AZU456789",
      login: "ana.silva@email.com",
      cpf: "12345678904",
      pointsBalance: 3500,
      statusLevel: "basic",
      yearlyEarnings: 2500,
      yearlySpending: 850,
      estimatedValue: "R$ 42,00",
      notes: "Student discounts and occasional travel",
    },

    // Pedro Silva - Minor, view-only access
    {
      memberId: memberIds[4],
      programId: programIds[6], // Dotz
      accountNumber: "DOT123789",
      login: "carlos.silva@email.com", // Parent manages account
      cpf: "12345678905",
      pointsBalance: 500,
      statusLevel: "basic",
      yearlyEarnings: 300,
      yearlySpending: 50,
      estimatedValue: "R$ 2,50",
      notes: "Minor account managed by parent",
    },
  ];
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getSeedDataSummary = () => {
  return {
    families: 1,
    users: seedUsers.length,
    familyMembers: seedFamilyMembers.length,
    loyaltyPrograms: seedLoyaltyPrograms.length,
    notificationPreferences: seedNotificationPreferences.length,
    estimatedMemberPrograms: 10, // Based on createSampleMemberPrograms
  };
};

export const validateSeedData = () => {
  const errors: string[] = [];

  // Validate users and family members match
  if (seedUsers.length !== seedFamilyMembers.length) {
    errors.push(`Mismatch: ${seedUsers.length} users vs ${seedFamilyMembers.length} family members`);
  }

  // Validate notification preferences match users
  if (seedUsers.length !== seedNotificationPreferences.length) {
    errors.push(`Mismatch: ${seedUsers.length} users vs ${seedNotificationPreferences.length} notification preferences`);
  }

  // Validate email consistency
  seedUsers.forEach((user, index) => {
    const member = seedFamilyMembers[index];
    if (user.email !== member.email) {
      errors.push(`Email mismatch for index ${index}: ${user.email} vs ${member.email}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};