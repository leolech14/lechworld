export interface Account {
  accountNumber?: string;
  memberNumber?: string;
  login?: string;
  password?: string;
  milesPassword?: string;
  miles: number;
  status?: string;
  lastUpdated?: string;
  notes?: string;
}

export interface MemberAccounts {
  [program: string]: Account;
}

export interface AppData {
  accounts: {
    [member: string]: MemberAccounts;
  };
  milesValue: {
    [program: string]: number;
  };
  activityLog: ActivityLog[];
}

export interface ActivityLog {
  user: string;
  action: string;
  details: any;
  timestamp: string;
}

export interface User {
  username: string;
  name: string;
  role: 'admin' | 'family' | 'staff';
}