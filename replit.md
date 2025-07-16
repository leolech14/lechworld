# Replit.md

## Overview

This is a comprehensive loyalty program management system (MilhasLech) built with React/TypeScript frontend and Express/Node.js backend. The application serves as a family-oriented miles and points tracker, providing secure credential storage, program management, and detailed analytics for airline miles, hotel points, and credit card rewards. The system follows a monorepo structure with shared schemas and uses modern web development practices with a beautiful glassmorphism UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **July 16, 2025**: Prepared project for GitHub deployment
  - Created comprehensive README.md with feature overview and setup instructions
  - Added CONTRIBUTING.md with development guidelines and code standards
  - Created CHANGELOG.md documenting all features and version history
  - Added PROJECT_STRUCTURE.md with detailed architecture documentation
  - Created .env.example template for environment variables
  - Updated .gitignore to exclude sensitive and build files
  - Added MIT LICENSE for open source distribution
  - Fixed "Novo Programa" functionality by removing problematic credentials parsing
  - Enhanced toast notifications with proper glassmorphism styling
  - Made both "Adicionar Membro" and "Novo Programa" buttons fully functional

- **July 16, 2025**: Enhanced Quick Actions UI and removed role displays
  - Enhanced Quick Actions buttons with larger size (64px height) and improved styling
  - Added gradient backgrounds and icon circles for better visual hierarchy
  - Removed "primary" role field display from all member cards and modals
  - Improved button visibility with proper hover effects and scaling
  - Removed sync points functionality from entire application
  - Replaced Zap icon with Activity icon in quick actions header

- **July 15, 2025**: Completed comprehensive WhatsApp share functionality
  - Implemented desktop WhatsApp share button in dashboard header
  - Added mobile-only floating WhatsApp button (fixed position, bottom-right)
  - Integrated pull-up gesture feature for mobile WhatsApp sharing
  - Three export options: Complete Family Report, Individual Member Report, Program Report
  - WhatsApp-optimized formatting with emojis and structured text layout
  - Real family data integration (Osvandré, Marilise, Graciela, Leonardo)
  - Responsive design with proper mobile/desktop adaptations
  - Fixed accessibility warnings with proper dialog descriptions

- **July 15, 2025**: Integrated real family data from MilhasLech Python backend
  - Added 4 family members: Osvandré, Marilise, Graciela, Leonardo
  - Each member has accounts in all 3 loyalty programs (LATAM Pass, Smiles, TudoAzul)
  - Realistic point balances, status levels, and account information
  - Added historical activity logs showing family enrollment and program updates

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (modern, fast development server)
- **UI Library**: Radix UI components with Tailwind CSS styling
- **State Management**: Zustand for client-side state
- **Routing**: Wouter (lightweight React router)
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: connect-pg-simple for PostgreSQL-backed sessions
- **API Design**: RESTful endpoints with type-safe schemas

### Authentication & Authorization
- Simple email/password authentication
- Role-based access control (admin, member roles)
- Session-based authentication using PostgreSQL session store
- Activity logging for user actions

## Key Components

### Database Schema
- **Users**: Core user accounts with email, password, name, and role
- **Family Members**: Extended family members linked to primary users
- **Loyalty Programs**: Different loyalty programs (miles, points, cashback)
- **Member Programs**: Junction table linking family members to loyalty programs
- **Activity Log**: Audit trail of user actions and system events

### API Endpoints
- `/api/auth/*` - Authentication (login, register)
- `/api/members/*` - Family member management
- `/api/programs/*` - Loyalty program management
- `/api/member-programs/*` - Member-program associations
- `/api/dashboard/*` - Dashboard statistics and data aggregation
- `/api/activity/*` - Activity logging and retrieval

### UI Components
- Glassmorphism design with blue color scheme
- Responsive design using Tailwind CSS
- Reusable component library based on Radix UI
- Form components with validation
- Data tables with filtering and search
- Dashboard with statistics cards and activity feeds

## Data Flow

1. **Authentication Flow**: Users log in through the frontend, which sends credentials to the backend API
2. **Session Management**: Backend validates credentials and creates PostgreSQL-backed sessions
3. **Data Fetching**: Frontend uses TanStack Query to fetch data from REST endpoints
4. **State Management**: Zustand manages client-side state, while React Query handles server state
5. **Form Submissions**: Forms use React Hook Form with Zod validation before sending to backend
6. **Activity Logging**: Backend automatically logs user actions for audit purposes

## External Dependencies

### Frontend Dependencies
- Radix UI components for accessible UI primitives
- Tailwind CSS for styling
- React Hook Form + Zod for form validation
- TanStack Query for server state management
- Wouter for routing
- Various utility libraries (date-fns, clsx, etc.)

### Backend Dependencies
- Express.js for web server
- Drizzle ORM for database operations
- Neon Database for serverless PostgreSQL
- connect-pg-simple for session management
- Zod for runtime validation

### Development Dependencies
- Vite for build tooling and development server
- TypeScript for type safety
- ESLint/Prettier for code quality
- Drizzle Kit for database migrations

## Deployment Strategy

### Development Environment
- Single command development setup using Vite
- Hot module replacement for fast development
- Replit-specific configurations for cloud IDE support
- Environment variables for database connection

### Production Build
- Vite builds optimized frontend bundle
- ESBuild bundles backend for production
- Static assets served through Express
- Database migrations handled via Drizzle Kit

### Database Management
- PostgreSQL schema defined in `/shared/schema.ts`
- Migrations generated and applied using Drizzle Kit
- Database URL configured via environment variables
- Automatic database provisioning checks

### Key Configuration Files
- `vite.config.ts`: Frontend build configuration
- `drizzle.config.ts`: Database migration configuration
- `tsconfig.json`: TypeScript configuration for entire monorepo
- `package.json`: Scripts for development, build, and deployment

The application follows modern full-stack development practices with type safety throughout the entire stack, from database schemas to API endpoints to frontend components.