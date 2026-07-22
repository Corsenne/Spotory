import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL?.trim(); const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const supabasePublicKey = key || '';
export const isSupabaseConfigured = Boolean(url && key);
export const supabase = isSupabaseConfigured ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
export const useMockData = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_DATA === 'true';
