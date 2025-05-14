/*****************************************************************
  dashboard-script.js  (robust version)
  • Loads AI recommendations
  • Lets user click “Request”
  • Fires mail-worker after each request
*****************************************************************/
import { supabase } from './supabaseClient.js';

const PAGE_SIZE = 6;
let   offset    = 0;

document.addEventListener('DOMContentLoaded', () => {
  const list    = document.getElementById('recommended-smart');
  const loadBtn = document.getElementById('load-more-smart');

  if (!list || !loadBtn) {
    console.warn('✖️ recommended-smart or load-more-smart element missing in HTML');
    return;
  }

  /* first batch */
  loadSmartRecs(list, loadBtn);

  /* button */
  loadBtn.onclick = () => loadSmartRecs(list, loadBtn);
});

/* ---------- load semantic recs ---------- */
async function loadSmartRecs(listEl, btnEl) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error, status } = await supabase
    .rpc('match_collaborations_semantic', {
      p_user: session.user.id,
      p_limit: PAGE_SIZE,
      p_offset: offset
    });

  if (error) {
    if (status === 404) {
      console.warn('❕ RPC function match_collaborations_semantic not found – skipping smart recs.');
    } else {
      console.error('RPC error:', error);
    }
    btnEl.style.display = 'none';
    return;
  }

  if (Array.isArray(data)) {
    data.forEach(rec => renderRec(rec, listEl));
    offset += data.length;
    btnEl.style.display = data.length === PAGE_SIZE ? 'block' : 'none';
  }
}

/* ---------- render one recommendation ---------- */
function renderRec(rec, listEl) {
  const card = document.createElement('div');
  card.className = 'rec-card';
  card.innerHTML = `
    <h4>${rec.title}</h4>
    <p>${rec.description}</p>
    <p><small>Similarity: ${rec.score?.toFixed?.(2) ?? '—'}</small></p>
    <button class="req-btn" data-id="${rec.id}">Request</button>
  `;
  const btn = card.querySelector('.req-btn');
  if (btn) btn.onclick = handleRequest;

  listEl.appendChild(card);
}

/* ---------- handle “Request” ---------- */
async function handleRequest(e) {
  const collabId = e.target.dataset.id;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return alert('Please log in.');

  const { error } = await supabase.from('collab_requests').insert([{
    collab_id:    collabId,
    requester_id: session.user.id,
    status:       'pending'
  }]);

  if (error) {
    alert('Request failed: ' + error.message);
    return;
  }

  /* Kick mail-worker (fire-and-forget) */
  fetch('/functions/v1/mail-worker', { method: 'POST' });

  e.target.disabled = true;
  e.target.textContent = 'Requested ✓';
}
