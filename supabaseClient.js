// supabaseClient.js – Initialize Supabase client (ensure this is loaded after the Supabase JS library)
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";        // TODO: replace with your Supabase URL
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY";              // TODO: replace with your anon public API key

// Initialize the Supabase client with session persistence
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true  // automatically handle OAuth redirect callback
  }
});
