import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Configuration ───────────────────────────────────────────────────
let rawUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

// Auto-normalize dashboard URL (e.g. https://supabase.com/dashboard/project/<ref>) to API URL
const dashboardMatch = rawUrl.match(/project\/([a-zA-Z0-9]+)/);
if (dashboardMatch) {
  rawUrl = `https://${dashboardMatch[1]}.supabase.co`;
}

const SUPABASE_URL = rawUrl;

/**
 * `true` when valid Supabase credentials are provided via environment.
 * When `false`, the app falls back to local AsyncStorage + mock data.
 */
export const isSupabaseConfigured: boolean =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/**
 * Supabase client instance.
 * Safe to reference even when credentials are missing — the app
 * gates all network calls behind `isSupabaseConfigured`.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
