/*****************************************************************
  dashboard-script.js    – full replacement
*****************************************************************/
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }
  const user = session.user;

  await loadProfile(user);
  await loadCollaborations(user);
  await loadRecommendations(user);   // <- will now fail softly
});

/* ───────── Profile ───────── */
async function loadProfile(user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .eq('user_id', user.id)
    .single();

  if (error) return console.error('Profile load error:', error);

  document.getElementById('full-name').textContent = data.full_name || '';
  document.getElementById('email').textContent     = user.email;
  document.getElementById('bio').textContent       = data.bio || '';
  document.getElementById('avatar').src =
    data.avatar_url || 'https://placehold.co/100x100';
}

/* ───────── Your collaborations ───────── */
async function loadCollaborations(user) {
  const { data, error } = await supabase
    .from('collaborations')
    .select('*')
    .eq('user_id', user.id);

  const list = document.getElementById('collab-list');
  list.innerHTML = '';

  if (error || !data || data.length === 0) {
    list.textContent = 'No collaborations found.';
    return;
  }

  data.forEach(c => {
    const div = document.createElement('div');
    div.className = 'collab';
    div.innerHTML = `
      <strong>${c.title}</strong><br/>
      ${c.description}<br/>
      <em>Type: ${c.type}</em>
    `;
    list.appendChild(div);
  });
}

/* ───────── Recommended (match_collaborations) ───────── */
async function loadRecommendations(user) {
  const container = document.createElement('div');
  container.innerHTML = '<h2>Recommended for You</h2>';
  document.body.appendChild(container);

  const { data, error } = await supabase
    .rpc('match_collaborations', { p_user: user.id });

  /* ---- graceful fallback ---- */
  if (error) {
    if (error.code === '404') {
      container.insertAdjacentHTML(
        'beforeend',
        '<p style="color:#888">Matching service is still being set up.</p>'
      );
    } else {
      console.error('match_collaborations error:', error);
      container.insertAdjacentHTML(
        'beforeend',
        '<p style="color:#d33">Error loading recommendations.</p>'
      );
    }
    return;
  }

  if (!data || data.length === 0) {
    container.insertAdjacentHTML('beforeend', '<p>No matches yet.</p>');
    return;
  }

  data.forEach(c => {
    const div = document.createElement('div');
    div.className = 'collab';
    div.innerHTML = `
      <strong>${c.title}</strong><br/>
      ${c.description}<br/>
      <em>Overlap score: ${c.overlap}</em>
    `;
    container.appendChild(div);
  });
}

/* ───────── Logout helper ───────── */
window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
};
