import jwt from 'jsonwebtoken';

export interface FamilyUser {
  id: string;
  name: string;
  role: 'family' | 'staff';
  familyId: string;
}

// Family members data
const FAMILY_MEMBERS: Record<string, FamilyUser> = {
  leonardo: {
    id: 'fam_001',
    name: 'Leonardo',
    role: 'family',
    familyId: 'lechworld_family'
  },
  graciela: {
    id: 'fam_002',
    name: 'Graciela',
    role: 'family',
    familyId: 'lechworld_family'
  },
  osvandre: {
    id: 'fam_003',
    name: 'Osvandré',
    role: 'family',
    familyId: 'lechworld_family'
  },
  marilise: {
    id: 'fam_004',
    name: 'Marilise',
    role: 'family',
    familyId: 'lechworld_family'
  },
  denise: {
    id: 'staff_001',
    name: 'Denise',
    role: 'staff',
    familyId: 'lechworld_family'
  }
};

/**
 * Normalizes text by removing accents and converting to lowercase
 * Handles common Portuguese accents: á→a, é→e, í→i, ó→o, ú→u, ç→c
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .trim();
}

/**
 * Authenticates a user by name (case and accent insensitive)
 */
export function authenticateByName(name: string): FamilyUser | null {
  const normalizedInput = normalizeText(name);
  
  // Check if normalized name matches any family member
  const userKey = Object.keys(FAMILY_MEMBERS).find(key => 
    normalizeText(key) === normalizedInput
  );
  
  if (userKey) {
    return FAMILY_MEMBERS[userKey];
  }
  
  return null;
}

/**
 * Generates JWT token for authenticated user
 */
export function generateToken(user: FamilyUser): string {
  const secret = process.env.JWT_SECRET || 'lechworld_family_secret_key_2024';
  
  const payload = {
    id: user.id,
    name: user.name,
    role: user.role,
    familyId: user.familyId
  };
  
  // Token expires in 24 hours for family members, 8 hours for staff
  const expiresIn = user.role === 'family' ? '24h' : '8h';
  
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifies and decodes JWT token
 */
export function verifyToken(token: string): FamilyUser | null {
  try {
    const secret = process.env.JWT_SECRET || 'lechworld_family_secret_key_2024';
    const decoded = jwt.verify(token, secret) as any;
    
    // Ensure the decoded token has the expected structure
    if (decoded.id && decoded.name && decoded.role && decoded.familyId) {
      return {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role,
        familyId: decoded.familyId
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get all family members (for admin purposes)
 */
export function getAllFamilyMembers(): FamilyUser[] {
  return Object.values(FAMILY_MEMBERS);
}

/**
 * Check if user has specific role
 */
export function hasRole(user: FamilyUser, role: 'family' | 'staff'): boolean {
  return user.role === role;
}

/**
 * Check if user is family member (has elevated privileges)
 */
export function isFamilyMember(user: FamilyUser): boolean {
  return user.role === 'family';
}

/**
 * Check if user belongs to the LechWorld family
 */
export function isLechWorldFamily(user: FamilyUser): boolean {
  return user.familyId === 'lechworld_family';
}