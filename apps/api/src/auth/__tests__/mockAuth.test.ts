import {
  normalizeText,
  authenticateByName,
  generateToken,
  verifyToken,
  getAllFamilyMembers,
  hasRole,
  isFamilyMember
} from '../mockAuth';

describe('MockAuth', () => {
  describe('normalizeText', () => {
    it('should normalize text with accents', () => {
      expect(normalizeText('Osvandré')).toBe('osvandre');
      expect(normalizeText('GRACIELA')).toBe('graciela');
      expect(normalizeText('Leonardo')).toBe('leonardo');
      expect(normalizeText('maríá')).toBe('maria');
      expect(normalizeText('José')).toBe('jose');
    });

    it('should handle text without accents', () => {
      expect(normalizeText('Leonardo')).toBe('leonardo');
      expect(normalizeText('DENISE')).toBe('denise');
    });

    it('should trim whitespace', () => {
      expect(normalizeText('  Leonardo  ')).toBe('leonardo');
      expect(normalizeText('\tGraciela\n')).toBe('graciela');
    });
  });

  describe('authenticateByName', () => {
    it('should authenticate valid family members', () => {
      const user = authenticateByName('Leonardo');
      expect(user).toBeTruthy();
      expect(user?.name).toBe('Leonardo');
      expect(user?.role).toBe('family');
    });

    it('should authenticate with different cases', () => {
      const user1 = authenticateByName('LEONARDO');
      const user2 = authenticateByName('leonardo');
      const user3 = authenticateByName('Leonardo');
      
      expect(user1?.name).toBe('Leonardo');
      expect(user2?.name).toBe('Leonardo');
      expect(user3?.name).toBe('Leonardo');
    });

    it('should authenticate with accents', () => {
      const user = authenticateByName('Osvandré');
      expect(user).toBeTruthy();
      expect(user?.name).toBe('Osvandré');
    });

    it('should authenticate staff members', () => {
      const user = authenticateByName('denise');
      expect(user).toBeTruthy();
      expect(user?.name).toBe('Denise');
      expect(user?.role).toBe('staff');
    });

    it('should reject invalid names', () => {
      const user = authenticateByName('invalid');
      expect(user).toBeNull();
    });

    it('should reject empty names', () => {
      const user = authenticateByName('');
      expect(user).toBeNull();
    });
  });

  describe('generateToken and verifyToken', () => {
    it('should generate and verify valid tokens', () => {
      const user = authenticateByName('Leonardo');
      expect(user).toBeTruthy();
      
      const token = generateToken(user!);
      expect(token).toBeTruthy();
      
      const verifiedUser = verifyToken(token);
      expect(verifiedUser).toBeTruthy();
      expect(verifiedUser?.name).toBe('Leonardo');
      expect(verifiedUser?.role).toBe('family');
    });

    it('should reject invalid tokens', () => {
      const verifiedUser = verifyToken('invalid_token');
      expect(verifiedUser).toBeNull();
    });

    it('should reject empty tokens', () => {
      const verifiedUser = verifyToken('');
      expect(verifiedUser).toBeNull();
    });
  });

  describe('getAllFamilyMembers', () => {
    it('should return all family members', () => {
      const members = getAllFamilyMembers();
      expect(members).toHaveLength(5);
      expect(members.map(m => m.name)).toContain('Leonardo');
      expect(members.map(m => m.name)).toContain('Graciela');
      expect(members.map(m => m.name)).toContain('Osvandré');
      expect(members.map(m => m.name)).toContain('Marilise');
      expect(members.map(m => m.name)).toContain('Denise');
    });
  });

  describe('hasRole', () => {
    it('should check family role correctly', () => {
      const user = authenticateByName('Leonardo')!;
      expect(hasRole(user, 'family')).toBe(true);
      expect(hasRole(user, 'staff')).toBe(false);
    });

    it('should check staff role correctly', () => {
      const user = authenticateByName('Denise')!;
      expect(hasRole(user, 'staff')).toBe(true);
      expect(hasRole(user, 'family')).toBe(false);
    });
  });

  describe('isFamilyMember', () => {
    it('should identify family members', () => {
      const user = authenticateByName('Leonardo')!;
      expect(isFamilyMember(user)).toBe(true);
    });

    it('should identify staff members as non-family', () => {
      const user = authenticateByName('Denise')!;
      expect(isFamilyMember(user)).toBe(false);
    });
  });
});