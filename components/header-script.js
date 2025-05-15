/*****************************************************************
  Global search handler  –  lightweight
*****************************************************************/
import { supabase } from './supabaseClient.js';

const f   = document.getElementById('search-form');
const inp = document.getElementById('search-input');
const box = document.getElementById('search-results');

if (f && inp && box) {
  f.onsubmit = async (e) => {
    e.preventDefault();
    const q = inp.value.trim();
    if (q.length < 2) return;

    box.textContent = 'Searching…';

    const { data, error } = await supabase
      .rpc('search_creators', { q, p_limit: 20 });

    if (error) { box.textContent = 'Search error'; console.error(error); return; }

    if (!data.length) { box.textContent = 'No matches 😔'; return; }

    box.innerHTML = data.map(row => `
      <div style="margin:8px 0;">
        <img src="${row.avatar_url || 'fallback-avatar.png'}"
             style="width:32px;height:32px;border-radius:50%;vertical-align:middle">
        &nbsp;
        <a href="profile.html?u=${row.user_id}">
          ${row.full_name}
        </a>
        <small style="color:#666;">(${row.matched_at})</small>
      </div>
    `).join('');
  };
}
