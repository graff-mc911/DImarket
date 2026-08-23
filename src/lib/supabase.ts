import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Проєкт wjlfvajloxkevggwjgtk. Vercel/Vite: VITE_SUPABASE_* (fallback — лише anon public key).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wjlfvajloxkevggwjgtk.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbGZ2YWpsb3hrZXZnZ3dqZ3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjExOTgsImV4cCI6MjA5Mjc5NzE5OH0.zX0syn4YYt6IhqeQpROT71y2J7dhvm9VfsazgMg46GA'

// Presence guard: if VITE_SUPABASE_* env vars are missing the client silently
// falls back to the hardcoded production URL + anon key. That is fine for the
// public anon key (it is public by design), but a misconfigured deploy quietly
// talking to production is a footgun — surface it loudly in the console.
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  const where = import.meta.env.PROD ? 'PRODUCTION' : 'dev'
   
  console.warn(
    `[supabase] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY not set in ${where} — ` +
      `falling back to hardcoded project wjlfvajloxkevggwjgtk. ` +
      `Set the env vars to point at the intended project.`,
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
