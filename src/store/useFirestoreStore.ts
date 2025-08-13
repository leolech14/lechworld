'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppData, User, ActivityLog, Account } from '@/types';
import { initialData } from '@/lib/data';
import { firestoreService } from '@/lib/firestore';

// SessionStorage helpers for login state
const sessionStorageLogin = {
  getUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem('lechworld-current-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: User | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        sessionStorage.setItem('lechworld-current-user', JSON.stringify(user));
      } else {
        sessionStorage.removeItem('lechworld-current-user');
      }
    } catch (error) {
      console.error('Failed to save user to sessionStorage:', error);
    }
  },
};

interface StoreState extends AppData {
  currentUser: User | null;
  showPasswords: boolean;
  language: 'pt' | 'en';
  isOnline: boolean;
  isLoading: boolean;
  error: string | null;
  firestoreEnabled: boolean;
  
  // Actions
  login: (username: string) => boolean;
  logout: () => void;
  togglePasswords: () => void;
  updateAccount: (member: string, program: string, data: Partial<Account>) => Promise<void>;
  updateMilesValue: (program: string, value: number) => Promise<void>;
  addActivity: (action: string, details: any) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: AppData) => Promise<void>;
  setLanguage: (lang: 'pt' | 'en') => void;
  initializeAuth: () => void;
  
  // Firestore-specific actions
  initializeFirestore: () => Promise<void>;
  enableFirestore: () => Promise<void>;
  disableFirestore: () => void;
  syncWithFirestore: () => Promise<void>;
  migrateToFirestore: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setOnlineStatus: (online: boolean) => void;
}

export const useFirestoreStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialData,
      currentUser: null,
      showPasswords: true,
      language: 'pt' as 'pt' | 'en',
      isOnline: navigator?.onLine ?? true,
      isLoading: false,
      error: null,
      firestoreEnabled: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setOnlineStatus: (online: boolean) => set({ isOnline: online }),

      initializeAuth: () => {
        const storedUser = sessionStorageLogin.getUser();
        if (storedUser) {
          set({ currentUser: storedUser });
        }
      },

      login: (username: string) => {
        const validUsers = ['leonardo', 'osvandré', 'osvandre', 'marilise', 'graciela', 'denise'];
        if (validUsers.includes(username.toLowerCase())) {
          let name = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
          if (username.toLowerCase() === 'osvandre' || username.toLowerCase() === 'osvandré') {
            name = 'Osvandré';
          }
          
          const user: User = {
            username: username.toLowerCase(),
            name,
            role: username.toLowerCase() === 'leonardo' ? 'admin' : 
                  username.toLowerCase() === 'denise' ? 'staff' : 'family'
          };
          
          sessionStorageLogin.setUser(user);
          set({ currentUser: user });
          get().addActivity('LOGIN', { user: name });
          return true;
        }
        return false;
      },

      logout: () => {
        sessionStorageLogin.setUser(null);
        set({ currentUser: null });
      },

      togglePasswords: () => {
        set((state) => ({ showPasswords: !state.showPasswords }));
      },

      updateAccount: async (member: string, program: string, data: Partial<Account>) => {
        const state = get();
        
        // Update local state immediately (optimistic update)
        set((state) => ({
          accounts: {
            ...state.accounts,
            [member]: {
              ...state.accounts[member],
              [program]: {
                ...state.accounts[member]?.[program],
                ...data,
                lastUpdated: new Date().toLocaleDateString('pt-BR')
              }
            }
          }
        }));

        // Sync with Firestore if enabled
        if (state.firestoreEnabled && state.isOnline) {
          try {
            await firestoreService.updateAccount(member, program, data);
          } catch (error) {
            console.error('Failed to sync account update with Firestore:', error);
            set({ error: 'Failed to sync with cloud. Changes saved locally.' });
          }
        }
        
        await get().addActivity('UPDATE_ACCOUNT', { member, program, data });
      },

      updateMilesValue: async (program: string, value: number) => {
        const state = get();
        
        // Update local state immediately
        set((state) => ({
          milesValue: {
            ...state.milesValue,
            [program]: value
          }
        }));

        // Sync with Firestore if enabled
        if (state.firestoreEnabled && state.isOnline) {
          try {
            await firestoreService.updateMilesValue(program, value);
          } catch (error) {
            console.error('Failed to sync miles value with Firestore:', error);
            set({ error: 'Failed to sync with cloud. Changes saved locally.' });
          }
        }
        
        await get().addActivity('UPDATE_MILES_VALUE', { program, value });
      },

      addActivity: async (action: string, details: any) => {
        const state = get();
        const activity = {
          user: state.currentUser?.name || 'System',
          action,
          details,
          timestamp: new Date().toISOString()
        };

        // Update local state
        set((state) => ({
          activityLog: [
            ...state.activityLog,
            activity
          ].slice(-100)
        }));

        // Sync with Firestore if enabled
        if (state.firestoreEnabled && state.isOnline) {
          try {
            await firestoreService.addActivityLog(activity);
          } catch (error) {
            console.error('Failed to sync activity with Firestore:', error);
          }
        }
      },

      exportData: async () => {
        const state = get();
        
        if (state.firestoreEnabled) {
          try {
            const data = await firestoreService.exportData();
            return JSON.stringify(data, null, 2);
          } catch (error) {
            console.error('Failed to export from Firestore, using local data:', error);
          }
        }
        
        // Fallback to local data
        const { accounts, milesValue, activityLog } = state;
        return JSON.stringify({ accounts, milesValue, activityLog }, null, 2);
      },

      importData: async (data: AppData) => {
        const state = get();
        
        // Update local state
        set({
          accounts: data.accounts,
          milesValue: data.milesValue,
          activityLog: data.activityLog || []
        });

        // Sync with Firestore if enabled
        if (state.firestoreEnabled && state.isOnline) {
          try {
            await firestoreService.importData(data);
          } catch (error) {
            console.error('Failed to import to Firestore:', error);
            set({ error: 'Failed to sync imported data with cloud.' });
          }
        }
        
        await get().addActivity('IMPORT_DATA', { timestamp: new Date().toISOString() });
      },

      setLanguage: (lang: 'pt' | 'en') => {
        set({ language: lang });
      },

      initializeFirestore: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Check if Firestore is available
          const isHealthy = await firestoreService.healthCheck();
          if (!isHealthy) {
            throw new Error('Firestore is not available');
          }

          // Initialize app data in Firestore if needed
          await firestoreService.initializeAppData(initialData);
          
          set({ firestoreEnabled: true, isLoading: false });
          console.log('Firestore initialized successfully');
        } catch (error) {
          console.error('Failed to initialize Firestore:', error);
          set({ 
            error: 'Failed to connect to cloud database. Using offline mode.', 
            firestoreEnabled: false,
            isLoading: false 
          });
        }
      },

      enableFirestore: async () => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          // Initialize Firestore
          await get().initializeFirestore();

          // Set up real-time listeners
          firestoreService.subscribeToAppData((data) => {
            set((state) => ({
              accounts: data.accounts || state.accounts,
              milesValue: data.milesValue || state.milesValue
            }));
          });

          firestoreService.subscribeToActivityLogs((logs) => {
            set({ activityLog: logs.slice(0, 100) });
          });

          // Sync local data to Firestore
          await get().syncWithFirestore();
          
          set({ firestoreEnabled: true, isLoading: false });
          await get().addActivity('FIRESTORE_ENABLED', { timestamp: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to enable Firestore:', error);
          set({ 
            error: 'Failed to enable cloud sync. Continuing in offline mode.',
            firestoreEnabled: false,
            isLoading: false 
          });
        }
      },

      disableFirestore: () => {
        firestoreService.cleanup();
        set({ firestoreEnabled: false });
        get().addActivity('FIRESTORE_DISABLED', { timestamp: new Date().toISOString() });
      },

      syncWithFirestore: async () => {
        const state = get();
        if (!state.firestoreEnabled || !state.isOnline) return;

        try {
          set({ isLoading: true });
          
          // Get latest data from Firestore
          const firestoreData = await firestoreService.getAppData();
          
          if (firestoreData) {
            set((state) => ({
              accounts: firestoreData.accounts || state.accounts,
              milesValue: firestoreData.milesValue || state.milesValue
            }));
          }

          // Get recent activity logs
          const logs = await firestoreService.getActivityLogs(100);
          set({ activityLog: logs });
          
          set({ isLoading: false });
        } catch (error) {
          console.error('Failed to sync with Firestore:', error);
          set({ 
            error: 'Failed to sync with cloud database.',
            isLoading: false 
          });
        }
      },

      migrateToFirestore: async () => {
        const state = get();
        set({ isLoading: true, error: null });

        try {
          // Initialize Firestore first
          await get().initializeFirestore();

          // Migrate current local data to Firestore
          const localData: AppData = {
            accounts: state.accounts,
            milesValue: state.milesValue,
            activityLog: state.activityLog
          };

          await firestoreService.importData(localData);
          
          // Enable real-time sync
          await get().enableFirestore();
          
          set({ isLoading: false });
          await get().addActivity('MIGRATION_COMPLETED', { 
            timestamp: new Date().toISOString(),
            recordsCount: state.activityLog.length 
          });
          
          console.log('Migration to Firestore completed successfully');
        } catch (error) {
          console.error('Migration failed:', error);
          set({ 
            error: 'Migration to cloud database failed. Data remains local.',
            isLoading: false,
            firestoreEnabled: false
          });
        }
      }
    }),
    {
      name: 'lechworld-firestore-storage',
      partialize: (state) => ({
        accounts: state.accounts,
        milesValue: state.milesValue,
        activityLog: state.activityLog,
        showPasswords: state.showPasswords,
        language: state.language,
        firestoreEnabled: state.firestoreEnabled
      })
    }
  )
);

// Network status monitoring
if (typeof window !== 'undefined') {
  const store = useFirestoreStore.getState();
  
  window.addEventListener('online', () => {
    store.setOnlineStatus(true);
    if (store.firestoreEnabled) {
      store.syncWithFirestore();
    }
  });
  
  window.addEventListener('offline', () => {
    store.setOnlineStatus(false);
  });
}