/*****************************************************************
  dashboard-script.js – with pagination
*****************************************************************/
import { supabase } from './supabaseClient.js';

const PAGE_SIZE = 6;          // how many rows per fetch

/* State */
let collabPage = 0;
let recPage    = 0;
let user       = null;

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return (location.href = 'login.html');
  user = session.user;

  await loadProfile();
  await loadCollaborations();
  await loadRecommendations();

  /* Load‑more buttons */
  document.getElementById('collab-more').onclick = loadCollaborations;
  document.getElementById('rec-more').onclick    = loadRecommendations;
});

/* ───────── Profile ───────── */
async function loadProfile() {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, bio, avatar_url')
    .eq('user_id', user.id)
    .single();

  if (!data) return;

  document.getElementById('full-name').textContent = data.full_name || '';
  document.getElementById('email').textContent     = user.email;
  document.getElementById('bio').textContent       = data.bio || '';
  document.getElementById('avatar').src =
    data.avatar_url || 'https://placehold.co/100x100';
}

/* ───────── Your collaborations (paginated) ───────── */
async function loadCollaborations() {
  const from = collabPage * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('collaborations')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return console.error(error);

  renderCollabs(data);

  collabPage++;
  toggleMore('collab-more', collabPage * PAGE_SIZE < count);
}

function renderCollabs(rows) {
  const list = document.getElementById('collab-list');
  rows.forEach(c => {
    const div = document.createElement('div');
    div.className = 'collab';

    /* info */
    div.innerHTML = `
      <div class="info">
        <strong>${c.title}</strong><br>
        ${c.description}<br>
        <em>Type: ${c.type}</em>
      </div>
      <button class="btn edit">Edit</button>
      <button class="btn delete">Delete</button>
    `;

    /* buttons */
    const [editBtn, delBtn] = div.querySelectorAll('button');
    editBtn.onclick = () => location.href = `edit-collaboration.html?id=${c.id}`;
    delBtn.onclick  = () => confirmDelete(c.id, div);

    list.appendChild(div);
  });
}

async function confirmDelete(id, node) {
  if (!confirm('Delete this collaboration?')) return;

  const { data, error } = await supabase
    .from('collaborations')
    .delete()
    .eq('id', id)
    .select();

  if (error) {
    alert('Delete failed: ' + error.message);
  } else {
    node.remove();
  }
}

/* ───────── Recommendations (paginated) ───────── */
async function loadRecommendations() {
  const from = recPage * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .rpc('match_collaborations', { p_user: user.id })
    .range(from, to);

  if (error) {
    console.error(error);
    return;
  }

  renderRecs(data);

  /* get total count only on first fetch to decide button visibility */
  if (recPage === 0) {
    const { data: totalRows } = await supabase
      .rpc('match_collaborations', { p_user: user.id })
      .select('id', { count: 'exact', head: true });
    toggleMore('rec-more', PAGE_SIZE < (totalRows?.count || 0));
  } else {
    // after first page, just check the length
    toggleMore('rec-more', data.length === PAGE_SIZE);
  }

  recPage++;
}

function renderRecs(rows) {
  const list = document.getElementById('rec-list');
  rows.forEach(c => {
    const div = document.createElement('div');
    div.className = 'rec';
    div.innerHTML = `
      <div class="info">
        <strong>${c.title}</strong><br>
        ${c.description}<br>
        <em>Overlap score: ${c.overlap}</em>
      </div>
    `;
    list.appendChild(div);
  });
}

/* ───────── helpers ───────── */
function toggleMore(btnId, show) {
  document.getElementById(btnId).style.display = show ? 'block' : 'none';
}

window.logout = async () => {
  await supabase.auth.signOut();
  location.href = 'login.html';
};
