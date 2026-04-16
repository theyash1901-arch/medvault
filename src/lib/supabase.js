import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if real credentials are provided
export const isSupabaseConfigured = !!(
  rawUrl &&
  rawKey &&
  rawUrl.startsWith('https://') &&
  rawKey.startsWith('ey')
);

// Always use a valid HTTPS URL so createClient doesn't crash
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjcwODc2MjAsImV4cCI6MTk0MjY2MzYyMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
