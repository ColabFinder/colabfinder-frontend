/*****************************************************************
  header-loader.js  –  v2
  • Inject /components/header.html into #global-header
  • Activates search form after HTML is in the DOM
  • Adds debug logs so you can see flow in DevTools
*****************************************************************/
import { supabase } from './supabaseClient.js';

/* ---- inject header once ---- */
const mount = document.getElementById('global-header');
if (mount) {
  fetch('/components/header.html')
    .then(res => res.text())
    .then(html => {
      mount.innerHTML = html;
      console.log('[header] injected');
      attachSearchHandler();
    })
    .catch(err => console.error('[header] load error', err));
}

/* ---- search bar logic ---- */
function attachSearchHandler() {
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const box = document.getElementById('search-results');

  if (!form || !input || !box) {
    console.warn('[search] elements not found');
    return;
  }

  console.log('[search] handler attached');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q.length < 2) return;

    box.textContent = 'Searching…';

    const { data, error } = await supabase
      .rpc('search_creators', { q, p_limit: 20 });

    if (error) {
      console.error('[search] RPC error', error);
      box.textContent = 'Search error';
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      box.textContent = 'No matches 😔';
      return;
    }

    box.innerHTML = data.map(r => `
      <div style="margin:8px 0;">
        <img src="${r.avatar_url || 'fallback-avatar.png'}"
             style="width:32px;height:32px;border-radius:50%;vertical-align:middle">
        &nbsp;
        <a href="profile.html?u=${r.user_id}">${r.full_name}</a>
        <small style="color:#666;">(${r.matched_at})</small>
      </div>
    `).join('');

    console.log(`[search] found ${data.length} results for "${q}"`);
  };
}
