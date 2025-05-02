import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1️⃣  Session check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }
  const user = session.user;

  // 2️⃣  Load & render data
  await loadProfile(user);
  await loadCollaborations(user);
  await loadRecommendations(user);
});

/* ──────────────────────────────────────────────
   Profile (name, bio, avatar)
─────────────────────────────────────────────── */
async function loadProfile(user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .eq('user_id', user.id)
    .single();

  if (error) { console.error('Profile load error:', error.message); return; }

  document.getElementById('full-name').textContent = data.full_name || '';
  document.getElementById('email').textContent     = user.email;
  document.getElementById('bio').textContent       = data.bio || '';
  document.getElementById('avatar').src =
    data.avatar_url || 'https://placehold.co/100x100';
}

/* ──────────────────────────────────────────────
   Your own collaborations
─────────────────────────────────────────────── */
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

/* ──────────────────────────────────────────────
   Recommended collaborations (matching function)
─────────────────────────────────────────────── */
async function loadRecommendations(user) {
  const { data, error } = await supabase
    .rpc('match_collaborations', { p_user: user.id });   // ← Postgres function we created

  // Container
  const container = document.createElement('div');
  container.innerHTML = '<h2>Recommended for You</h2>';
  document.body.appendChild(container);

  if (error || !data || data.length === 0) {
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

/* ──────────────────────────────────────────────
   Logout helper - exposed globally for nav link
─────────────────────────────────────────────── */
window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
};
