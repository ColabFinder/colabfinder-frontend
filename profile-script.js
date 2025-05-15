/*****************************************************************
  profile-script.js
  • Reads ?u=<uuid> from URL
  • Loads that user’s profile + collaborations
  • Shows “Request” buttons that insert collab_requests
*****************************************************************/
import { supabase } from './supabaseClient.js';

const params   = new URLSearchParams(window.location.search);
const targetId = params.get('u');                     // UUID in URL
if (!targetId) {
  alert('Missing user id (?u=)');
  location.href = 'dashboard.html';
}

/* ---------- load profile ---------- */
(async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name,bio,avatar_url')
    .eq('user_id', targetId)
    .single();

  if (error || !data) return alert('Profile not found.');

  document.getElementById('full-name').textContent = data.full_name;
  document.getElementById('bio').textContent       = data.bio ?? '';
  document.getElementById('avatar').src            = data.avatar_url || 'fallback-avatar.png';
})();

/* ---------- load collaborations ---------- */
(async () => {
  const list = document.getElementById('collab-list');
  const { data, error } = await supabase
    .from('collaborations')
    .select('id,title,description,type')
    .eq('user_id', targetId)
    .order('created_at', { ascending: false });

  if (error) { console.error(error); return; }

  data.forEach(c => {
    const el = document.createElement('div');
    el.className = 'collab';
    el.innerHTML = `
      <h4>${c.title}</h4>
      <p>${c.description}</p>
      <p><small>Type: ${c.type}</small></p>
      <button data-id="${c.id}">Request</button>
    `;
    el.querySelector('button').onclick = () => handleRequest(c.id);
    list.appendChild(el);
  });
})();

/* ---------- handle Request click ---------- */
async function handleRequest(collabId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return alert('Please log in first.');

  const { error } = await supabase.from('collab_requests').insert([{
    collab_id:    collabId,
    requester_id: session.user.id,
    owner_id:     targetId,
    status:       'pending'
  }]);

  if (error) { alert('Failed: ' + error.message); return; }

  /* fire real-time e-mail via worker */
  supabase.functions.invoke('mail-worker');

  alert('Request sent!');
}
