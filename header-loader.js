/*****************************************************************
  header-loader.js  –  v7
  • Shared header injection
  • Debounced search + “Message” link
  • Logout, unread badge, “New Offer” for brands
  • Adds simple  [BRAND]  tag
*****************************************************************/
import { supabase } from './supabaseClient.js';

/* helper */
const tagBrand = isBrand => isBrand ? ' [BRAND]' : '';

/* inject header */
const mount = document.getElementById('global-header');
if (mount) {
  fetch('/components/header.html')
    .then(r => r.text())
    .then(html => { mount.innerHTML = html; initHeader(); })
    .catch(err => console.error('[header] load error:', err));
}

function initHeader() {
  attachSearch();
  attachLogout();
  showNewOfferIfBrand();
  startUnreadBadge();
}

/* logout */
function attachLogout(){
  const link=document.getElementById('logout-link');
  if(link) link.onclick=()=>supabase.auth.signOut().then(()=>location.href='login.html');
}

/* brand-only link */
async function showNewOfferIfBrand(){
  const link=document.getElementById('new-offer-link');
  if(!link) return;
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return;
  const {data}=await supabase.from('profiles')
    .select('is_brand').eq('user_id',session.user.id).single();
  if(data?.is_brand) link.style.display='inline';
}

/* unread DM badge */
async function startUnreadBadge(){
  const badge=document.getElementById('msg-badge');
  if(!badge) return;
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return; const myId=session.user.id;

  const refresh=async()=>{
    const {count}=await supabase.from('messages')
      .select('*',{count:'exact',head:true})
      .eq('recipient_id',myId).is('read_at',null);
    badge.style.display=count?'inline':'none';
  };
  refresh();
  supabase.channel('msg-badge-'+myId)
    .on('postgres_changes',
        {event:'INSERT',schema:'public',table:'messages',filter:`recipient_id=eq.${myId}`},
        refresh).subscribe();
}

/* search with tag */
function debounce(fn,ms=300){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),ms);};}
function escapeReg(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

function attachSearch(){
  const form=document.getElementById('search-form'),
        input=document.getElementById('search-input'),
        box=document.getElementById('search-results');
  if(!form||!input||!box) return;

  const doSearch=debounce(async()=>{
    const q=input.value.trim();
    if(q.length<2){box.textContent='';return;}

    box.textContent='Searching…';
    const {data,error}=await supabase.rpc('search_creators',{q,p_limit:20});
    if(error){box.textContent='Search error';console.error(error);return;}
    if(!data.length){box.textContent='No matches 😔';return;}

    const re=new RegExp(`(${escapeReg(q)})`,'gi');
    box.innerHTML=data.map(r=>`
      <div style="margin:8px 0;">
        <img src="${r.avatar_url||'fallback-avatar.png'}"
             style="width:32px;height:32px;border-radius:50%;vertical-align:middle">
        &nbsp;
        <a href="profile.html?u=${r.user_id}">
          ${r.full_name.replace(re,'<mark>$1</mark>')}${tagBrand(r.is_brand)}
        </a>
        &nbsp;•&nbsp;
        <a href="chat.html?u=${r.user_id}">Message</a>
        <small style="color:#666;">(${r.matched_at})</small>
      </div>`).join('');
  },300);

  input.addEventListener('input',doSearch);
  form.onsubmit=e=>e.preventDefault();
}
