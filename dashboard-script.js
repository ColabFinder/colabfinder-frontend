/*****************************************************************
  dashboard-script.js – v3
  • Smart recommendations (unchanged)
  • Your collaborations list with Edit + Delete buttons
*****************************************************************/
import { supabase } from './supabaseClient.js';

const PAGE_SIZE     = 6;
const MIN_COMBINED  = 4;

let offset = 0;
let listRec, btnMore, listMine;

document.addEventListener('DOMContentLoaded', () => {
  listRec = document.getElementById('recommended-smart');
  btnMore = document.getElementById('load-more-smart');
  listMine = document.getElementById('your-collabs');

  loadSmartRecs();
  loadMyCollabs();
  btnMore.onclick = loadSmartRecs;
});

/* ---------- AI recommendations (unchanged) ---------- */
async function loadSmartRecs() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase.rpc('match_collaborations_semantic', {
    p_user:   session.user.id,
    p_limit:  PAGE_SIZE,
    p_offset: offset
  });
  if (error) { console.error(error); return; }

  data
    .filter(r => (r.overlap * 2 + r.score * 10) >= MIN_COMBINED)
    .forEach(renderRec);

  offset += data.length;
  btnMore.style.display = data.length === PAGE_SIZE ? 'block' : 'none';
}

function renderRec(rec) {
  const combined = (rec.overlap * 2 + rec.score * 10).toFixed(1);
  const card = document.createElement('div');
  card.className = 'rec-card';
  card.innerHTML = `
    <h4>${rec.title}</h4>
    <p>${rec.description}</p>
    <p><small>Tags: ${rec.overlap} | Similarity: ${rec.score.toFixed(2)} | Rank ${combined}</small></p>
    <button data-id="${rec.id}">Request</button>
  `;
  card.querySelector('button').onclick = handleRequest;
  listRec.appendChild(card);
}

async function handleRequest(e) {
  const id = e.target.dataset.id;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return alert('Please log in.');

  const { error } = await supabase.from('collab_requests').insert([{
    collab_id: id, requester_id: session.user.id, status: 'pending'
  }]);
  if (error) return alert(error.message);

  supabase.functions.invoke('mail-worker');
  e.target.disabled = true;
  e.target.textContent = 'Requested ✓';
}

/* ---------- Your collaborations ---------- */
async function loadMyCollabs() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase
    .from('collaborations')
    .select('id,title,description,type')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) { console.error(error); return; }

  data.forEach(c => {
    const card = document.createElement('div');
    card.className = 'collab';
    card.id = `collab-${c.id}`;
    card.innerHTML = `
      <h4>${c.title}</h4>
      <p>${c.description}</p>
      <p><small>Type: ${c.type}</small></p>
      <button data-id="${c.id}" class="edit-btn">Edit</button>
      <button data-id="${c.id}" class="del-btn">Delete</button>
    `;
    card.querySelector('.edit-btn').onclick = () =>
      location.href = `edit-collaboration.html?id=${c.id}`;
    card.querySelector('.del-btn').onclick  = () => handleDelete(c.id);
    listMine.appendChild(card);
  });
}

async function handleDelete(id) {
  if (!confirm('Delete this collaboration?')) return;
  const { error } = await supabase.from('collaborations').delete().eq('id', id);
  if (error) return alert(error.message);

  document.getElementById(`collab-${id}`)?.remove();
}
