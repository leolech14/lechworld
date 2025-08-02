/**
 * @purpose: TYPE/DEFINITION/environment
 * @connects-to: server/index.ts, .env.example
 * @description: TypeScript definitions for environment variables
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Database
      DATABASE_URL: string;
      
      // Supabase (optional)
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_KEY?: string;
      
      // Session
      SESSION_SECRET: string;
      
      // Server
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      
      // JWT
      JWT_SECRET: string;
    }
  }
}

export {};