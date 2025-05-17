/*****************************************************************
  chat-script.js  – v3.2
  • Fix: defines tagBrand helper (prevents ReferenceError)
  • All other features unchanged
*****************************************************************/
import { supabase } from './supabaseClient.js';

/* helper */
const tagBrand = isBrand => isBrand ? ' [BRAND]' : '';

/* DOM */
const qs        = new URLSearchParams(location.search);
const recipient = qs.get('u');
const msgsBox   = document.getElementById('msgs');
const form      = document.getElementById('chat-form');
const input     = document.getElementById('chat-input');
const typingDiv = document.getElementById('typing');
const seenDiv   = document.getElementById('seen');
const topic     = document.getElementById('topic');

/* session */
const { data:{session} } = await supabase.auth.getSession();
if (!session || !recipient) { location.href = 'login.html'; throw ''; }
const myId = session.user.id;

/* recipient profile */
const { data: prof } = await supabase
  .from('profiles')
  .select('full_name,avatar_url,is_brand')
  .eq('user_id', recipient)
  .single();

topic.textContent =
  `Chat with ${prof.full_name}${tagBrand(prof.is_brand)}`;

/* ----- replace loadHistory() in chat-script.js ----- */
async function loadHistory() {
  // Build OR filter on a single line (no newline / extra spaces)
  const filter =
    `and(sender_id.eq.${myId},recipient_id.eq.${recipient}),` +
    `and(sender_id.eq.${recipient},recipient_id.eq.${myId})`;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(filter)
    .order('created_at');

  if (error) { console.error(error); return; }
  if (!data)  { return; }        // safety guard

  msgsBox.innerHTML = '';
  data.forEach(m => appendMsg(m, m.sender_id === myId));
  scroll();
  showSeen(data);
}

/* realtime channel */
const chan = supabase.channel('dm-'+[myId,recipient].sort().join('-'));

chan.on('postgres_changes',
        {event:'INSERT',schema:'public',table:'messages',
         filter:`recipient_id=eq.${myId}`},
        async payload => { appendMsg(payload.new); await markRead(); })
    .on('broadcast',{event:'typing'},payload=>{
        if(payload.sender===recipient){
          typingDiv.style.display='block';
          clearTimeout(window._typeT);
          window._typeT=setTimeout(()=>typingDiv.style.display='none',1000);
        }
    })
    .subscribe();

/* send */
form.onsubmit = async e => {
  e.preventDefault();
  const text = input.value.trim(); if(!text) return;
  input.value='';
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: myId, recipient_id: recipient, body: text })
    .select('*')
    .single();
  if(error){alert(error.message);return;}
  appendMsg(data,true);
};

/* broadcast typing */
input.addEventListener('input', () =>
  chan.send({type:'broadcast',event:'typing',payload:{sender:myId}}));

/* helpers */
async function loadHistory(){
  const f = `and(sender_id.eq.${myId},recipient_id.eq.${recipient}),
             and(sender_id.eq.${recipient},recipient_id.eq.${myId})`;
  const { data } = await supabase.from('messages').select('*').or(f).order('created_at');
  msgsBox.innerHTML='';
  data.forEach(m=>appendMsg(m,m.sender_id===myId));
  scroll();
  showSeen(data);
}
function appendMsg(m,fromMe=false){
  const div=document.createElement('div');
  div.className='msg '+(fromMe?'me':'them');
  div.textContent=m.body;
  msgsBox.appendChild(div); scroll();
  if(fromMe) seenDiv.textContent='✓ sent';
  typingDiv.style.display='none';
}
function scroll(){ msgsBox.scrollTop=msgsBox.scrollHeight; }
function showSeen(arr){
  const last=arr.filter(x=>x.sender_id===myId&&x.read_at).pop();
  seenDiv.textContent=last?'Seen':'';
}
async function markRead(){
  await supabase.rpc('mark_read',{p_sender:recipient,p_recipient:myId});
  const { data } = await supabase
    .from('messages')
    .select('id,read_at,sender_id')
    .eq('sender_id', myId)
    .eq('recipient_id', recipient);
  showSeen(data);
}
