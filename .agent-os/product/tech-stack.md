# Technical Stack

> Last Updated: 2025-07-26
> Version: 1.0.0

## Core Technologies

### Application Framework
- **Framework:** Express.js with TypeScript
- **Version:** Express 4.21.2, TypeScript 5.6.3
- **Language:** TypeScript (Node.js)

### Database
- **Primary:** Supabase (PostgreSQL)
- **Version:** Supabase JS SDK 2.52.0
- **ORM:** Drizzle ORM 0.39.1

## Frontend Stack

### JavaScript Framework
- **Framework:** React
- **Version:** 18.3.1
- **Build Tool:** Vite 5.4.19

### Import Strategy
- **Strategy:** Node modules with npm
- **Package Manager:** npm
- **Node Version:** 18+

### CSS Framework
- **Framework:** Tailwind CSS
- **Version:** 3.4.17
- **PostCSS:** 8.4.47

### UI Components
- **Library:** shadcn/ui with Radix UI primitives
- **Version:** Latest Radix UI components
- **Installation:** Component-based (copied into codebase)

## Assets & Media

### Fonts
- **Provider:** System fonts (Inter via Tailwind)
- **Loading Strategy:** Font stack fallback

### Icons
- **Library:** Lucide React + React Icons
- **Implementation:** Component imports

## Infrastructure

### Application Hosting
- **Platform:** Fly.io
- **Service:** App Platform
- **Region:** GRU (São Paulo, Brazil)

### Database Hosting
- **Provider:** Supabase
- **Service:** Managed PostgreSQL
- **Backups:** Automated by Supabase

### Asset Storage
- **Provider:** Static files served by Express
- **CDN:** Fly.io edge network
- **Access:** Public directory

## Deployment

### CI/CD Pipeline
- **Platform:** Fly.io Deploy
- **Trigger:** Manual via fly deploy
- **Tests:** TypeScript compilation check

### Environments
- **Production:** lechworld.fly.dev
- **Staging:** Not configured
- **Review Apps:** Not configured

## Additional Libraries

### State Management
- **Library:** Zustand 5.0.6
- **Purpose:** Client-side state management

### Data Fetching
- **Library:** TanStack Query (React Query) 5.60.5
- **Purpose:** Server state management and caching

### Form Handling
- **Library:** React Hook Form 7.55.0
- **Validation:** Zod 3.24.2

### Animation
- **Library:** Framer Motion 11.13.1
- **Purpose:** UI animations and transitions

### Routing
- **Library:** Wouter 3.3.5
- **Purpose:** Client-side routing

### Authentication
- **Method:** JWT with bcryptjs
- **Session:** Express Session with PostgreSQL store

### Code Quality
- **Type Checking:** TypeScript strict mode
- **Validation:** Zod schemas with Drizzle integration

### Development Tools
- **Hot Reload:** Vite HMR
- **Database Migrations:** Drizzle Kit 0.30.4

## Code Repository
- **URL:** Not specified (to be added)