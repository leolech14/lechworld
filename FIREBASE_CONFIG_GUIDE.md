# Firebase Configuration Guide for LechWorld Next.js App

## ✅ Completed Configuration Files

The following Firebase configuration files have been created:

1. **firebase.json** - Main Firebase configuration
2. **.firebaserc** - Project configuration (lechworld-daeb7)
3. **firestore.indexes.json** - Firestore database indexes
4. **.env.local** - Environment variables (needs actual values)

## 🔧 Required Steps to Complete Setup

### Step 1: Get Firebase Web App Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/project/lechworld-daeb7/settings/general/)
2. Scroll down to "Your apps" section
3. If no web app exists:
   - Click "Add app" → Choose "Web" (</>) 
   - Give it a name like "LechWorld Web App"
   - Enable Firebase Hosting
4. Copy the configuration object from the SDK setup

### Step 2: Update .env.local with Real Values

Replace the placeholder values in `.env.local` with actual values from Firebase Console:

```bash
# Replace these with actual values from Firebase Console
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_ACTUAL_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lechworld-daeb7.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lechworld-daeb7
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lechworld-daeb7.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=460941334300
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_ACTUAL_APP_ID
```

### Step 3: Install Firebase CLI (if not already installed)

```bash
npm install -g firebase-tools
firebase login
```

### Step 4: Initialize Firebase in Your Project

```bash
cd /Users/lech/PROJECTS_a/PROJECT_lechworld/lechworld-next
firebase use lechworld-daeb7
```

### Step 5: Deploy Firestore Rules and Indexes

```bash
# Deploy firestore rules and indexes
npm run firebase:deploy:firestore

# Or deploy everything
npm run firebase:deploy
```

## 🚀 Available npm Scripts

```bash
# Development with Firebase Emulators
npm run firebase:emulators

# Build and deploy to Firebase Hosting
npm run firebase:deploy

# Deploy only hosting
npm run firebase:deploy:hosting

# Deploy only Firestore rules/indexes
npm run firebase:deploy:firestore

# Serve locally (preview production build)
npm run firebase:serve
```

## 📁 Project Structure

```
/Users/lech/PROJECTS_a/PROJECT_lechworld/lechworld-next/
├── firebase.json              # Firebase configuration
├── .firebaserc               # Project settings
├── firestore.rules           # Firestore security rules (existing)
├── firestore.indexes.json    # Firestore indexes
├── .env.local                # Environment variables
├── src/lib/firebase.ts       # Firebase SDK setup (existing)
└── package.json              # Updated with Firebase scripts
```

## 🔐 Security Configuration

Your Firestore rules are already configured in `firestore.rules`. The current rules allow:
- Read/write access to `/app/data` for all users (temporary for development)
- Read/write access to `/activityLog` collection for all users
- User-specific access to `/users/{userId}` documents
- Admin-only access to `/admin` collection

## 🏗️ Hosting Configuration

The Firebase hosting is configured to:
- Serve static files from the `out` directory (Next.js export)
- Handle SPA routing with fallback to `index.html`
- Cache static assets (JS/CSS/images) for 1 year
- Enable clean URLs without trailing slashes

## 🧪 Local Development with Emulators

To use Firebase emulators for local development:

1. Uncomment this line in `.env.local`:
   ```bash
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
   ```

2. Start emulators:
   ```bash
   npm run firebase:emulators
   ```

3. Access emulator UI at: http://localhost:4000

## 🌐 Production Deployment

Once configured, deploy to Firebase Hosting:

```bash
npm run firebase:deploy:hosting
```

Your app will be available at: https://lechworld-daeb7.web.app

## 🔄 Next Steps

1. ✅ Get actual Firebase config values and update `.env.local`
2. ✅ Test Firebase connection locally
3. ✅ Deploy Firestore rules and indexes
4. ✅ Deploy to Firebase Hosting
5. ✅ Set up custom domain (if needed)

## 🆘 Troubleshooting

- **Authentication errors**: Ensure you're logged into Firebase CLI with `firebase login`
- **Permission errors**: Verify you have editor/owner access to the `lechworld-daeb7` project
- **Build errors**: Ensure `npm run build` works before deploying
- **Environment variables**: Restart development server after updating `.env.local`