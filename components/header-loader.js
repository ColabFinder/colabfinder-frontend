/* header-loader.js  – fetch + inject header.html, then activate search */
import { supabase } from './supabaseClient.js';

/* ---- fetch header HTML once ---- */
const target = document.getElementById('global-header');
fetch('/components/header.html')
  .then(res => res.text())
  .then(html => {
    target.innerHTML = html;
    attachSearchHandler();          // activate form after DOM inserted
  });

/* ---- search handler ---- */
function attachSearchHandler() {
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const box = document.getElementById('search-results');

  if (!form || !input || !box) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q.length < 2) return;

    box.textContent = 'Searching…';

    const { data, error } = await supabase.rpc('search_creators', { q, p_limit: 20 });
    if (error) { box.textContent = 'Search error'; console.error(error); return; }

    if (!data.length) { box.textContent = 'No matches 😔'; return; }

    box.innerHTML = data.map(r => `
      <div style="margin:8px 0;">
        <img src="${r.avatar_url || 'fallback-avatar.png'}"
             style="width:32px;height:32px;border-radius:50%;vertical-align:middle">
        &nbsp;
        <a href="profile.html?u=${r.user_id}">${r.full_name}</a>
        <small style="color:#666;">(${r.matched_at})</small>
      </div>
    `).join('');
  };
}
