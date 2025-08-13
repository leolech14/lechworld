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
  id?: string; // Firestore document ID
  user: string;
  action: string;
  details: any;
  timestamp: string;
  createdAt?: string; // Additional timestamp for Firestore
  imported?: boolean; // Flag for migrated data
}

export interface User {
  username: string;
  name: string;
  role: 'admin' | 'family' | 'staff';
}

// Firestore-specific types
export interface FirestoreDocument {
  id: string;
  data: () => any;
  exists: boolean;
}

export interface FirestoreAppData {
  accounts: {
    [member: string]: MemberAccounts;
  };
  milesValue: {
    [program: string]: number;
  };
  lastUpdated: any; // Firebase Timestamp
  version: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isLoading: boolean;
  lastSync?: string;
  error?: string;
}

export interface MigrationStatus {
  completed: boolean;
  timestamp?: string;
  version?: string;
}

// Store state types
export interface StoreState extends AppData {
  currentUser: User | null;
  showPasswords: boolean;
  language: 'pt' | 'en';
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  firestoreEnabled: boolean;
}

// Action types for better type safety
export type StoreAction = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'UPDATE_ACCOUNT'
  | 'UPDATE_MILES_VALUE'
  | 'IMPORT_DATA'
  | 'EXPORT_DATA'
  | 'FIRESTORE_ENABLED'
  | 'FIRESTORE_DISABLED'
  | 'MIGRATION_STARTED'
  | 'MIGRATION_COMPLETED'
  | 'SYNC_SUCCESS'
  | 'SYNC_ERROR';