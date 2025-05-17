/*****************************************************************
  profile-script.js – v2 (adds “Message” link on other profiles)
*****************************************************************/
import { supabase } from './supabaseClient.js';

const params   = new URLSearchParams(location.search);
let   targetId = params.get('u');                // ?u=<uuid>

const { data: { session } } = await supabase.auth.getSession();
if (!targetId) {
  if (!session) { location.href = 'login.html'; throw ''; }
  targetId = session.user.id;                    // view own profile
}

const meId = session ? session.user.id : null;

/* ---- load profile ---- */
fullNameEl.textContent = profile.full_name + tagBrand(profile.is_brand);
const { data: profile, error: pErr } = await supabase
  .from('profiles')
  .select('full_name,bio,avatar_url')
  .eq('user_id', targetId)
  .single();

if (pErr || !profile) { location.href = 'dashboard.html'; throw ''; }

document.getElementById('full-name').textContent = profile.full_name;
document.getElementById('bio').textContent       = profile.bio ?? '';
document.getElementById('avatar').src            = profile.avatar_url || 'fallback-avatar.png';

/* ---- show “Message” link if viewing someone else ---- */
if (meId && meId !== targetId) {
  const link = document.createElement('a');
  link.href = `chat.html?u=${targetId}`;
  link.textContent = 'Message this creator';
  link.style.display = 'inline-block';
  link.style.marginBottom = '20px';
  document.getElementById('global-header').after(link);
}

/* ---- load collaborations ---- */
const list = document.getElementById('collab-list');
const { data: collabs, error: cErr } = await supabase
  .from('collaborations')
  .select('id,title,description,type')
  .eq('user_id', targetId)
  .order('created_at', { ascending: false });

if (cErr) { console.error(cErr); }

collabs.forEach(c => {
  const el = document.createElement('div');
  el.className = 'collab';
  el.innerHTML = `
    <h4>${c.title}</h4>
    <p>${c.description}</p>
    <p><small>Type: ${c.type}</small></p>
    ${ meId && meId !== targetId
        ? `<button data-id="${c.id}">Request</button>`
        : '' }
  `;
  const btn = el.querySelector('button');
  if (btn) btn.onclick = () => handleRequest(c.id);
  list.appendChild(el);
});

/* ---- request handler ---- */
async function handleRequest(collabId) {
  if (!session) return alert('Please log in first.');
  const { error } = await supabase.from('collab_requests').insert([{
    collab_id: collabId, requester_id: meId, owner_id: targetId, status: 'pending'
  }]);
  if (error) return alert(error.message);

  supabase.functions.invoke('mail-worker');
  alert('Request sent!');
}
