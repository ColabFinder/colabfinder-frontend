// supabaseClient.js

const SUPABASE_URL = 'https://eqpmbcbaqgdmrhwmvlya.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // truncated

// This assumes the Supabase library has loaded FIRST
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
  }
});
