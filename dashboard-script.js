/*****************************************************************
  dashboard-script.js – now with Request + Notifications badge
*****************************************************************/
import { supabase } from './supabaseClient.js';
const PAGE_SIZE = 6;
let collabPage = 0, recPage = 0, user = null;

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return (location.href = 'login.html');
  user = session.user;

  await loadProfile();
  await loadCollaborations();
  await loadRecommendations();
  await loadUnreadCount();

  document.getElementById('collab-more').onclick = loadCollaborations;
  document.getElementById('rec-more').onclick    = loadRecommendations;
});

/* ───── profile ───── */
async function loadProfile() {
  const { data } = await supabase
    .from('profiles')
    .select('full_name,bio,avatar_url')
    .eq('user_id', user.id).single();
  if (!data) return;
  full_name.textContent = data.full_name || '';
  email.textContent     = user.email;
  bio.textContent       = data.bio || '';
  avatar.src            = data.avatar_url || 'https://placehold.co/100x100';
}

/* ───── collaborations (paginated) ───── */
async function loadCollaborations() {
  const { data, count, error } = await supabase
    .from('collaborations')
    .select('*', { count:'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending:false })
    .range(collabPage*PAGE_SIZE, collabPage*PAGE_SIZE+PAGE_SIZE-1);
  if (error) return console.error(error);
  renderCollabs(data);
  collabPage++;
  collab_more.style.display = collabPage*PAGE_SIZE < count ? 'block':'none';
}

function renderCollabs(rows){
  rows.forEach(c=>{
    const div=document.createElement('div');div.className='collab';
    div.innerHTML=`
      <div class="info"><strong>${c.title}</strong><br>${c.description}<br><em>Type: ${c.type}</em></div>
      <button class="btn edit">Edit</button>
      <button class="btn delete">Delete</button>`;
    const [editBtn,delBtn]=div.querySelectorAll('button');
    editBtn.onclick=()=>location.href=`edit-collaboration.html?id=${c.id}`;
    delBtn.onclick =()=>confirmDelete(c.id,div);
    collab_list.appendChild(div);
  });
}

async function confirmDelete(id,node){
  if(!confirm('Delete this collaboration?'))return;
  const { error } = await supabase.from('collaborations').delete().eq('id',id);
  if(error) alert('Delete failed: '+error.message); else node.remove();
}

/* ───── recommendations with Request ───── */
async function loadRecommendations(){
  const { data, error } = await supabase
    .rpc('match_collaborations',{p_user:user.id})
    .range(recPage*PAGE_SIZE, recPage*PAGE_SIZE+PAGE_SIZE-1);
  if(error){console.error(error);return;}
  data.forEach(c=>{
    const div=document.createElement('div');div.className='rec';
    div.innerHTML=`
      <div class="info"><strong>${c.title}</strong><br>${c.description}<br><em>Overlap: ${c.overlap}</em></div>
      <button class="btn request">Request</button>`;
    div.querySelector('.request').onclick=()=>sendRequest(c.id,c.title);
    rec_list.appendChild(div);
  });
  rec_more.style.display = data.length===PAGE_SIZE ? 'block':'none';
  recPage++;
}

async function sendRequest(collabId,title){
  const message = prompt(`Request "${title}" – add a note for the owner (optional):`);
  const { error } = await supabase.from('collab_requests').insert([{
    collab_id: collabId,
    owner_id:  null,              // will be filled by trigger FK
    requester_id: user.id,
    message
  }]);
  if(error) alert('Request failed: '+error.message);
  else { alert('Request sent!'); await loadUnreadCount(); }
}

/* ───── notifications badge ───── */
async function loadUnreadCount(){
  const { count } = await supabase
    .from('notifications')
    .select('*', { count:'exact', head:true })
    .eq('user_id', user.id)
    .eq('is_read', false);
  notif_count.textContent = count>0 ? ` (${count})` : '';
}

/* ───── logout ───── */
window.logout=async()=>{await supabase.auth.signOut();location.href='login.html';};
