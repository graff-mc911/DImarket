import { createClient } from '@supabase/supabase-js';
// v2 - DImarket production Supabase
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wjlfvajloxkevggwjgtk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbGZ2YWpsb3hrZXZnZ3dqZ3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjExOTgsImV4cCI6MjA5Mjc5NzE5OH0.zX0syn4YYt6IhqeQpROT71y2J7dhvm9VfsazgMg46GA';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
