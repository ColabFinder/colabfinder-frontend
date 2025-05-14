/*****************************************************************
  dashboard-script.js  (invoke fix)
*****************************************************************/
import { supabase } from './supabaseClient.js';

const PAGE_SIZE = 6;
let offset = 0;
let listEl, btnEl;

document.addEventListener('DOMContentLoaded', () => {
  listEl = document.getElementById('recommended-smart');
  btnEl  = document.getElementById('load-more-smart');
  if (!listEl || !btnEl) return;

  loadSmartRecs();
  btnEl.onclick = loadSmartRecs;
});

async function loadSmartRecs() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase.rpc('match_collaborations_semantic', {
    p_user: session.user.id,
    p_limit: 6,
    p_offset: offset
  });
  if (error) return console.warn('RPC missing or failed:', error);

  data.forEach(renderRec);
  offset += data.length;
  btnEl.style.display = data.length === 6 ? 'block' : 'none';
}

function renderRec(rec) {
  const card = document.createElement('div');
  card.className = 'rec-card';
  card.innerHTML = `
    <h4>${rec.title}</h4>
    <p>${rec.description}</p>
    <p><small>Similarity: ${rec.score.toFixed(2)}</small></p>
    <button data-id="${rec.id}">Request</button>
  `;
  card.querySelector('button').onclick = handleRequest;
  listEl.appendChild(card);
}

async function handleRequest(e) {
  const id = e.target.dataset.id;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { error } = await supabase.from('collab_requests').insert([{
    collab_id: id, requester_id: session.user.id, status: 'pending'
  }]);
  if (error) return alert(error.message);

  /* === NEW: invoke via supabase client (no 404) === */
  supabase.functions.invoke('mail-worker');

  e.target.disabled = true;
  e.target.textContent = 'Requested ✓';
}
