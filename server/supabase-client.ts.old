import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper to sync local changes to Supabase
export async function syncToSupabase(table: string, operation: 'insert' | 'update' | 'delete', data: any) {
  try {
    if (operation === 'insert') {
      const { error } = await supabase.from(table).insert(data);
      if (error) console.error(`Supabase sync error (${table}):`, error);
    } else if (operation === 'update') {
      const { id, ...updateData } = data;
      const { error } = await supabase.from(table).update(updateData).eq('id', id);
      if (error) console.error(`Supabase sync error (${table}):`, error);
    } else if (operation === 'delete') {
      const { error } = await supabase.from(table).delete().eq('id', data.id);
      if (error) console.error(`Supabase sync error (${table}):`, error);
    }
  } catch (err) {
    console.error('Supabase sync failed:', err);
  }
}