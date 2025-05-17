/*****************************************************************
  marketplace-script.js  –  v2  (titles include  [BRAND])
*****************************************************************/
import { supabase } from './supabaseClient.js';

const offersBox=document.getElementById('offers');
const btn=document.getElementById('filter-btn');
const kw=document.getElementById('kw');
const plat=document.getElementById('plat');
const pay=document.getElementById('min-pay');

btn.onclick=loadOffers; loadOffers();

function tagBrand(){ return ' [BRAND]'; }   // offers always by brand

async function loadOffers(){
  offersBox.textContent='Loading…';
  let q=supabase.from('market_offers').select('*').order('created_at',{ascending:false});
  if(plat.value) q=q.contains('platforms',[plat.value]);
  if(pay.value)  q=q.gte('payout_cents',parseInt(pay.value)*100);
  if(kw.value)   q=q.ilike('title',`%${kw.value}%`);
  const {data,error}=await q;
  if(error){offersBox.textContent='Error';console.error(error);return;}
  if(!data.length){offersBox.textContent='No offers match.';return;}

  offersBox.innerHTML='';
  data.forEach(o=>{
    offersBox.insertAdjacentHTML('beforeend',`
      <div class="offer">
        <h3>${o.title}${tagBrand()}</h3>
        <p>${o.brief}</p>
        <p><small>Payout: $${(o.payout_cents/100).toFixed(0)} • Platforms: ${o.platforms.join(', ')} • Apply by ${o.deadline||'n/a'}</small></p>
        <button data-id="${o.id}">Apply</button>
      </div>`);
  });
  document.querySelectorAll('.offer button').forEach(b=>b.onclick=apply);
}

async function apply(e){
  const id=e.target.dataset.id;
  const card=e.target.closest('.offer');
  const title=card.querySelector('h3').textContent;
  const pitch=prompt(`Your pitch for "${title}":`);
  if(pitch===null) return;
  const {data:{session}}=await supabase.auth.getSession();
  if(!session) return alert('Please log in.');
  const {error}=await supabase.from('market_applications').insert({
    offer_id:id,creator_id:session.user.id,pitch
  });
  if(error) alert(error.message); else alert('Applied!');
}
