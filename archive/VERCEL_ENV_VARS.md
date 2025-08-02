# 🚀 Vercel Environment Variables

Copy and paste these environment variables into your Vercel project settings:

## Required Environment Variables

### Backend Variables (Functions)
```env
DATABASE_URL=postgresql://postgres:Iji74iLE0SqiSSKD@db.ixzwjmbvmrefsivcmirz.supabase.co:5432/postgres?sslmode=require

SUPABASE_URL=https://ixzwjmbvmrefsivcmirz.supabase.co

SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzYyODksImV4cCI6MjA2ODU1MjI4OX0.iXHSX5MPP-3h8KJvEg5Rx0ccsaXyvE_RM7Qfgnzglps

SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjk3NjI4OSwiZXhwIjoyMDY4NTUyMjg5fQ.xz_TEASFWMReLnVM76_U0JQ4DWXys6JUHBHlHXRJCyM

SESSION_SECRET=lechworld-production-secret-2025-secure

JWT_SECRET=lechworld-production-jwt-secret-2025

NODE_ENV=production
```

### Frontend Variables (Client)
```env
VITE_SUPABASE_URL=https://ixzwjmbvmrefsivcmirz.supabase.co

VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzYyODksImV4cCI6MjA2ODU1MjI4OX0.iXHSX5MPP-3h8KJvEg5Rx0ccsaXyvE_RM7Qfgnzglps

VITE_API_URL=
```

## How to Add to Vercel

1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables" in the left sidebar
4. Add each variable one by one
5. Make sure to select "Production" environment
6. Click "Save" after adding all variables

## Important Notes

- The DATABASE_URL includes `?sslmode=require` for secure Supabase connection
- All keys are already configured for your Supabase project
- The SESSION_SECRET and JWT_SECRET should be changed to more secure values in production
- These variables will make your app connect directly to Supabase when deployed