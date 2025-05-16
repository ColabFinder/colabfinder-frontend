/*****************************************************************
  header-loader.js  –  v4
  • Inject shared header
  • Debounced search (300 ms)
  • Highlights query terms
  • Adds “Message” link next to each result
*****************************************************************/
import { supabase } from './supabaseClient.js';

/* ---- inject header HTML ---- */
const mount = document.getElementById('global-header');
if (mount) {
  fetch('/components/header.html')
    .then(r => r.text())
    .then(html => { mount.innerHTML = html; attachSearch(); })
    .catch(err => console.error('[header] load error:', err));
}

/* ---- debounce helper ---- */
function debounce(fn, ms = 300) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ---- search bar logic ---- */
function attachSearch() {
  const form  = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const box   = document.getElementById('search-results');
  if (!form || !input || !box) return;

  const doSearch = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) { box.textContent = ''; return; }

    box.textContent = 'Searching…';
    const { data, error } = await supabase.rpc('search_creators', { q, p_limit: 20 });
    if (error) { box.textContent = 'Search error'; console.error(error); return; }
    if (!data.length) { box.textContent = 'No matches 😔'; return; }

    const regex = new RegExp(`(${escapeReg(q)})`, 'gi');
    box.innerHTML = data.map(r => `
      <div style="margin:8px 0;">
        <img src="${r.avatar_url || 'fallback-avatar.png'}"
             style="width:32px;height:32px;border-radius:50%;vertical-align:middle">
        &nbsp;
        <a href="profile.html?u=${r.user_id}">
          ${r.full_name.replace(regex,'<mark>$1</mark>')}
        </a>
        &nbsp;•&nbsp;
        <a href="chat.html?u=${r.user_id}">Message</a>
        <small style="color:#666;">(${r.matched_at})</small>
      </div>
    `).join('');
  }, 300);

  input.addEventListener('input', doSearch);
  form.onsubmit = e => e.preventDefault();  // prevent page reload
}

/* ---- escape regex special chars ---- */
function escapeReg(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
