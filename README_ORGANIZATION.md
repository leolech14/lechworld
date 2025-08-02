# LechWorld - Repository Organization

## Project Overview
LechWorld is a family loyalty program tracker that allows multiple family members to manage and track their airline miles, hotel points, and other loyalty programs in one centralized location.

## Repository Structure

```
PROJECT_lechworld/
├── client/               # Frontend React application (Vite)
├── server/               # Backend API (Express/TypeScript)
├── shared/               # Shared TypeScript types and schemas
├── api/                  # Vercel serverless functions
├── scripts/              # Essential utility scripts
├── archive/              # Old/deprecated files
├── context/              # Documentation and analysis files
└── docs/                 # Active documentation
```

## Key Files
- `package.json` - Main project configuration
- `vercel.json` - Vercel deployment configuration
- `drizzle.config.ts` - Database ORM configuration
- `CLAUDE.md` - AI assistant instructions
- `.env` - Environment variables (local)
- `.env.production` - Production environment variables

## Architecture
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Express + TypeScript + Drizzle ORM
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (serverless functions)
- **Authentication**: JWT tokens

## Current State
- ✅ Fully deployed at https://www.lech.world
- ✅ 5 users configured (leonardo, graciela, osvandre, marilise, denise)
- ✅ 4 family members sharing data
- ✅ 18 loyalty programs imported
- ✅ 481,633 total points tracked
- ✅ Shared family vault system where all users see all data

## Archive Organization
- `archive/` - Contains old test files, migration scripts, and deprecated code
- `context/` - Contains project analysis, assessments, and documentation