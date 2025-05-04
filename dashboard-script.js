/*****************************************************************
  ColabFinder Dashboard
  • Profile, CRUD, pagination                          (unchanged)
  • Exact-tag recommendations                          (loadExactRecs)
  • NEW: Semantic (vector) recommendations (OpenAI)    (loadVectorRecs)
*****************************************************************/
import { supabase } from './supabaseClient.js';

const PAGE_SIZE = 6;
let collabPage = 0;
let exactRecPage = 0;
let user = null;

/* ---------- cache DOM refs ---------- */
const dom = {
  fullName:   document.getElementById('full-name'),
  email:      document.getElementById('email'),
  bio:        document.getElementById('bio'),
  avatar:     document.getElementById('avatar'),
  collabList: document.getElementById('collab-list'),
  collabMore: document.getElementById('collab-more'),
  recList:    document.getElementById('rec-list'),
  recMore:    document.getElementById('rec-more'),
  notifBadge: document.getElementById('notif-count')
};

/* ---------- entry ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) return (location.href = 'login.html');
  user = session.user;

  await loadProfile();
  await loadCollaborations();
  await loadExactRecs();
  await loadVectorRecs();            // semantic recommendations
  await loadUnreadCount();

  dom.collabMore.onclick = loadCollaborations;
  dom.recMore.onclick    = loadExactRecs;
});

/* ---------- profile ---------- */
async function loadProfile() {
  const { data } = await supabase
    .from('profiles')
    .select('full_name,bio,avatar_url')
    .eq('user_id', user.id)
    .single();
  if (!data) return;

  dom.fullName.textContent = data.full_name || '';
  dom.email.textContent    = user.email;
  dom.bio.textContent      = data.bio || '';
  dom.avatar.src           = data.avatar_url || 'https://placehold.co/100x100';
}

/* ---------- collaborations (pagination) ---------- */
async function loadCollaborations() {
  const { data, count, error } = await supabase
    .from('collaborations')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(collabPage * PAGE_SIZE, collabPage * PAGE_SIZE + PAGE_SIZE - 1);

  if (error) return console.error(error);
  renderCollabs(data);
  collabPage++;
  dom.collabMore.style.display =
    collabPage * PAGE_SIZE < count ? 'block' : 'none';
}

function renderCollabs(rows) {
  rows.forEach(c => {
    const div = document.createElement('div');
    div.className = 'collab';
    div.innerHTML = `
      <div class="info"><strong>${c.title}</strong><br>${c.description}<br><em>Type: ${c.type}</em></div>
      <button class="btn edit">Edit</button>
      <button class="btn delete">Delete</button>`;
    const [editBtn, delBtn] = div.querySelectorAll('button');
    editBtn.onclick = () => location.href = `edit-collaboration.html?id=${c.id}`;
    delBtn.onclick  = () => confirmDelete(c.id, div);
    dom.collabList.appendChild(div);
  });
}

async function confirmDelete(id, node) {
  if (!confirm('Delete this collaboration?')) return;
  const { error } = await supabase.from('collaborations').delete().eq('id', id);
  if (error) alert('Delete failed: ' + error.message);
  else node.remove();
}

/* ---------- exact-tag recommendations (pagination) ---------- */
async function loadExactRecs() {
  const { data, error } = await supabase
    .rpc('match_collaborations', { p_user: user.id })
    .range(exactRecPage * PAGE_SIZE, exactRecPage * PAGE_SIZE + PAGE_SIZE - 1);

  if (error) { console.error(error); return; }

  data.forEach(renderExactRec);
  dom.recMore.style.display = data.length === PAGE_SIZE ? 'block' : 'none';
  exactRecPage++;
}

function renderExactRec(c) {
  const div = document.createElement('div');
  div.className = 'rec';
  div.innerHTML = `
    <div class="info"><strong>${c.title}</strong><br>${c.description}<br><em>Overlap: ${c.overlap}</em></div>
    <button class="btn request">Request</button>`;
  div.querySelector('.request').onclick = () => sendRequest(c.id, c.title);
  dom.recList.appendChild(div);
}

/* ---------- NEW semantic recommendations (top 6 once) ---------- */
async function loadVectorRecs() {
  const { data, error } = await supabase
    .rpc('match_collaborations_semantic', { p_user: user.id, top_n: 6 });
  if (error) { console.error(error); return; }
  if (!data || data.length === 0) return;   // nothing to show

  // create a heading & list container
  const heading = document.createElement('h2');
  heading.textContent = 'Recommended for You (smart)';
  const list = document.createElement('div');
  list.id = 'vector-rec-list';
  document.body.appendChild(heading);
  document.body.appendChild(list);

  data.forEach(c => {
    const div = document.createElement('div');
    div.className = 'rec';
    div.innerHTML = `
      <div class="info"><strong>${c.title}</strong><br>${c.description}<br><em>Similarity: ${c.score.toFixed(2)}</em></div>
      <button class="btn request">Request</button>`;
    div.querySelector('.request').onclick = () => sendRequest(c.id, c.title);
    list.appendChild(div);
  });
}

/* ---------- send collab request ---------- */
async function sendRequest(collabId, title) {
  const note = prompt(`Request "${title}" – add a note (optional):`);
  const { error } = await supabase.from('collab_requests').insert([{
    collab_id: collabId,
    requester_id: user.id,
    message: note
  }]);
  if (error) alert('Request failed: ' + error.message);
  else alert('Request sent!');
}

/* ---------- notifications badge ---------- */
async function loadUnreadCount() {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  dom.notifBadge.textContent = count > 0 ? ` (${count})` : '';
}

/* ---------- logout ---------- */
window.logout = async () => {
  await supabase.auth.signOut();
  location.href = 'login.html';
};
