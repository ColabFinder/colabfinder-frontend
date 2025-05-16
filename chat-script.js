/*****************************************************************
  chat-script.js – v2  (shows recipient name)
*****************************************************************/
import { supabase } from './supabaseClient.js';

const params      = new URLSearchParams(location.search);
const recipientId = params.get('u');

const msgsBox = document.getElementById('msgs');
const form    = document.getElementById('chat-form');
const input   = document.getElementById('chat-input');
const header  = document.querySelector('h1');

const { data:{session} } = await supabase.auth.getSession();
if(!session || !recipientId){ location.href='login.html'; throw ''; }
const myId = session.user.id;

/* ---- load recipient profile for header ---- */
const { data: recProf } = await supabase
  .from('profiles')
  .select('full_name,avatar_url')
  .eq('user_id', recipientId)
  .single();

header.innerHTML = `
  Chat with <img src="${recProf?.avatar_url||'fallback-avatar.png'}"
                  style="width:32px;height:32px;border-radius:50%;vertical-align:middle">
  ${recProf?.full_name||'Unknown'}
`;

/* ---- history ---- */
loadHistory();

/* ---- realtime listener ---- */
supabase.channel('dm-'+recipientId)
  .on('postgres_changes',
      { event:'INSERT', schema:'public', table:'messages',
        filter:`recipient_id=eq.${myId}` },
      payload => appendMsg(payload.new))
  .subscribe();

/* ---- send ---- */
form.onsubmit = async e => {
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  input.value='';
  await supabase.from('messages').insert([{
    sender_id: myId, recipient_id: recipientId, body: text
  }]);
};

/* ---- helpers ---- */
async function loadHistory(){
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${myId},recipient_id.eq.${recipientId}),
          and(sender_id.eq.${recipientId},recipient_id.eq.${myId})`)
    .order('created_at', { ascending:true });
  if(error){ console.error(error); return; }
  data.forEach(appendMsg);
  scrollBottom();
}
function appendMsg(m){
  const div = document.createElement('div');
  div.className='msg'+(m.sender_id===myId?' me':'');
  div.textContent = m.body;
  msgsBox.appendChild(div);
  scrollBottom();
}
function scrollBottom(){ msgsBox.scrollTop = msgsBox.scrollHeight; }
