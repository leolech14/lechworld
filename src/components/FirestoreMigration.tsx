'use client';

import { useState } from 'react';
import { useFirestoreMigration } from '@/hooks/useFirestoreMigration';
import { useFirestoreStore } from '@/store/useFirestoreStore';
import { CheckCircle, AlertCircle, Database, Cloud, ArrowRight, Loader2 } from 'lucide-react';

interface FirestoreMigrationProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function FirestoreMigration({ onComplete, onSkip }: FirestoreMigrationProps) {
  const { migrationState, startMigration, skipMigration, retryMigration, generateReport } = useFirestoreMigration();
  const store = useFirestoreStore();
  const [showReport, setShowReport] = useState(false);

  const handleStartMigration = async () => {
    await startMigration();
    if (onComplete) onComplete();
  };

  const handleSkipMigration = () => {
    skipMigration();
    if (onSkip) onSkip();
  };

  if (migrationState.isCompleted) {
    return (
      <div className="max-w-md mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div>
            <h3 className="text-lg font-semibold text-green-900">Migration Complete!</h3>
            <p className="text-green-700">Your data is now synchronized with the cloud.</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-green-700">
          <div className="flex items-center space-x-2">
            <Cloud className="h-4 w-4" />
            <span>Real-time sync enabled</span>
          </div>
          <div className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Offline persistence active</span>
          </div>
        </div>
      </div>
    );
  }

  if (!migrationState.isRequired && !migrationState.legacyDataFound) {
    return (
      <div className="max-w-md mx-auto p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center space-x-3 mb-4">
          <Cloud className="h-8 w-8 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Cloud Sync Ready</h3>
            <p className="text-blue-700">No migration needed. Cloud sync is available.</p>
          </div>
        </div>
        
        <button
          onClick={() => store.enableFirestore()}
          disabled={store.firestoreEnabled || store.isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {store.isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : store.firestoreEnabled ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Cloud Sync Active</span>
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4" />
              <span>Enable Cloud Sync</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Database className="h-8 w-8 text-gray-600" />
          <ArrowRight className="h-6 w-6 text-gray-400" />
          <Cloud className="h-8 w-8 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Upgrade to Cloud Sync</h2>
        <p className="text-gray-600">
          Migrate your data to cloud storage for real-time sync across all devices.
        </p>
      </div>

      {migrationState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 font-medium">Migration Error</p>
          </div>
          <p className="text-red-600 text-sm mt-1">{migrationState.error}</p>
          <button
            onClick={retryMigration}
            className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {migrationState.isInProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <p className="text-blue-700 font-medium">Migrating Data...</p>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-1">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${migrationState.progress}%` }}
            />
          </div>
          <p className="text-blue-600 text-sm">{migrationState.step}</p>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3 text-sm text-gray-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Real-time synchronization across devices</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Automatic backup and recovery</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Offline-first with seamless sync</span>
        </div>
        <div className="flex items-center space-x-3 text-sm text-gray-700">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>Your existing data will be preserved</span>
        </div>
      </div>

      {showReport && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Migration Preview</h4>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-32">
            {generateReport()}
          </pre>
        </div>
      )}

      <div className="flex flex-col space-y-3">
        <button
          onClick={handleStartMigration}
          disabled={migrationState.isInProgress}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
        >
          {migrationState.isInProgress ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Migrating...</span>
            </>
          ) : (
            <>
              <Cloud className="h-4 w-4" />
              <span>Start Migration</span>
            </>
          )}
        </button>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowReport(!showReport)}
            className="flex-1 text-gray-600 hover:text-gray-800 py-2 px-4 border border-gray-300 rounded-lg text-sm"
          >
            {showReport ? 'Hide' : 'Preview'} Report
          </button>
          
          <button
            onClick={handleSkipMigration}
            className="flex-1 text-gray-600 hover:text-gray-800 py-2 px-4 border border-gray-300 rounded-lg text-sm"
          >
            Skip for Now
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        Your data remains local until migration completes successfully.
      </p>
    </div>
  );
}

export default FirestoreMigration;