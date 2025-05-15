/*****************************************************************
  profile-script.js – self-fallback + fixed session scope
*****************************************************************/
import { supabase } from './supabaseClient.js';

const params   = new URLSearchParams(window.location.search);
let   targetId = params.get('u');                // ?u=<uuid>

/* ---- get current session once ---- */
const { data: { session } } = await supabase.auth.getSession();

/* ---- decide whose profile to show ---- */
if (!targetId) {
  if (!session) {
    alert('Please log in.');
    location.href = 'login.html';
    throw new Error('redirect');   // stop further execution
  }
  targetId = session.user.id;
}

/* ---------- load profile ---------- */
const { data: profile, error: pErr } = await supabase
  .from('profiles')
  .select('full_name,bio,avatar_url')
  .eq('user_id', targetId)
  .single();

if (pErr || !profile) {
  alert('Profile not found.');
  location.href = 'dashboard.html';
  throw new Error('redirect');
}

document.getElementById('full-name').textContent = profile.full_name;
document.getElementById('bio').textContent       = profile.bio ?? '';
document.getElementById('avatar').src            = profile.avatar_url || 'fallback-avatar.png';

/* ---------- load collaborations ---------- */
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
    ${
      ownsThisProfile(session, targetId)
        ? ''                                  /* hide Request on own profile */
        : `<button data-id="${c.id}">Request</button>`
    }
  `;
  const btn = el.querySelector('button');
  if (btn) btn.onclick = () => handleRequest(c.id);
  list.appendChild(el);
});

/* ---------- helpers ---------- */
function ownsThisProfile(sess, id) {
  return !!sess && sess.user && sess.user.id === id;
}

async function handleRequest(collabId) {
  if (!session) return alert('Please log in first.');

  const { error } = await supabase.from('collab_requests').insert([{
    collab_id:    collabId,
    requester_id: session.user.id,
    owner_id:     targetId,
    status:       'pending'
  }]);

  if (error) { alert('Failed: ' + error.message); return; }

  supabase.functions.invoke('mail-worker');   // fire real-time mail
  alert('Request sent!');
}
