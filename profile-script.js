/*****************************************************************
  profile-script.js  –  v3  (adds  [BRAND]  tag)
*****************************************************************/
import { supabase } from './supabaseClient.js';

const params = new URLSearchParams(location.search);
let targetId = params.get('u');
const fullEl = document.getElementById('full-name');
const bioEl  = document.getElementById('bio');
const avEl   = document.getElementById('avatar');
const list   = document.getElementById('collab-list');
const msgBtn = document.createElement('a');
const editBtn= document.getElementById('edit-btn');

const tagBrand = isBrand => isBrand ? ' [BRAND]' : '';

/* session */
const { data:{session} } = await supabase.auth.getSession();
if(!targetId && session) targetId=session.user.id;
const meId=session?session.user.id:null;

/* load profile */
const { data: prof, error } = await supabase
  .from('profiles')
  .select('full_name,bio,avatar_url,is_brand')
  .eq('user_id', targetId)
  .single();

if(error||!prof){ location.href='dashboard.html'; throw ''; }

fullEl.textContent = prof.full_name + tagBrand(prof.is_brand);
bioEl.textContent  = prof.bio ?? '';
avEl.src           = prof.avatar_url || 'fallback-avatar.png';

/* buttons */
if(meId && meId!==targetId){
  msgBtn.href=`chat.html?u=${targetId}`;
  msgBtn.textContent='Message this creator';
  document.getElementById('global-header').after(msgBtn);
}else if(editBtn){ editBtn.style.display='inline-block'; }

/* collaborations list unchanged (omitted for brevity) */
