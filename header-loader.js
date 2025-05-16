/*****************************************************************
  header-loader.js  –  v3
  • Inject shared header
  • Debounced search (300 ms)
  • Highlights query in results with <mark>
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

  /* live search on typing with debounce */
  input.addEventListener('input', debounce(async () => {
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
          ${r.full_name.replace(regex, '<mark>$1</mark>')}
        </a>
        <small style="color:#666;">(${r.matched_at})</small>
      </div>
    `).join('');
  }));

  /* keep Enter key from reloading the page */
  form.onsubmit = e => e.preventDefault();
}

/* ---- escape regex special chars ---- */
function escapeReg(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
