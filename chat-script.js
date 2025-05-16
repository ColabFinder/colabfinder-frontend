/*****************************************************************
  chat-script.js
  Expects ?u=<recipient-uuid> in URL
*****************************************************************/
import { supabase } from './supabaseClient.js';

const params       = new URLSearchParams(location.search);
const recipientId  = params.get('u');
const msgsBox      = document.getElementById('msgs');
const form         = document.getElementById('chat-form');
const input        = document.getElementById('chat-input');

const { data: { session } } = await supabase.auth.getSession();
if (!session || !recipientId) {
  alert('Invalid chat URL'); location.href='dashboard.html'; throw '';
}
const myId = session.user.id;

/* ---- load existing messages ---- */
loadHistory();

/* ---- realtime listener ---- */
supabase.channel('dm-' + recipientId)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages',
        filter: `sender_id=eq.${recipientId}` }, payload => appendMsg(payload.new))
  .subscribe();

/* ---- send message ---- */
form.onsubmit = async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const { error } = await supabase.from('messages').insert([{
    sender_id: myId, recipient_id: recipientId, body: text
  }]);
  if (error) alert(error.message);
};

/* ---- helpers ---- */
async function loadHistory() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${myId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${myId})`)
    .order('created_at', { ascending: true });
  if (error) { console.error(error); return; }
  data.forEach(appendMsg);
  scrollBottom();
}
function appendMsg(m) {
  const div = document.createElement('div');
  div.className = 'msg' + (m.sender_id === myId ? ' me' : '');
  div.textContent = m.body;
  msgsBox.appendChild(div);
  scrollBottom();
}
function scrollBottom(){ msgsBox.scrollTop = msgsBox.scrollHeight; }
