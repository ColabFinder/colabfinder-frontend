/*****************************************************************
  dashboard-script.js  –  v2.1
  • Loads AI recommendations
  • Skips weak matches (score < MIN_SCORE)
  • Renders highest-score first
  • Fires mail-worker after each request
*****************************************************************/
import { supabase } from './supabaseClient.js';

const PAGE_SIZE = 6;
const MIN_SCORE = 0.40;        // <—— tweak threshold here

let offset = 0;
let listEl, btnEl;

document.addEventListener('DOMContentLoaded', () => {
  listEl = document.getElementById('recommended-smart');
  btnEl  = document.getElementById('load-more-smart');
  if (!listEl || !btnEl) return;

  loadSmartRecs();
  btnEl.onclick = loadSmartRecs;
});

/* ---------- load semantic recs ---------- */
async function loadSmartRecs() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase.rpc('match_collaborations_semantic', {
    p_user:   session.user.id,
    p_limit:  PAGE_SIZE,
    p_offset: offset
  });
  if (error) { console.warn('RPC missing / failed', error); return; }

  /* sort again for safety, then filter weak matches */
  data
    .sort((a, b) => b.score - a.score)
    .filter(rec => rec.score >= MIN_SCORE)
    .forEach(renderRec);

  offset += data.length;
  btnEl.style.display = data.length === PAGE_SIZE ? 'block' : 'none';
}

/* ---------- render one recommendation ---------- */
function renderRec(rec) {
  const card = document.createElement('div');
  card.className = 'rec-card';
  card.innerHTML = `
    <h4>${rec.title}</h4>
    <p>${rec.description}</p>
    <p><small>Similarity: ${rec.score.toFixed(2)}</small></p>
    <button class="req-btn" data-id="${rec.id}">Request</button>
  `;
  card.querySelector('.req-btn').onclick = handleRequest;
  listEl.appendChild(card);
}

/* ---------- handle “Request” ---------- */
async function handleRequest(e) {
  const collabId = e.target.dataset.id;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return alert('Please log in.');

  const { error } = await supabase.from('collab_requests').insert([{
    collab_id: collabId,
    requester_id: session.user.id,
    status: 'pending'
  }]);
  if (error) return alert('Request failed: ' + error.message);

  /* fire-and-forget mail worker */
  supabase.functions.invoke('mail-worker');

  e.target.disabled    = true;
  e.target.textContent = 'Requested ✓';
}
