/*****************************************************************
  edit-profile-script.js  –  fixed redeclaration error
*****************************************************************/
import { supabase } from './supabaseClient.js';

const fullInp   = document.getElementById('full-name');
const bioInp    = document.getElementById('bio');
const avatarInp = document.getElementById('avatar-url');
const brandChk  = document.getElementById('is-brand');
const form      = document.getElementById('edit-profile-form');

/* ----- load current profile ----- */
(async () => {
  const { data:{session} } = await supabase.auth.getSession();
  if (!session) { location.href = 'login.html'; return; }

  const { data: prof, error: loadErr } = await supabase
    .from('profiles')
    .select('full_name,bio,avatar_url,is_brand')
    .eq('user_id', session.user.id)
    .single();

  if (loadErr) { alert(loadErr.message); return; }

  fullInp.value   = prof.full_name   ?? '';
  bioInp.value    = prof.bio        ?? '';
  avatarInp.value = prof.avatar_url ?? '';
  brandChk.checked = !!prof.is_brand;
})();

/* ----- save profile ----- */
form.onsubmit = async e => {
  e.preventDefault();

  const { data:{session} } = await supabase.auth.getSession();
  if (!session) return;

  const update = {
    full_name:  fullInp.value.trim(),
    bio:        bioInp.value.trim(),
    avatar_url: avatarInp.value.trim(),
    is_brand:   brandChk.checked
  };

  const { error: updateErr } = await supabase
    .from('profiles')
    .update(update)
    .eq('user_id', session.user.id);

  if (updateErr) { alert(updateErr.message); return; }

  location.href = 'profile.html';
};
