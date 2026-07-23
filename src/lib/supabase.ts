import { createClient } from '@supabase/supabase-js';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  let supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY) are missing. File uploads will fall back.');
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}
