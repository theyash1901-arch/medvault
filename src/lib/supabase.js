import { createClient } from '@supabase/supabase-js';
import { MockSupabaseClient } from './mockSupabase';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if real credentials are provided
export const isRealSupabaseConfigured = !!(
  rawUrl &&
  rawKey &&
  rawUrl.startsWith('https://') &&
  rawKey.startsWith('ey')
);

// We force isSupabaseConfigured to true so the app bypasses the SetupScreen
// If real keys are missing, it falls back to LocalStorage Mock Mode.
export const isSupabaseConfigured = true;

// Use real client if keys exist, otherwise mock client
export const supabase = isRealSupabaseConfigured 
  ? createClient(rawUrl, rawKey) 
  : new MockSupabaseClient();
