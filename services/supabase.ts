import { createClient } from '@supabase/supabase-js';

// Safely access env variables to avoid runtime errors if import.meta.env is undefined
const env = (import.meta as any).env || {};

// Provide fallback values so createClient doesn't throw if env vars are missing
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);