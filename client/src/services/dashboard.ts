export interface DashboardStats {
  totalMembers: number;
  totalPrograms: number;
  totalMiles: number;
  estimatedValue: number;
  expiringMiles: number;
  expirationValue: number;
  topPrograms: Array<{
    airline: string;
    programName: string;
    miles: number;
    value: number;
  }>;
  recentActivity: Array<{
    id: number;
    action: string;
    description: string;
    createdAt: string;
  }>;
}

export interface FamilyOverview {
  members: Array<{
    id: number;
    name: string;
    programCount: number;
    totalMiles: number;
    estimatedValue: number;
  }>;
  milesByAirline: Array<{
    airline: string;
    programName: string;
    totalMiles: number;
    memberCount: number;
  }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }

  return response.json();
}

export async function getFamilyOverview(): Promise<any> {
  const response = await fetch('/api/dashboard/family-overview', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch family overview');
  }

  return response.json();
}

export async function getExpiringMiles(days: number = 90) {
  const response = await fetch(`/api/transactions/expiring?days=${days}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch expiring miles');
  }

  return response.json();
}