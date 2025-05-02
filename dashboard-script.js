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
});

async function loadProfile(user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .eq('user_id', user.id)
    .single();

  if (error) return console.error('Profile load error:', error.message);

  document.getElementById('full-name').textContent = data.full_name || '';
  document.getElementById('email').textContent = user.email;
  document.getElementById('bio').textContent = data.bio || '';
  document.getElementById('avatar').src =
    data.avatar_url || 'https://placehold.co/100x100';
}

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

// needed for the nav <a>
window.logout = async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
};
