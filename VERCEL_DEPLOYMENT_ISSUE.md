# Vercel Backend Deployment Issue

## Problem Summary
The backend API server cannot deploy to Vercel. It keeps failing with different errors depending on the configuration attempted.

## Current Status
- **Frontend**: Successfully deployed at https://lechworld-amlbryj6d-lbl14.vercel.app
- **Backend**: All deployment attempts failing (last working deployment is 3+ hours old)

## Error History

### Error 1: "No Output Directory named 'public' found"
This occurs with most configurations. Vercel treats the project as a static site instead of recognizing serverless functions.

### Error 2: "Function Runtimes must have a valid version"
This occurs when trying to specify runtime in vercel.json:
```json
"runtime": "@vercel/node"
```

## Project Structure
```
PROJECT_lechworld/
├── client/              # Frontend (Vite + React) - DEPLOYS SUCCESSFULLY
├── server/              # Backend (Express + TypeScript) - FAILS TO DEPLOY
│   ├── api/            # Serverless functions directory
│   │   ├── health.ts   # Simple test endpoint
│   │   └── ...         # Other API routes (auth.ts, members.ts, etc.)
│   ├── index.ts        # Original Express server
│   ├── package.json    # Node dependencies
│   ├── tsconfig.json   # TypeScript config
│   └── vercel.json     # Vercel configuration
└── shared/             # Shared types/schemas

```

## What We've Tried

1. **Basic serverless configuration**:
```json
{
  "version": 2,
  "functions": {
    "api/*.ts": {
      "maxDuration": 30
    }
  }
}
```
Result: "No Output Directory named 'public' found"

2. **Explicit serverless mode**:
```json
{
  "version": 2,
  "functions": {
    "api/*.ts": {
      "runtime": "@vercel/node"
    }
  },
  "buildCommand": "",
  "outputDirectory": null
}
```
Result: "Function Runtimes must have a valid version"

3. **Various runtime versions**:
- `"@vercel/node@3"` - Invalid version error
- `"@vercel/node"` - Invalid version error
- No runtime specified - Falls back to static site mode

## Technical Context

### Previous Working State
- The backend was originally configured for Vercel serverless
- Someone attempted to migrate to Railway deployment
- The migration was incomplete, leaving mixed configurations
- Now trying to restore Vercel deployment

### Current Dependencies
```json
{
  "dependencies": {
    "@vercel/node": "^3.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.16.3",
    "typescript": "^5.3.3"
  }
}
```

### Environment Variables (Configured in Vercel)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Authentication secret
- `NODE_ENV` - production/development

## Test Endpoint
Created `/api/health.ts` as minimal test:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'LechWorld API is running on Vercel'
  });
}
```

## Questions for Specialist

1. Why is Vercel treating this as a static site when we have `/api` directory with TypeScript files?
2. What's the correct runtime specification for @vercel/node v3?
3. Do we need to restructure the project to separate frontend/backend repositories?
4. Is there a hidden project setting causing the "public" directory expectation?

## Access Information
- Repository: https://github.com/lbl14/lechworld (pushing to main branch)
- Vercel Project: https://vercel.com/lbl14/server
- The problematic code is in the `/server` directory

## Desired Outcome
Deploy the backend as Vercel serverless functions with these endpoints working:
- `/api/health`
- `/api/auth/login`
- `/api/auth/register`
- `/api/members`
- `/api/programs`
- `/api/dashboard`
- `/api/transactions`
- `/api/notifications`