'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppData, User, ActivityLog } from '@/types';
import { initialData } from '@/lib/data';

// LEGACY STORE - DEPRECATED
// This store is maintained for backwards compatibility.
// New applications should use useFirestoreStore for cloud sync capabilities.
// Migration guide: Use FirestoreMigration component to upgrade existing data.

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
  
  // Actions
  login: (username: string) => boolean;
  logout: () => void;
  togglePasswords: () => void;
  updateAccount: (member: string, program: string, data: any) => void;
  updateMilesValue: (program: string, value: number) => void;
  addActivity: (action: string, details: any) => void;
  exportData: () => string;
  importData: (data: AppData) => void;
  setLanguage: (lang: 'pt' | 'en') => void;
  initializeAuth: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialData,
      currentUser: null,
      showPasswords: true,
      language: 'pt' as 'pt' | 'en',

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
          
          // Store in sessionStorage for persistence across page refreshes
          sessionStorageLogin.setUser(user);
          set({ currentUser: user });
          get().addActivity('LOGIN', { user: name });
          return true;
        }
        return false;
      },

      logout: () => {
        // Clear from sessionStorage on logout
        sessionStorageLogin.setUser(null);
        set({ currentUser: null });
      },

      togglePasswords: () => {
        set((state) => ({ showPasswords: !state.showPasswords }));
      },

      updateAccount: (member: string, program: string, data: any) => {
        set((state) => ({
          accounts: {
            ...state.accounts,
            [member]: {
              ...state.accounts[member],
              [program]: {
                ...state.accounts[member][program],
                ...data,
                lastUpdated: new Date().toLocaleDateString('pt-BR')
              }
            }
          }
        }));
        
        get().addActivity('UPDATE_ACCOUNT', { member, program, data });
      },

      updateMilesValue: (program: string, value: number) => {
        set((state) => ({
          milesValue: {
            ...state.milesValue,
            [program]: value
          }
        }));
        
        get().addActivity('UPDATE_MILES_VALUE', { program, value });
      },

      addActivity: (action: string, details: any) => {
        set((state) => ({
          activityLog: [
            ...state.activityLog,
            {
              user: state.currentUser?.name || 'System',
              action,
              details,
              timestamp: new Date().toISOString()
            }
          ].slice(-100) // Keep last 100 activities
        }));
      },

      exportData: () => {
        const { accounts, milesValue, activityLog } = get();
        return JSON.stringify({ accounts, milesValue, activityLog }, null, 2);
      },

      importData: (data: AppData) => {
        set({
          accounts: data.accounts,
          milesValue: data.milesValue,
          activityLog: data.activityLog
        });
        get().addActivity('IMPORT_DATA', { timestamp: new Date().toISOString() });
      },

      setLanguage: (lang: 'pt' | 'en') => {
        set({ language: lang });
      }
    }),
    {
      name: 'lechworld-storage',
      partialize: (state) => ({
        accounts: state.accounts,
        milesValue: state.milesValue,
        activityLog: state.activityLog,
        showPasswords: state.showPasswords,
        language: state.language
        // currentUser is now excluded from localStorage and handled by sessionStorage
      })
    }
  )
);