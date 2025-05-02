import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    location.href = 'login.html';
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .eq('user_id', user.id)
    .single();

  if (error) return console.error(error);

  document.getElementById('full-name').textContent = data.full_name || 'N/A';
  document.getElementById('email').textContent   = user.email;
  document.getElementById('bio').textContent     = data.bio || 'N/A';

  const img = document.getElementById('avatar');
  img.src = data.avatar_url || 'https://placehold.co/100x100';
  img.onerror = () => (img.src = 'https://placehold.co/100x100');
});

document.getElementById('logout-btn').onclick = async () => {
  await supabase.auth.signOut();
  location.href = 'login.html';
};
