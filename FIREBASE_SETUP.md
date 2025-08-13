# Firebase Firestore Integration Guide

This guide walks you through setting up Firebase Firestore for the LechWorld app to enable real-time cloud synchronization across devices.

## 🚀 Quick Start

### 1. Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Firestore Database in "Test mode" initially
4. Get your Firebase configuration from Project Settings > General > Your apps

### 2. Environment Configuration

1. Copy `.env.local.template` to `.env.local`
2. Fill in your Firebase configuration values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id_here
```

### 3. Deploy Security Rules

Deploy the provided `firestore.rules` to your Firebase project:

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

### 4. Start Using Cloud Sync

The app will automatically detect when Firebase is configured and prompt for migration.

## 📊 Data Structure

### Firestore Collections

```
/app/data (document)
├── accounts: { [member]: { [program]: Account } }
├── milesValue: { [program]: number }
├── lastUpdated: timestamp
└── version: string

/activityLog (collection)
├── user: string
├── action: string
├── details: any
├── timestamp: timestamp
└── createdAt: string (ISO)
```

### Data Migration

The app includes automatic migration from localStorage to Firestore:

1. **Detection**: App detects existing localStorage data
2. **Validation**: Data structure is validated before migration
3. **Backup**: Local data is backed up before migration
4. **Migration**: Data is transferred to Firestore
5. **Sync**: Real-time synchronization is enabled

## 🔧 Implementation Details

### Core Services

#### `FirestoreService` (`src/lib/firestore.ts`)
- Singleton service for all Firestore operations
- Real-time listeners for data synchronization
- Offline persistence support
- Error handling and retry logic

#### `MigrationService` (`src/lib/migration.ts`)
- Handles data migration from localStorage
- Validates data integrity
- Provides migration reports
- Backup and recovery utilities

#### `useFirestoreStore` (`src/store/useFirestoreStore.ts`)
- Enhanced Zustand store with Firestore integration
- Optimistic updates for better UX
- Automatic conflict resolution
- Network status awareness

### Key Features

1. **Real-time Sync**: Changes appear instantly across all devices
2. **Offline First**: App works offline, syncs when online
3. **Optimistic Updates**: UI updates immediately, syncs in background
4. **Conflict Resolution**: Automatic handling of concurrent edits
5. **Error Recovery**: Graceful fallback to local storage on errors

## 🛡️ Security

### Current Security Rules

The provided `firestore.rules` allows all authenticated operations. For production:

1. **Enable Firebase Authentication**
2. **Implement role-based access control**
3. **Add field-level validation**
4. **Set up rate limiting**

### Recommended Security Enhancements

```javascript
// Example enhanced security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && request.auth.token.role == 'admin';
    }
    
    function isFamilyMember() {
      return isAuthenticated() && 
        request.auth.token.role in ['admin', 'family', 'staff'];
    }
    
    // App data - family members only
    match /app/data {
      allow read, write: if isFamilyMember();
    }
    
    // Activity logs - family members can read, all can create
    match /activityLog/{document} {
      allow read: if isFamilyMember();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
  }
}
```

## 🔄 Migration Guide

### From localStorage to Firestore

1. **Automatic Detection**: App detects existing localStorage data
2. **Use Migration Component**: Import and use `FirestoreMigration` component
3. **Follow Prompts**: UI guides through migration process
4. **Verify Success**: Check that data appears correctly after migration

### Manual Migration

```typescript
import { useFirestoreMigration } from '@/hooks/useFirestoreMigration';

function MyComponent() {
  const { startMigration, migrationState } = useFirestoreMigration();
  
  const handleMigrate = async () => {
    await startMigration();
  };
  
  return (
    <button onClick={handleMigrate} disabled={migrationState.isInProgress}>
      {migrationState.isInProgress ? 'Migrating...' : 'Migrate to Cloud'}
    </button>
  );
}
```

## 🧪 Testing

### Local Development with Emulator

1. Install Firebase emulator:
```bash
npm install -g firebase-tools
```

2. Start emulator:
```bash
firebase emulators:start --only firestore
```

3. Set environment variable:
```bash
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

### Testing Migration

1. Populate app with test data using localStorage
2. Use migration component to test migration flow
3. Verify data integrity after migration
4. Test real-time sync across multiple browser tabs

## 📱 Usage Examples

### Basic Setup

```typescript
import { useFirestoreStore } from '@/store/useFirestoreStore';
import { useEffect } from 'react';

function App() {
  const store = useFirestoreStore();
  
  useEffect(() => {
    // Initialize authentication
    store.initializeAuth();
    
    // Initialize Firestore if configured
    if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      store.initializeFirestore();
    }
  }, []);
  
  return <YourAppComponents />;
}
```

### Migration Component

```typescript
import { FirestoreMigration } from '@/components/FirestoreMigration';
import { useFirestoreMigration } from '@/hooks/useFirestoreMigration';

function SettingsPage() {
  const { migrationState } = useFirestoreMigration();
  
  if (migrationState.isRequired) {
    return (
      <FirestoreMigration 
        onComplete={() => console.log('Migration completed!')}
        onSkip={() => console.log('Migration skipped')}
      />
    );
  }
  
  return <RegularSettingsContent />;
}
```

### Manual Operations

```typescript
import { firestoreService } from '@/lib/firestore';

// Update account data
await firestoreService.updateAccount('Leonardo', 'LATAM', {
  miles: 15000,
  status: 'PLATINUM'
});

// Add activity log
await firestoreService.addActivityLog({
  user: 'Leonardo',
  action: 'UPDATE_MILES',
  details: { program: 'LATAM', newMiles: 15000 }
});

// Subscribe to real-time updates
const unsubscribe = firestoreService.subscribeToAppData((data) => {
  console.log('Data updated:', data);
});

// Clean up subscription
unsubscribe();
```

## 🚨 Troubleshooting

### Common Issues

1. **Firebase not initialized**: Check environment variables
2. **Permission denied**: Verify Firestore security rules
3. **Migration fails**: Check data validation errors
4. **Sync not working**: Verify network connectivity and Firebase config

### Debug Mode

Enable debug logging:

```typescript
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase debug mode enabled');
}
```

### Recovery Options

1. **Local Backup**: All data is automatically backed up locally
2. **Export/Import**: Use built-in export/import functionality
3. **Manual Recovery**: Access backup data in localStorage
4. **Firestore Console**: Directly manage data in Firebase Console

## 📈 Performance Optimization

### Best Practices

1. **Use Pagination**: Limit query results for large datasets
2. **Index Optimization**: Create composite indexes for complex queries
3. **Batch Operations**: Use batch writes for multiple updates
4. **Connection Pooling**: Reuse Firestore connections
5. **Offline Persistence**: Enable for better offline experience

### Monitoring

Monitor your Firebase usage:
- Check Firebase Console for usage stats
- Set up alerts for quota limits
- Monitor error rates and performance
- Use Firebase Performance Monitoring

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firebase Pricing](https://firebase.google.com/pricing)
- [Best Practices Guide](https://firebase.google.com/docs/firestore/best-practices)

## 🔄 Changelog

### v1.0 (Current)
- Initial Firestore integration
- Automatic migration from localStorage
- Real-time synchronization
- Offline persistence
- Error handling and recovery

### Planned Features
- Firebase Authentication integration
- Advanced security rules
- Data analytics and reporting
- Automated backups
- Multi-tenant support