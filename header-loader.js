/*****************************************************************
  header-loader.js  –  v6  (brand-aware)
  • Injects /components/header.html into #global-header
  • Debounced search (300 ms) with term highlight + “Message” link
  • Logout link
  • Unread DM badge (real-time)
  • Shows “New Offer” link only if profile.is_brand = true
*****************************************************************/
import { supabase } from './supabaseClient.js';

const tagBrand = isBrand => isBrand ? ' [BRAND]' : '';
}

/* ----------------------------------------------------------------
   1. Inject shared header HTML
---------------------------------------------------------------- */
const mount = document.getElementById('global-header');
if (mount) {
  fetch('/components/header.html')
    .then(r => r.text())
    .then(html => {
      mount.innerHTML = html;
      initHeader();
    })
    .catch(err => console.error('[header] load error:', err));
}

/* ----------------------------------------------------------------
   2. Initialise header features after HTML is in DOM
---------------------------------------------------------------- */
function initHeader() {
  attachSearch();
  attachLogout();
  showNewOfferIfBrand();
  startUnreadBadge();
}

/* ----------------------------------------------------------------
   3. Logout handler
---------------------------------------------------------------- */
function attachLogout() {
  const link = document.getElementById('logout-link');
  if (link) {
    link.onclick = () =>
      supabase.auth.signOut()
        .then(() => location.href = 'login.html');
  }
}

/* ----------------------------------------------------------------
   4. Show “New Offer” link only for brand users
---------------------------------------------------------------- */
async function showNewOfferIfBrand() {
  const link = document.getElementById('new-offer-link');
  if (!link) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('is_brand')
    .eq('user_id', session.user.id)
    .single();

  if (!error && data?.is_brand) link.style.display = 'inline';
}

/* ----------------------------------------------------------------
   5. Unread DM badge – live update
---------------------------------------------------------------- */
async function startUnreadBadge() {
  const badge = document.getElementById('msg-badge');
  if (!badge) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const myId = session.user.id;

  const refresh = async () => {
    const { count } = await supabase
      .from('messages')
      .select('*', { head: true, count: 'exact' })
      .eq('recipient_id', myId)
      .is('read_at', null);

    badge.style.display = count ? 'inline' : 'none';
  };

  // initial count
  refresh();

  // realtime – any new message addressed to me
  supabase.channel('msg-badge-' + myId)
    .on('postgres_changes',
        { event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${myId}` },
        refresh)
    .subscribe();
}

/* ----------------------------------------------------------------
   6. Search bar with debounce + highlight
---------------------------------------------------------------- */
function debounce(fn, ms = 300) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function attachSearch() {
  const form  = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const box   = document.getElementById('search-results');
  if (!form || !input || !box) return;

  /** run search after debounce */
  const doSearch = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) { box.textContent = ''; return; }

    box.textContent = 'Searching…';
    const { data, error } = await supabase.rpc('search_creators', { q, p_limit: 20 });

    if (error)  { box.textContent = 'Search error'; console.error(error); return; }
    if (!data.length) { box.textContent = 'No matches 😔'; return; }

    const regex = new RegExp(`(${escapeReg(q)})`, 'gi');
    box.innerHTML = data.map(r => `
      <div style="margin:8px 0;">
        <img src="${r.avatar_url || 'fallback-avatar.png'}"
             style="width:32px;height:32px;border-radius:50%;vertical-align:middle">
        &nbsp;
        <a href="profile.html?u=${r.user_id}">
         ${r.full_name.replace(regex,'<mark>$1</mark>')}${tagBrand(r.is_brand)}
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

function escapeReg(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
