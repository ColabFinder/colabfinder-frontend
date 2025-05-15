/*****************************************************************
  dashboard-script.js – blended ranking
  • Fetches overlap + score
  • Renders only rows whose combined ≥ MIN_COMBINED
*****************************************************************/
import { supabase } from './supabaseClient.js';

const PAGE_SIZE     = 6;
const MIN_COMBINED  = 4;       // tweak threshold (overlap*2 + score*10)

let offset = 0;
let listEl, btnEl;

document.addEventListener('DOMContentLoaded', () => {
  listEl = document.getElementById('recommended-smart');
  btnEl  = document.getElementById('load-more-smart');
  if (!listEl || !btnEl) return console.warn('Smart UI missing');

  loadSmartRecs();
  btnEl.onclick = loadSmartRecs;
});

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
    .filter(rec => (rec.overlap * 2 + rec.score * 10) >= MIN_COMBINED)
    .forEach(renderRec);

  offset += data.length;
  btnEl.style.display = data.length === PAGE_SIZE ? 'block' : 'none';
}

function renderRec(rec) {
  const combined = (rec.overlap * 2 + rec.score * 10).toFixed(1);

  const card = document.createElement('div');
  card.className = 'rec-card';
  card.innerHTML = `
    <h4>${rec.title}</h4>
    <p>${rec.description}</p>
    <p>
      <small>
        Tags in common: ${rec.overlap} &nbsp;|&nbsp;
        Similarity: ${rec.score.toFixed(2)} &nbsp;|&nbsp;
        <strong>Rank ${combined}</strong>
      </small>
    </p>
    <button class="req-btn" data-id="${rec.id}">Request</button>
  `;
  card.querySelector('.req-btn').onclick = handleRequest;
  listEl.appendChild(card);
}

async function handleRequest(e) {
  const collabId = e.target.dataset.id;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return alert('Please log in.');

  const { error } = await supabase.from('collab_requests').insert([{
    collab_id: collabId,
    requester_id: session.user.id,
    status: 'pending'
  }]);
  if (error) return alert(error.message);

  /* real-time mail */
  supabase.functions.invoke('mail-worker');

  e.target.disabled = true;
  e.target.textContent = 'Requested ✓';
}
