# MilhasLech Project Structure

This document outlines the organization and architecture of the MilhasLech loyalty program tracker.

## Directory Overview

```
milhaslech/
├── client/                     # Frontend React application
│   └── src/
│       ├── components/         # Reusable UI components
│       │   ├── ui/            # Base UI components (Radix + Tailwind)
│       │   ├── edit-member-modal.tsx
│       │   ├── members-table.tsx
│       │   ├── new-member-modal.tsx
│       │   ├── new-program-modal.tsx
│       │   └── program-form.tsx
│       ├── pages/             # Application pages
│       │   ├── dashboard.tsx
│       │   └── login.tsx
│       ├── hooks/             # Custom React hooks
│       │   └── use-toast.ts
│       ├── store/             # Zustand state management
│       │   └── auth-store.ts
│       ├── lib/               # Utility functions
│       │   └── queryClient.ts
│       ├── App.tsx            # Main app component
│       ├── index.css          # Global styles and glassmorphism
│       └── main.tsx           # React entry point
├── server/                     # Backend Express application
│   ├── routes.ts              # API route definitions
│   ├── storage.ts             # Data storage interface
│   ├── index.ts               # Server entry point
│   └── vite.ts                # Vite integration
├── shared/                     # Shared TypeScript schemas
│   └── schema.ts              # Database schema and types
├── attached_assets/            # User-uploaded assets (gitignored)
├── README.md                   # Project documentation
├── CONTRIBUTING.md             # Contribution guidelines
├── CHANGELOG.md                # Version history
├── LICENSE                     # MIT license
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── vite.config.ts              # Vite build configuration
├── drizzle.config.ts           # Database migration configuration
├── postcss.config.js           # PostCSS configuration
└── components.json             # Shadcn UI configuration
```

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with glassmorphism effects
- **UI Library**: Radix UI components with custom styling
- **State**: Zustand for client state, TanStack Query for server state
- **Routing**: Wouter for lightweight routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: In-memory for development, PostgreSQL for production
- **Session**: PostgreSQL-backed sessions with connect-pg-simple
- **Validation**: Zod schemas for type-safe APIs

### Database Schema
- **users**: Authentication and core user data
- **familyMembers**: Extended family member profiles
- **loyaltyPrograms**: Program definitions (airlines, hotels, etc.)
- **memberPrograms**: Junction table linking members to programs
- **activityLog**: Audit trail of user actions

## Development Workflow

### Local Development
1. Copy `.env.example` to `.env`
2. Configure `DATABASE_URL` and `SESSION_SECRET`
3. Run `npm run dev` to start both frontend and backend
4. Access application at `http://localhost:5000`

### Adding Features
1. Update database schema in `shared/schema.ts`
2. Modify storage interface in `server/storage.ts`
3. Add API routes in `server/routes.ts`
4. Create frontend components in `client/src/components/`
5. Update pages in `client/src/pages/`

### Code Organization

#### Component Patterns
```typescript
// Standard component structure
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ComponentProps {
  // Props definition
}

export default function Component({ ...props }: ComponentProps) {
  // Hooks and state
  // Event handlers
  // Render JSX
}
```

#### API Route Patterns
```typescript
// Standard route structure
app.get("/api/endpoint", async (req, res) => {
  try {
    // Validation
    // Business logic
    // Response
  } catch (error) {
    // Error handling
  }
});
```

## Design System

### Color Scheme
- **Primary**: Blue variants (#1e40af, #3b82f6, #60a5fa)
- **Background**: Navy tones for glassmorphism
- **Accent**: Orange (#f97316) for highlights
- **Text**: White (#ffffff) and powder blue for contrast

### Glassmorphism Effects
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Component Styling
- Mobile-first responsive design
- Consistent spacing using Tailwind scale
- Hover animations with scale and glow effects
- Loading states with custom animations

## Data Flow

1. **Authentication**: Session-based with PostgreSQL storage
2. **API Calls**: TanStack Query with automatic caching
3. **State Management**: Zustand for UI state, React Query for server state
4. **Form Handling**: React Hook Form with Zod validation
5. **Real-time Updates**: Cache invalidation triggers UI updates

## Security Considerations

- Input validation on both client and server
- Encrypted credential storage
- Session-based authentication
- CSRF protection through secure sessions
- Role-based access control

## Performance Optimizations

- Code splitting with React.lazy
- Optimistic updates with TanStack Query
- Debounced auto-save functionality
- Efficient re-rendering with proper dependencies
- Vite for fast development and optimized builds

## Mobile Considerations

- Touch-optimized form controls
- Responsive breakpoints
- Native-feeling animations
- Gesture support for WhatsApp sharing
- Accessible touch targets (44px minimum)

## Future Architecture

### Planned Enhancements
- React Native mobile app
- Real-time WebSocket updates
- Advanced caching strategies
- API rate limiting
- Enhanced security measures
- Multi-language support
- Progressive Web App features