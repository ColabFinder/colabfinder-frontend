/*****************************************************************
  dashboard-script.js – full replacement (Delete Collaboration added)
*****************************************************************/
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    location.href = 'login.html';
    return;
  }
  const user = session.user;

  await loadProfile(user);
  await loadCollaborations(user);
  await loadRecommendations(user);
});

/* ───────── Profile ───────── */
async function loadProfile(user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .eq('user_id', user.id)
    .single();

  if (error) return console.error(error);

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
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const list = document.getElementById('collab-list');
  list.innerHTML = '';

  if (error || !data || data.length === 0) {
    list.textContent = 'No collaborations found.';
    return;
  }

  data.forEach(c => {
    const div = document.createElement('div');
    div.className = 'collab';

    /* info */
    const info = document.createElement('div');
    info.className = 'collab-info';
    info.innerHTML = `
      <strong>${c.title}</strong><br/>
      ${c.description}<br/>
      <em>Type: ${c.type}</em>
    `;
    div.appendChild(info);

    /* edit */
    const editBtn = document.createElement('button');
    editBtn.className = 'btn edit';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => location.href = `edit-collaboration.html?id=${c.id}`;
    div.appendChild(editBtn);

    /* delete */
    const delBtn = document.createElement('button');
    delBtn.className = 'btn delete';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => confirmDelete(c.id, div);
    div.appendChild(delBtn);

    list.appendChild(div);
  });
}

/* Delete helper */
async function confirmDelete(id, node) {
  if (!confirm('Delete this collaboration?')) return;
  const { error } = await supabase.from('collaborations').delete().eq('id', id);
  if (error) return alert('Delete failed: ' + error.message);
  node.remove(); // instant UI feedback
}

/* ───────── Recommendations (unchanged) ───────── */
async function loadRecommendations(user) {
  const container = document.createElement('div');
  container.innerHTML = '<h2>Recommended for You</h2>';
  document.body.appendChild(container);

  const { data, error } = await supabase
    .rpc('match_collaborations', { p_user: user.id });

  if (error) {
    container.insertAdjacentHTML('beforeend',
      '<p style="color:#888">Matching service not available.</p>');
    console.error(error);
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

/* ───────── Logout ───────── */
window.logout = async () => {
  await supabase.auth.signOut();
  location.href = 'login.html';
};
