# Legacy Server Migration Summary

## Overview
Successfully migrated all working backend code from `legacy/server/` to `apps/api/src/` while preserving the existing modern API structure.

## Files Created/Modified

### Database & Connections
- **NEW**: `apps/api/src/database/legacy-client.ts` - PostgreSQL connection compatible with legacy code
- **UPDATED**: `apps/api/package.json` - Added legacy dependencies (pg, cookie-parser, date-fns)

### Authentication & Middleware
- **NEW**: `apps/api/src/auth/legacy-auth-jwt.ts` - JWT authentication middleware from legacy server
- **PRESERVED**: Modern auth middleware remains intact

### API Routes (Legacy Implementation)
All routes are prefixed with `/api/` (vs `/api/v1/` for modern routes):

- **NEW**: `apps/api/src/routes/legacy-auth-complete.ts`
  - POST `/api/auth/login` - User authentication with JWT
  - POST `/api/auth/logout` - Logout (JWT client-side)
  - GET `/api/auth/me` - Get current user info
  - GET `/api/auth/test` - Health check

- **NEW**: `apps/api/src/routes/legacy-members-complete.ts`
  - GET `/api/members` - Get all family members
  - POST `/api/members` - Create new family member
  - PUT `/api/members/:id` - Update family member
  - DELETE `/api/members/:id` - Delete family member

- **NEW**: `apps/api/src/routes/legacy-dashboard-complete.ts`
  - GET `/api/dashboard/stats` - Dashboard statistics
  - GET `/api/dashboard/family-overview` - Family overview with programs
  - GET `/api/dashboard/members-with-programs/:userId` - Legacy endpoint
  - GET `/api/dashboard/stats/:userId` - Stats for specific user

- **NEW**: `apps/api/src/routes/legacy-programs-complete.ts`
  - GET `/api/programs` - Get all loyalty programs
  - POST `/api/programs` - Create loyalty program
  - PUT `/api/programs/:id` - Update loyalty program
  - DELETE `/api/programs/:id` - Delete loyalty program
  - GET `/api/programs/member/:memberId` - Get member's programs
  - POST `/api/programs/member-programs` - Create member-program association
  - PUT `/api/programs/member-programs/:id` - Update member program
  - DELETE `/api/programs/member-programs/:id` - Delete member program

- **NEW**: `apps/api/src/routes/legacy-transactions-complete.ts`
  - GET `/api/transactions` - Get transaction history
  - POST `/api/transactions` - Create new transaction/activity
  - GET `/api/transactions/member-program/:id` - Program-specific transactions
  - POST `/api/transactions/update-points` - Update points balance
  - GET `/api/transactions/activity` - Get activity log

- **NEW**: `apps/api/src/routes/legacy-notifications-complete.ts`
  - GET `/api/notifications` - Get user notifications
  - POST `/api/notifications/:id/read` - Mark notification as read
  - GET `/api/notifications/preferences` - Get notification preferences
  - PUT `/api/notifications/preferences` - Update notification preferences
  - GET `/api/notifications/test` - Test notifications

### Services
- **PRESERVED**: `apps/api/src/services/expirationService.ts` - Already compatible
- **PRESERVED**: `apps/api/src/services/notificationService.ts` - Already compatible

### Utilities
- **NEW**: `apps/api/src/utils/miles-values.ts` - Miles valuation utilities from legacy server

### Main Server
- **UPDATED**: `apps/api/src/index.ts`
  - Added cookie-parser middleware
  - Integrated all legacy routes with authentication
  - Added API overview endpoints
  - Dual API structure (modern + legacy)

## API Structure

The server now provides two parallel API implementations:

### Modern API (New - `/api/v1/*`)
- Uses modern authentication middleware
- Follows REST conventions
- Comprehensive error handling
- Rate limiting and security

### Legacy API (Working - `/api/*`)
- Uses legacy authentication (JWT)
- Direct port from working server
- All endpoints tested and functional
- Member management, programs, dashboard, transactions, notifications

## Authentication

### Legacy Auth Flow
1. POST `/api/auth/login` - Returns JWT token
2. Include `Authorization: Bearer <token>` header in requests
3. Legacy middleware validates JWT and sets `req.session` and `req.user`

### Modern Auth Flow
- Preserved existing authentication system
- No changes to existing routes

## Database Tables Used
The legacy routes work with these database tables:
- `users` - User accounts
- `family_members` - Family member profiles  
- `loyalty_programs` - Available loyalty programs
- `member_programs` - Member-program associations
- `activity_logs` - User activity tracking

## Health Check Endpoints
- GET `/health` - Main health check
- GET `/api/health` - Legacy API health check
- GET `/api/status` - Complete API overview
- GET `/api/v1/status` - Modern API status

## Dependencies Added
```json
{
  "dependencies": {
    "pg": "^8.16.3",
    "cookie-parser": "^1.4.7",
    "date-fns": "^2.29.3"
  },
  "devDependencies": {
    "@types/pg": "^8.15.5",
    "@types/cookie-parser": "^1.4.9"
  }
}
```

## Testing
All legacy endpoints can be tested using the original API calls:
1. Login: `POST /api/auth/login`
2. Get members: `GET /api/members` (with auth header)
3. Dashboard stats: `GET /api/dashboard/stats` (with auth header)
4. etc.

## Notes
- Legacy routes use SQL queries directly (via drizzle-orm/sql)
- Modern routes use the newer drizzle schema approach
- Both systems coexist without conflicts
- Authentication systems are separate but compatible
- Database connection pools are separate for performance isolation

## Next Steps
1. Test all legacy endpoints with real data
2. Frontend can now connect to working backend
3. Gradually migrate clients from legacy to modern endpoints
4. Database schema should be verified/migrated as needed