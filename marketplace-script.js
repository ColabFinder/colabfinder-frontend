/*****************************************************************
  marketplace-script.js
*****************************************************************/
import { supabase } from './supabaseClient.js';

const offersBox = document.getElementById('offers');
const btn = document.getElementById('filter-btn');
const kw  = document.getElementById('kw');
const plat= document.getElementById('plat');
const pay = document.getElementById('min-pay');

<h3>${o.title} [BRAND]</h3>

btn.onclick = loadOffers;
loadOffers();

async function loadOffers(){
  offersBox.textContent='Loading…';
  let query = supabase.from('market_offers').select('*').order('created_at',{ascending:false});

  if(plat.value) query = query.contains('platforms', [plat.value]);
  if(pay.value)  query = query.gte('payout_cents', parseInt(pay.value)*100);
  if(kw.value)   query = query.ilike('title', `%${kw.value}%`);

  const { data, error } = await query;
  if(error){ offersBox.textContent='Error'; console.error(error); return; }

  if(!data.length){ offersBox.textContent='No offers match.'; return; }

  offersBox.innerHTML = '';
  data.forEach(o=>{
    const card = document.createElement('div');
    card.className='offer';
    card.innerHTML = `
      <h3>${o.title}</h3>
      <p>${o.brief}</p>
      <p><small>Payout: $${(o.payout_cents/100).toFixed(0)} • Platforms: ${o.platforms.join(', ')} • Apply by ${o.deadline||'n/a'}</small></p>
      <button data-id="${o.id}">Apply</button>
    `;
    card.querySelector('button').onclick = ()=>apply(o.id,o.title);
    offersBox.appendChild(card);
  });
}

async function apply(id,title){
  const pitch = prompt(`Your pitch for "${title}":`);
  if(pitch===null) return;
  const { data:{session} } = await supabase.auth.getSession();
  if(!session) return alert('Please log in.');
  const { error } = await supabase.from('market_applications').insert([{
    offer_id:id,creator_id:session.user.id,pitch
  }]);
  if(error) alert(error.message); else alert('Applied!');
}
