'use client';

// Store Provider - Centralized store selection
// This utility helps manage the transition from localStorage to Firestore

import { useStore as useLegacyStore } from '@/store/useStore';
import { useFirestoreStore } from '@/store/useFirestoreStore';
import { useEffect, useState } from 'react';
import MigrationService from './migration';

// Environment-based store selection
const USE_FIRESTORE = process.env.NEXT_PUBLIC_ENABLE_FIRESTORE === 'true' || 
                     process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== undefined;

// Store selection hook with automatic migration detection
export function useAppStore() {
  const [shouldUseFirestore, setShouldUseFirestore] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

  const legacyStore = useLegacyStore();
  const firestoreStore = useFirestoreStore();

  useEffect(() => {
    // Check migration status on mount
    const migrationStatus = MigrationService.getMigrationStatus();
    const hasFirebaseConfig = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    
    // Use Firestore if:
    // 1. Firebase is configured AND
    // 2. Migration is completed OR no legacy data exists
    const legacyData = MigrationService.getLegacyData();
    const shouldUse = hasFirebaseConfig && 
                     (migrationStatus.completed || !legacyData);
    
    setShouldUseFirestore(shouldUse);
    setMigrationChecked(true);

    // Initialize the appropriate store
    if (shouldUse) {
      firestoreStore.initializeAuth();
      if (hasFirebaseConfig) {
        firestoreStore.initializeFirestore();
      }
    } else {
      legacyStore.initializeAuth();
    }
  }, []);

  // Return the appropriate store based on configuration and migration status
  if (!migrationChecked) {
    // Return a minimal store while checking migration status
    return {
      ...legacyStore,
      isLoading: true,
      migrationRequired: false
    };
  }

  if (shouldUseFirestore) {
    return {
      ...firestoreStore,
      migrationRequired: false,
      isFirestoreEnabled: true
    };
  }

  return {
    ...legacyStore,
    migrationRequired: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !MigrationService.getMigrationStatus().completed),
    isFirestoreEnabled: false,
    isLoading: false,
    error: null,
    isOnline: true
  };
}

// Direct store access for specific use cases
export function useLegacyStore() {
  return useLegacyStore();
}

export function useFirestore() {
  return useFirestoreStore();
}

// Migration status hook
export function useMigrationStatus() {
  const [status, setStatus] = useState(MigrationService.getMigrationStatus());
  const [legacyDataExists, setLegacyDataExists] = useState(false);

  useEffect(() => {
    const migrationStatus = MigrationService.getMigrationStatus();
    const legacyData = MigrationService.getLegacyData();
    
    setStatus(migrationStatus);
    setLegacyDataExists(Boolean(legacyData));
  }, []);

  return {
    migrationCompleted: status.completed,
    migrationTimestamp: status.timestamp,
    migrationVersion: status.version,
    legacyDataExists,
    migrationRequired: legacyDataExists && !status.completed && Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  };
}

// Store type detection
export function getStoreType(): 'legacy' | 'firestore' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  
  const hasFirebaseConfig = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const migrationStatus = MigrationService.getMigrationStatus();
  const legacyData = MigrationService.getLegacyData();
  
  if (hasFirebaseConfig && (migrationStatus.completed || !legacyData)) {
    return 'firestore';
  }
  
  return 'legacy';
}

// Configuration helpers
export const storeConfig = {
  isFirebaseConfigured: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  useFirestoreByDefault: USE_FIRESTORE,
  migrationEnabled: true,
  fallbackToLegacy: true
};

export default useAppStore;