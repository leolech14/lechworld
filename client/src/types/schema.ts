// Client-side type definitions (without Drizzle dependencies)

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;
  name: string;
  role: string;
  familyId: number;
  isFirstLogin?: boolean;
  lastLogin?: Date | null;
  passwordChangedAt?: Date | null;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FamilyMember {
  id: number;
  name: string;
  email?: string | null;
  role: string;
  userId?: number | null;
  familyId?: number | null;
  isActive?: boolean;
  cpf?: string | null;
  phone?: string | null;
  birthdate?: string | null;
  frameColor?: string;
  frameBorderColor?: string;
  profileEmoji?: string;
}

export interface LoyaltyProgram {
  id: number;
  name: string;
  programName?: string;  // Alias for name
  company: string;
  code?: string | null;
  programType: string;
  logoColor?: string;
  transferPartners?: any;
  pointValue?: string;
  category?: string;
  website?: string | null;
  phoneNumber?: string | null;
  transferEnabled?: boolean;
  minTransferAmount?: number | null;
  transferFeeType?: string | null;
  transferFeeAmount?: number | null;
  expirationMonths?: number | null;
  extendableOnActivity?: boolean;
  isActive?: boolean;
  iconUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MemberProgram {
  id: number;
  memberId: number;
  programId: number;
  accountNumber?: string | null;
  memberNumber?: string | null;  // Alias for accountNumber
  login?: string | null;
  sitePassword?: string | null;
  milesPassword?: string | null;
  cpf?: string | null;
  pointsBalance?: number;
  eliteTier?: string | null;
  notes?: string | null;
  customFields?: any;
  estimatedValue?: string | null;
  expirationDate?: Date | null;
  statusLevel?: string;
  yearlyEarnings?: number;
  yearlySpending?: number;
  lastUpdated?: Date;
  lastUpdatedBy?: number | null;
  isActive?: boolean;
}

export interface ActivityLog {
  id: number;
  userId: number;
  memberId?: number | null;
  action: string;
  category?: string;
  description: string;
  metadata?: any;
  timestamp?: Date;
}

export interface MileTransaction {
  id: number;
  memberProgramId: number;
  miles: number;
  description: string;
  transactionDate: Date;
  expirationDate?: Date | null;
  source: string;
  referenceNumber?: string | null;
  recordedBy?: number | null;
  createdAt?: Date;
}

export interface NotificationPreferences {
  id: number;
  userId: number;
  emailEnabled?: boolean;
  emailFrequency?: string;
  expirationAlertDays?: number;
  whatsappEnabled?: boolean;
  whatsappNumber?: string | null;
  pushEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MemberWithPrograms extends FamilyMember {
  programs: (MemberProgram & { program: LoyaltyProgram })[];
}

export interface DashboardStats {
  totalMembers: number;
  activePrograms?: number;
  totalPoints?: number;
  estimatedValue: number | string;
  totalPrograms?: number;
  totalMiles?: number;
  expiringMiles?: number;
  expirationValue?: number;
  topPrograms?: Array<{
    airline: string;
    programName: string;
    miles: number;
    value: number;
  }>;
  recentActivity?: Array<{
    id: number;
    action: string;
    description: string;
    createdAt: string;
  }>;
}

// Form schemas (for Zod validation compatibility)
export interface InsertFamilyMember {
  name: string;
  email?: string | null;
  role: string;
  cpf?: string | null;
  phone?: string | null;
  birthdate?: string | null;
  frameColor?: string;
  frameBorderColor?: string;
  profileEmoji?: string;
}

export interface InsertMemberProgram {
  memberId: number;
  programId: number;
  accountNumber?: string | null;
  login?: string | null;
  sitePassword?: string | null;
  milesPassword?: string | null;
  cpf?: string | null;
  pointsBalance?: number;
  eliteTier?: string | null;
  notes?: string | null;
  statusLevel?: string;
}

// Mock schema objects for form validation
export const insertFamilyMemberSchema = {
  parse: (data: any) => data as InsertFamilyMember
};

export const insertMemberProgramSchema = {
  parse: (data: any) => data as InsertMemberProgram
};

// Member colors interface
export interface MemberColors {
  frameColor: string;
  frameBorderColor: string;
  profileEmoji: string;
  background?: string;
}