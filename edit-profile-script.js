import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const form     = document.getElementById('profile-form');
  const fullName = document.getElementById('full-name');
  const bio      = document.getElementById('bio');
  const avatar   = document.getElementById('avatar-url');
  const skills   = document.getElementById('skills');

  /* ---------- load existing data ---------- */
  (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return (location.href = 'login.html');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return;        // first-time user; fields stay empty

    fullName.value = data.full_name   || '';
    bio.value      = data.bio         || '';
    avatar.value   = data.avatar_url  || '';
    skills.value   = (data.skills     || []).join(', ');
  })();

  /* ---------- save / upsert ---------- */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updates = {
      user_id:    user.id,
      full_name:  fullName.value.trim(),
      bio:        bio.value.trim(),
      avatar_url: avatar.value.trim(),
      skills:     skills.value
                    .split(',')
                    .map(s => s.trim().toLowerCase())
                    .filter(Boolean),
      updated_at: new Date()
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    if (error) alert('Update failed: ' + error.message);
    else location.href = 'dashboard.html';
  });

  /* ---------- cancel button ---------- */
  document.getElementById('back').onclick = () => history.back();
});
