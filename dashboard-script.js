/*****************************************************************
  dashboard-script.js – full replacement
  • Loads profile, collaborations, recommendations
  • Lets user click “Request” on a recommended collab
  • NEW: triggers mail-worker after each request
*****************************************************************/
import { supabase } from './supabaseClient.js';

const list            = document.getElementById('recommended-smart');
const loadBtn         = document.getElementById('load-more');
let   offset          = 0;
const PAGE_SIZE       = 6;

/* ---------- load profile & recs on page load ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  await loadSmartRecs();
});

/* ---------- load semantic recs ---------- */
async function loadSmartRecs() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase
    .rpc('match_collaborations_semantic', {
      p_user: session.user.id,
      p_limit: PAGE_SIZE,
      p_offset: offset
    });

  if (error) { console.error(error); return; }

  for (const row of data) renderRec(row);
  offset += data.length;
  loadBtn.style.display = data.length === PAGE_SIZE ? 'block' : 'none';
}

/* ---------- render one recommendation ---------- */
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
  list.appendChild(card);
}

/* ---------- handle “Request” click ---------- */
async function handleRequest(e) {
  const collabId = e.target.dataset.id;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return alert('Please log in.');

  const { error } = await supabase.from('collab_requests').insert([{
    collab_id:   collabId,
    requester_id: session.user.id,
    owner_id: null,          // filled by trigger
    status: 'pending',
    message: ''
  }]);
  if (error) return alert('Request failed: ' + error.message);

  /* ---- NEW kick mail-worker so owner gets e-mail ---- */
  fetch('/functions/v1/mail-worker', { method: 'POST' });

  e.target.disabled = true;
  e.target.textContent = 'Requested ✓';
}

loadBtn.onclick = loadSmartRecs;
