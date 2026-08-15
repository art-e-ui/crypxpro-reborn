import { createClient } from '@supabase/supabase-js';

const getRuntimeConfig = (key: string): string | undefined => {
  if (typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__) {
    const val = (window as any).__RUNTIME_CONFIG__[key];
    if (val && !val.startsWith('__')) {
      return val;
    }
  }
  return undefined;
};

const supabaseUrl = getRuntimeConfig('VITE_SUPABASE_URL') || 
  ((typeof import.meta !== 'undefined' && import.meta.env) 
    ? import.meta.env.VITE_SUPABASE_URL 
    : (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined));

const supabaseAnonKey = getRuntimeConfig('VITE_SUPABASE_ANON_KEY') ||
  ((typeof import.meta !== 'undefined' && import.meta.env)
    ? (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
    : (typeof process !== 'undefined' ? (process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY) : undefined));

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set to connect to real Supabase.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
