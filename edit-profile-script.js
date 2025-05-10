/*****************************************************************
  edit-profile-script.js – full replacement
  • Loads current profile
  • Saves edits
  • NEW: triggers /functions/v1/batch-embed after save
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
  if (error) { alert('Load failed'); return; }

  fullName.value = data.full_name ?? '';
  bio.value      = data.bio ?? '';
  skills.value   = (data.skills ?? []).join(', ');
  avatar.value   = data.avatar_url ?? '';
})();

/* ---------- save edits ---------- */
form.addEventListener('submit', async e => {
  e.preventDefault();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return alert('Session expired, please log in again.');

  const updates = {
    full_name: fullName.value.trim(),
    bio:       bio.value.trim(),
    skills:    skills.value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    avatar_url: avatar.value.trim()
  };

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', session.user.id);

  if (error) return alert('Save failed: ' + error.message);

  /* ---- NEW: kick off vector embedding ---- */
  await fetch('/functions/v1/batch-embed', { method: 'POST' });

  location.href = 'dashboard.html';
});
