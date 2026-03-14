
import { createClient } from '@supabase/supabase-js';

const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKeyEnv = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrlEnv || !supabaseAnonKeyEnv) {
  throw new Error(
    'Missing Supabase configuration. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before starting the app.'
  );
}

export const supabaseUrl = supabaseUrlEnv;
export const supabaseAnonKey = supabaseAnonKeyEnv;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
