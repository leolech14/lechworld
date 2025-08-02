export interface FamilyMember {
  id: number;
  userId: number;
  familyId: number;
  name: string;
  email: string | null;
  profilePhoto: string | null;
  color: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberProgram {
  id: number;
  memberId: number;
  airlineId: number;
  memberNumber: string;
  statusLevel: string | null;
  currentMiles: number;
  lifetimeMiles: number | null;
  pin: string | null;
  documentNumber: string | null;
  documentType: string | null;
  googleWalletEnabled: boolean;
  lastSyncDate: string | null;
  syncMethod: string | null;
  accountPassword: string | null;
  createdAt: string;
  updatedAt: string;
  airline?: any;
}

export interface MemberWithPrograms extends FamilyMember {
  programs: MemberProgram[];
}

// Member CRUD operations
export async function getMembers(): Promise<FamilyMember[]> {
  const response = await fetch('/api/members', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch members');
  }

  const data = await response.json();
  return data.members;
}

export async function getMemberWithPrograms(memberId: number): Promise<MemberWithPrograms> {
  const response = await fetch(`/api/members/${memberId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch member');
  }

  const data = await response.json();
  return data.member;
}

export async function createMember(member: Partial<FamilyMember>): Promise<FamilyMember> {
  const response = await fetch('/api/members', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(member),
  });

  if (!response.ok) {
    throw new Error('Failed to create member');
  }

  const data = await response.json();
  return data.member;
}

export async function updateMember(memberId: number, member: Partial<FamilyMember>): Promise<FamilyMember> {
  const response = await fetch(`/api/members/${memberId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(member),
  });

  if (!response.ok) {
    throw new Error('Failed to update member');
  }

  const data = await response.json();
  return data.member;
}

export async function deleteMember(memberId: number): Promise<void> {
  const response = await fetch(`/api/members/${memberId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete member');
  }
}

// Program operations
export async function addProgram(program: {
  memberId: number;
  airlineId: number;
  memberNumber: string;
  statusLevel?: string;
  currentMiles?: number;
  accountPassword?: string;
}): Promise<MemberProgram> {
  const response = await fetch('/api/programs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(program),
  });

  if (!response.ok) {
    throw new Error('Failed to add program');
  }

  const data = await response.json();
  return data.program;
}

export async function updateProgram(programId: number, program: Partial<MemberProgram>): Promise<MemberProgram> {
  const response = await fetch(`/api/programs/${programId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(program),
  });

  if (!response.ok) {
    throw new Error('Failed to update program');
  }

  const data = await response.json();
  return data.program;
}

export async function deleteProgram(programId: number): Promise<void> {
  const response = await fetch(`/api/programs/${programId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to delete program');
  }
}