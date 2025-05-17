/*****************************************************************
  chat-script.js  – v3.1
  • Fixes TypeError: arr.filter is not a function
  • Typing indicator, read receipts, nicer layout
*****************************************************************/
import { supabase } from './supabaseClient.js';

const q           = new URLSearchParams(location.search);
const recipientId = q.get('u');

const msgsBox   = document.getElementById('msgs');
const form      = document.getElementById('chat-form');
const input     = document.getElementById('chat-input');
const typingDiv = document.getElementById('typing');
const seenDiv   = document.getElementById('seen');
const topic     = document.getElementById('topic');

const { data:{session} } = await supabase.auth.getSession();
if (!session || !recipientId) { location.href = 'login.html'; throw ''; }
const myId = session.user.id;

/* ---- recipient profile ---- */
const { data: prof } = await supabase
  .from('profiles')
  .select('full_name,avatar_url')
  .eq('user_id', recipientId)
  .single();

topic.innerHTML = `
  <img src="${prof?.avatar_url||'fallback-avatar.png'}"
       style="width:32px;height:32px;border-radius:50%;vertical-align:middle">
  Chat with ${prof?.full_name||'Unknown'}
`;

topic.textContent = `Chat with ${prof.full_name}${tagBrand(prof.is_brand)}`;

/* ---- load history & mark read ---- */
await loadHistory();
await markRead();

/* ---- realtime channel ---- */
const chan = supabase.channel('dm-'+[myId,recipientId].sort().join('-'));

chan.on('postgres_changes',
        { event:'INSERT', schema:'public', table:'messages',
          filter:`recipient_id=eq.${myId}` },
        async payload => {
          appendMsg(payload.new);
          await markRead();
        })
    .on('broadcast',{event:'typing'},payload=>{
        if(payload.sender===recipientId){
          typingDiv.style.display='block';
          clearTimeout(window._typeT);
          window._typeT=setTimeout(()=>typingDiv.style.display='none',1000);
        }
    })
    .subscribe();

/* ---- send ---- */
form.onsubmit = async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: myId, recipient_id: recipientId, body: text })
    .select('*')
    .single();

  if (error) { alert(error.message); return; }

  appendMsg(data, true);
};

/* ---- typing indicator broadcast ---- */
input.addEventListener('input', () =>
  chan.send({ type:'broadcast', event:'typing', payload:{ sender: myId } })
);

/* ---------- helpers ---------- */
async function loadHistory() {
  const filter =
    `and(sender_id.eq.${myId},recipient_id.eq.${recipientId}),` +
    `and(sender_id.eq.${recipientId},recipient_id.eq.${myId})`;

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(filter)
    .order('created_at');

  if (error) { console.error(error); return; }

  msgsBox.innerHTML = '';
  data.forEach(m => appendMsg(m, m.sender_id === myId));
  scrollBottom();
  showSeen(data);
}

function appendMsg(m, fromMe = false) {
  const div = document.createElement('div');
  div.className = 'msg ' + (fromMe ? 'me' : 'them');
  div.textContent = m.body;
  msgsBox.appendChild(div);
  scrollBottom();
  if (fromMe) showCheck();
  typingDiv.style.display = 'none';
}

function scrollBottom() { msgsBox.scrollTop = msgsBox.scrollHeight; }

function showCheck()   { seenDiv.textContent = '✓ sent'; }

function showSeen(arr) {
  const last = arr?.filter(x => x.sender_id === myId && x.read_at).pop();
  seenDiv.textContent = last ? 'Seen' : '';
}

/* ---- mark all received msgs as read ---- */
async function markRead() {
  await supabase.rpc('mark_read', { p_sender: recipientId, p_recipient: myId });

  const { data } = await supabase
    .from('messages')
    .select('id,read_at,sender_id')
    .eq('sender_id', myId)
    .eq('recipient_id', recipientId);

  showSeen(data);
}
