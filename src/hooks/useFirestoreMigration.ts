'use client';

import { useEffect, useState } from 'react';
import { useFirestoreStore } from '@/store/useFirestoreStore';
import MigrationService from '@/lib/migration';

interface MigrationState {
  isRequired: boolean;
  isInProgress: boolean;
  isCompleted: boolean;
  error: string | null;
  progress: number;
  step: string;
  legacyDataFound: boolean;
}

export function useFirestoreMigration() {
  const [migrationState, setMigrationState] = useState<MigrationState>({
    isRequired: false,
    isInProgress: false,
    isCompleted: false,
    error: null,
    progress: 0,
    step: '',
    legacyDataFound: false
  });

  const store = useFirestoreStore();

  useEffect(() => {
    checkMigrationStatus();
  }, []);

  const checkMigrationStatus = () => {
    const migrationStatus = MigrationService.getMigrationStatus();
    const legacyData = MigrationService.getLegacyData();
    const legacyDataFound = legacyData !== null;

    setMigrationState(prev => ({
      ...prev,
      isCompleted: migrationStatus.completed,
      isRequired: legacyDataFound && !migrationStatus.completed,
      legacyDataFound
    }));

    // If migration is completed, enable Firestore
    if (migrationStatus.completed && !store.firestoreEnabled) {
      store.enableFirestore();
    }
  };

  const startMigration = async () => {
    const legacyData = MigrationService.getLegacyData();
    if (!legacyData) {
      setMigrationState(prev => ({
        ...prev,
        error: 'No legacy data found to migrate'
      }));
      return;
    }

    setMigrationState(prev => ({
      ...prev,
      isInProgress: true,
      error: null,
      progress: 0,
      step: 'Starting migration...'
    }));

    try {
      // Validate legacy data first
      const validation = MigrationService.validateMigrationData(legacyData);
      if (!validation.valid) {
        throw new Error(`Invalid data: ${validation.errors.join(', ')}`);
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Migration warnings:', validation.warnings);
      }

      // Perform the migration using the store's method
      await store.migrateToFirestore();

      setMigrationState(prev => ({
        ...prev,
        isInProgress: false,
        isCompleted: true,
        progress: 100,
        step: 'Migration completed successfully!'
      }));

    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationState(prev => ({
        ...prev,
        isInProgress: false,
        error: error instanceof Error ? error.message : 'Migration failed',
        step: 'Migration failed'
      }));
    }
  };

  const skipMigration = () => {
    // Mark migration as completed without actually migrating
    MigrationService.setMigrationCompleted('skipped');
    setMigrationState(prev => ({
      ...prev,
      isCompleted: true,
      isRequired: false
    }));
  };

  const retryMigration = () => {
    setMigrationState(prev => ({
      ...prev,
      error: null,
      isInProgress: false,
      progress: 0
    }));
  };

  const generateReport = () => {
    const legacyData = MigrationService.getLegacyData();
    if (!legacyData) return 'No legacy data found';
    
    return MigrationService.generateMigrationReport(legacyData);
  };

  return {
    migrationState,
    startMigration,
    skipMigration,
    retryMigration,
    generateReport,
    checkMigrationStatus
  };
}

export default useFirestoreMigration;