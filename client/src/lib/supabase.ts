import { createClient } from '@supabase/supabase-js';

// For Vercel deployment, these should be set as NEXT_PUBLIC_ but since we're using Vite,
// we'll use VITE_ prefix for client-side env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ixzwjmbvmrefsivcmirz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4endqbWJ2bXJlZnNpdmNtaXJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzYyODksImV4cCI6MjA2ODU1MjI4OX0.iXHSX5MPP-3h8KJvEg5Rx0ccsaXyvE_RM7Qfgnzglps';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);