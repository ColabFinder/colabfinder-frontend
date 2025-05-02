import { supabase } from './supabaseClient.js';

document.getElementById('back').onclick = () => (location.href = 'dashboard.html');

document.getElementById('profile-form').addEventListener('submit', async e => {
  e.preventDefault();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const updates = {
    user_id: user.id,
    full_name: document.getElementById('full-name').value,
    bio: document.getElementById('bio').value,
    avatar_url: document.getElementById('avatar-url').value,
    updated_at: new Date()
  };

  const { error } = await supabase.from('profiles').upsert(updates);
  if (error) alert('Update failed');
  else location.href = 'dashboard.html';
});
