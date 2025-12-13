
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eeaeoxyjupqjpudhthxv.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlYWVveHlqdXBxanB1ZGh0aHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODMwMjksImV4cCI6MjA4MTE1OTAyOX0.-4rdlgDk3H0gwRhwf-_q-1t9ujo3nd7_sBtiWy-ABhw';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
