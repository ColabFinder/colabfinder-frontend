/*****************************************************************
  notifications-script.js – full replacement
  • Lists incoming / outgoing requests
  • Lets owner Accept / Reject
  • NEW: triggers mail-worker after status change
*****************************************************************/
import { supabase } from './supabaseClient.js';

const list = document.getElementById('notifications');

document.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data, error } = await supabase
    .from('collab_requests')
    .select('id,collab_id,collaborations(title),status')
    .or(`owner_id.eq.${session.user.id},requester_id.eq.${session.user.id}`)
    .order('created_at', { ascending: false });

  if (error) { console.error(error); return; }

  data.forEach(renderRow);
});

function renderRow(req) {
  const row = document.createElement('div');
  row.className = 'notif-row';
  row.innerHTML = `
    <strong>${req.collaborations.title}</strong>
    <span>Status: ${req.status}</span>
    ${
      req.status === 'pending'
        ? '<button data-action="accept">Accept</button>' +
          '<button data-action="reject">Reject</button>'
        : ''
    }
  `;
  row.querySelectorAll('button').forEach(btn =>
    btn.onclick = () => handleAction(req.id, btn.dataset.action, row)
  );
  list.appendChild(row);
}

async function handleAction(id, action, row) {
  const { error } = await supabase
    .from('collab_requests')
    .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
    .eq('id', id);

  if (error) return alert('Failed: ' + error.message);

  /* ---- NEW kick mail-worker so requester gets e-mail ---- */
  fetch('/functions/v1/mail-worker', { method: 'POST' });

  row.querySelectorAll('button').forEach(b => b.remove());
  row.querySelector('span').textContent =
    `Status: ${action === 'accept' ? 'accepted' : 'rejected'}`;
}
