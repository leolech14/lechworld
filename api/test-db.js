export default async function handler(req, res) {
  try {
    // Just test if we can access environment variables
    const hasSupabaseUrl = !!process.env.SUPABASE_URL;
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_KEY;
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    res.json({ 
      status: 'ok',
      environment: {
        SUPABASE_URL: hasSupabaseUrl ? 'configured' : 'missing',
        SUPABASE_SERVICE_KEY: hasSupabaseKey ? 'configured' : 'missing',
        DATABASE_URL: hasDatabaseUrl ? 'configured' : 'missing',
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Test failed', 
      details: error.message 
    });
  }
}