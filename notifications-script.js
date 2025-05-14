/*****************************************************************
  notifications-script.js  (invoke fix)
*****************************************************************/
import { supabase } from './supabaseClient.js';

const list = document.getElementById('notifications');

document.addEventListener('DOMContentLoaded', loadNotifs);

async function loadNotifs() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data } = await supabase
    .from('collab_requests')
    .select('id, status, collaborations(title)')
    .or(`owner_id.eq.${session.user.id},requester_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false });

  data.forEach(renderRow);
}

function renderRow(r) {
  const row = document.createElement('div');
  row.innerHTML = `
    <b>${r.collaborations.title}</b>
    <span>Status: ${r.status}</span>
    ${r.status === 'pending'
      ? '<button data-a="accept">Accept</button><button data-a="reject">Reject</button>'
      : ''}
  `;
  row.querySelectorAll('button').forEach(btn =>
    btn.onclick = () => act(r.id, btn.dataset.a, row)
  );
  list.appendChild(row);
}

async function act(id, a, row) {
  await supabase.from('collab_requests')
    .update({ status: a === 'accept' ? 'accepted' : 'rejected' })
    .eq('id', id);

  /* === NEW: fire worker === */
  supabase.functions.invoke('mail-worker');

  row.querySelectorAll('button').forEach(b => b.remove());
  row.querySelector('span').textContent = `Status: ${a === 'accept' ? 'accepted' : 'rejected'}`;
}
