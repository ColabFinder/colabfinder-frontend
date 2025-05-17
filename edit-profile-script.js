/*****************************************************************
  edit-profile-script.js – full replacement
  • Loads current profile
  • Upserts edits (creates or updates row)
  • Fires /functions/v1/batch-embed after save
*****************************************************************/
import { supabase } from './supabaseClient.js';

/* ---------- element refs ---------- */
const fullName = document.getElementById('full-name');
const bio      = document.getElementById('bio');
const skills   = document.getElementById('skills');
const avatar   = document.getElementById('avatar-url');
const form     = document.getElementById('edit-profile');

/* ---------- load existing data ---------- */
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return (location.href = 'login.html');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (error && error.code !== 'PGRST116') {      // ignore "row not found"
    alert('Load failed'); return;
  }

  if (data) {
    fullName.value = data.full_name ?? '';
    bio.value      = data.bio ?? '';
    skills.value   = (data.skills ?? []).join(', ');
    avatar.value   = data.avatar_url ?? '';
  }
})();

/* ---------- save / upsert ---------- */
form.addEventListener('submit', async e => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return alert('Session expired, please log in again.');

  const payload = {
    user_id:    session.user.id,                         // required for upsert
    full_name:  fullName.value.trim(),
    bio:        bio.value.trim(),
    skills:     skills.value.split(',')
                   .map(s => s.trim().toLowerCase())
                   .filter(Boolean),
    avatar_url: avatar.value.trim()
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' });         // create or update

  if (error) return alert('Save failed: ' + error.message);

  /* inside loadProfile() after fetching data */
document.getElementById('is-brand').checked = !!data.is_brand;

/* inside save handler */
const { error } = await supabase.from('profiles').update({
  full_name: full.value, bio: bio.value, avatar_url: avatar.value,
  is_brand: document.getElementById('is-brand').checked
}).eq('user_id', session.user.id);

  /* ---- kick off vector embedding ---- */
  fetch('/functions/v1/batch-embed', { method: 'POST' }); // fire-and-forget

  location.href = 'dashboard.html';
});
