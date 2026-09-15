import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── Configuration ───────────────────────────────────────────────────
// Copy .env.example → .env and fill in your keys to switch to Supabase.
// Until then the app uses AsyncStorage-only mode with mock data.

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

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
