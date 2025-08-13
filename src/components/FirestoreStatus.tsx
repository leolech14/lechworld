'use client';

import { useFirestoreStore } from '@/store/useFirestoreStore';
import { Cloud, CloudOff, Loader2, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

export function FirestoreStatus() {
  const { 
    firestoreEnabled, 
    isOnline, 
    isLoading, 
    error,
    enableFirestore,
    disableFirestore,
    syncWithFirestore
  } = useFirestoreStore();

  const getStatusIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (firestoreEnabled && isOnline) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (firestoreEnabled && !isOnline) return <CloudOff className="h-4 w-4 text-yellow-500" />;
    return <Cloud className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Connecting...';
    if (error) return 'Sync Error';
    if (firestoreEnabled && isOnline) return 'Cloud Sync Active';
    if (firestoreEnabled && !isOnline) return 'Offline Mode';
    return 'Local Only';
  };

  const getStatusColor = () => {
    if (error) return 'text-red-600 bg-red-50 border-red-200';
    if (firestoreEnabled && isOnline) return 'text-green-600 bg-green-50 border-green-200';
    if (firestoreEnabled && !isOnline) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {/* Network status indicator */}
      {firestoreEnabled && (
        <div className="flex items-center space-x-1">
          {isOnline ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-gray-400" />
          )}
        </div>
      )}
      
      {/* Error details on hover */}
      {error && (
        <div className="relative group">
          <AlertCircle className="h-3 w-3 text-red-500 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
            <div className="bg-red-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {error}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FirestoreControls() {
  const { 
    firestoreEnabled, 
    isLoading, 
    enableFirestore,
    disableFirestore,
    syncWithFirestore
  } = useFirestoreStore();

  return (
    <div className="flex items-center space-x-2">
      <FirestoreStatus />
      
      <div className="flex space-x-1">
        {!firestoreEnabled ? (
          <button
            onClick={enableFirestore}
            disabled={isLoading}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enable Cloud Sync
          </button>
        ) : (
          <>
            <button
              onClick={syncWithFirestore}
              disabled={isLoading}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sync Now
            </button>
            <button
              onClick={disableFirestore}
              disabled={isLoading}
              className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disable
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default FirestoreStatus;