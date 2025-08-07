# LechWorld Family Vault - Authentication System

A simple, family-friendly authentication system for the LechWorld loyalty vault application. No passwords required - just family member names!

## Overview

This authentication system is designed specifically for the LechWorld family and uses a simplified approach:
- **Name-based login**: Family members log in with their names only
- **Case insensitive**: Works with any capitalization (leonardo, Leonardo, LEONARDO)
- **Accent insensitive**: Handles Portuguese accents automatically (Osvandré = osvandre)
- **JWT tokens**: Secure session management with different expiry times for family vs staff
- **Role-based access**: Family members get full access, staff get limited access

## Family Members

The system recognizes these family members:

### Family Role (24-hour token expiry)
- **Leonardo** (leonardo, LEONARDO, etc.)
- **Graciela** (graciela, GRACIELA, etc.)  
- **Osvandré** (osvandre, osvandré, OSVANDRE, etc.)
- **Marilise** (marilise, MARILISE, etc.)

### Staff Role (8-hour token expiry)
- **Denise** (denise, DENISE, etc.) - Secretary/Staff access

## API Endpoints

### Authentication Endpoints

#### POST /api/v1/auth/login
Login with family member name.

**Request:**
```json
{
  "name": "Leonardo"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome to the LechWorld family vault, Leonardo!",
  "user": {
    "id": "fam_001",
    "name": "Leonardo", 
    "role": "family",
    "familyId": "lechworld_family"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST /api/v1/auth/verify
Verify current token and get user info.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "fam_001",
    "name": "Leonardo",
    "role": "family", 
    "familyId": "lechworld_family"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### POST /api/v1/auth/refresh
Get a new token with extended expiry.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

#### GET /api/v1/auth/me
Get current user information.

#### POST /api/v1/auth/logout
Logout (client should discard token).

#### GET /api/v1/auth/status
Check authentication status without requiring auth.

#### POST /api/v1/auth/check-name
Check if a name is valid for login.

**Request:**
```json
{
  "name": "leonardo"
}
```

**Response:**
```json
{
  "valid": true,
  "normalizedName": "leonardo",
  "message": "leonardo is a valid family member name",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### GET /api/v1/auth/family
Get list of all family members (requires authentication).

## Middleware Usage

### Basic Authentication
```typescript
import { authenticateToken } from './auth/middleware';

app.get('/protected', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
```

### Family Members Only
```typescript
import { authenticateToken, requireFamilyMember } from './auth/middleware';

app.get('/family-only', authenticateToken, requireFamilyMember, (req, res) => {
  res.json({ message: 'Family vault access granted!' });
});
```

### Staff Only
```typescript
import { authenticateToken, requireStaffRole } from './auth/middleware';

app.get('/staff-only', authenticateToken, requireStaffRole, (req, res) => {
  res.json({ message: 'Staff access granted!' });
});
```

### Specific Role Required
```typescript
import { authenticateToken, requireRole } from './auth/middleware';

app.get('/admin', authenticateToken, requireRole('family'), (req, res) => {
  res.json({ message: 'Admin access granted!' });
});
```

### Optional Authentication
```typescript
import { optionalAuth } from './auth/middleware';

app.get('/public', optionalAuth, (req, res) => {
  const greeting = req.user ? `Hello, ${req.user.name}!` : 'Hello, Guest!';
  res.json({ message: greeting });
});
```

## Security Features

### Rate Limiting
- Authentication endpoints are rate-limited to prevent abuse
- Maximum 5 attempts per IP per 15-minute window

### JWT Security
- Tokens are signed with a secret key
- Different expiry times for family (24h) vs staff (8h)
- Tokens include user ID, name, role, and family ID

### Input Validation
- All inputs are validated and sanitized
- Names must be 2-50 characters
- Proper error messages for invalid inputs

## Environment Variables

Set these in your `.env` file:

```env
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

If `JWT_SECRET` is not set, a default key is used (not recommended for production).

## Example Usage

### Frontend Login Flow
```typescript
// 1. Login
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Leonardo' })
});

const data = await response.json();
const token = data.token;

// 2. Store token (localStorage, sessionStorage, etc.)
localStorage.setItem('authToken', token);

// 3. Use token for authenticated requests
const vaultResponse = await fetch('/api/v1/vault/family', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Backend Route Protection
```typescript
// Family vault route
app.get('/api/v1/vault/family', 
  authenticateToken, 
  requireFamilyMember, 
  (req, res) => {
    res.json({
      message: `Welcome ${req.user?.name}!`,
      vaultContents: ['Family photos', 'Important documents', 'Memories']
    });
  }
);

// Staff accessible route  
app.get('/api/v1/vault/logs',
  authenticateToken,
  (req, res) => {
    const isFamily = req.user?.role === 'family';
    const logs = isFamily ? 'All family activities' : 'Limited staff logs';
    res.json({ logs });
  }
);
```

## Testing

Run the test suite:
```bash
npm test auth
```

Test specific authentication functions:
```bash
npm test mockAuth.test.ts
```

## Development Notes

- The system uses mock data stored in memory - no database required
- Perfect for family applications where simplicity matters more than enterprise security
- All Portuguese accents are automatically normalized
- JWT tokens contain all necessary user information
- Middleware is composable and reusable across routes

## Security Considerations

While this system is simplified for family use, it includes:
- JWT token validation
- Rate limiting on auth endpoints  
- Input validation and sanitization
- Proper error handling
- Different access levels (family vs staff)

For production use, consider:
- Using a proper database for user storage
- Adding password requirements
- Implementing refresh token rotation
- Adding audit logging
- Using Redis for rate limiting
- Adding HTTPS enforcement