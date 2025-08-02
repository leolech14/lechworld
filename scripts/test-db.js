import dotenv from 'dotenv';

dotenv.config();

function checkEnv() {
  const hasSupabaseUrl = !!process.env.SUPABASE_URL;
  const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_KEY;
  const hasDatabaseUrl = !!process.env.DATABASE_URL;

  console.log({
    status: 'ok',
    environment: {
      SUPABASE_URL: hasSupabaseUrl ? 'configured' : 'missing',
      SUPABASE_SERVICE_KEY: hasSupabaseKey ? 'configured' : 'missing',
      DATABASE_URL: hasDatabaseUrl ? 'configured' : 'missing',
      NODE_ENV: process.env.NODE_ENV
    }
  });
}

checkEnv();
