// Continuous gallery: shallow stone planes and raised photographic cutouts.
// Data lives in products.json; the bag is a small local module (no payment yet).
const here = new URL('./', import.meta.url);
const $ = s => document.querySelector(s);
const money = cents => '$' + (cents / 100).toFixed(cents % 100 ? 2 : 0);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const pad = n => String(n).padStart(2, '0');

const products = await (await fetch(new URL('products.json?v=5', here))).json();
for (const p of products) p.image = new URL(p.image, here).href;
for(const amount of [25,50,100])products.push({id:'gift-'+amount,name:'Gift card · $'+amount,price:amount*100,image:new URL('../../gift-gold.svg',here).href,gift:true});

/* ---------- bag ---------- */
const KEY = 'malar-viewing-room-v1';
let items = {};
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  for (const p of products) if (Number.isInteger(saved[p.id]) && saved[p.id] > 0) items[p.id] = Math.min(20, saved[p.id]);
} catch {}
const count = () => Object.values(items).reduce((a, b) => a + b, 0);
const total = () => products.reduce((sum, p) => sum + p.price * (items[p.id] || 0), 0);
function setQty(id, q) {
  q = Math.max(0, Math.min(20, q));
  if (q) items[id] = q; else delete items[id];
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  renderBag();
}

/* ---------- pieces ---------- */
const room = $('#room');
const WIDE = new Set(['lotus', 'basket']);
room.insertAdjacentHTML('beforeend','<h2 class="room-heading reveal" id="collection">Jewelry</h2>');
const pieces = products.filter(p=>!p.gift).map((p, i) => {
  if (i === 3) room.insertAdjacentHTML('beforeend','<h2 class="room-heading objects reveal" id="crafts">Objects</h2>');
  const el = document.createElement('article');
  el.className = `piece v${i + 1}`;
  el.setAttribute('aria-labelledby', 'name-' + p.id);
  el.innerHTML = `
    <div class="plate stone-front${WIDE.has(p.id) ? ' wide' : ''}" tabindex="0" role="group" aria-label="${p.name} presentation" style="--stone-pos:${[2,0,1,4,3,5][i]%3*50}% ${i<3?0:100}%">
      <div class="plate-motion"><div class="plate-stone"></div>
        <div class="object-shadow" aria-hidden="true"><img src="${p.image}" alt="" decoding="async" loading="lazy"></div>
        <div class="object-layer"><img src="${p.image}" alt="${p.name}" decoding="async" loading="lazy"></div>
      </div></div>
    <div class="text reveal">
      <p class="no">${pad(i + 1)}</p>
      <h3 id="name-${p.id}">${p.name}</h3>
      <p class="spec">${p.spec}</p>
      <p class="buy"><span class="price">${money(p.price)}</span><button class="add" type="button">Add to bag</button><span class="in-bag" aria-live="polite"></span></p>
    </div>`;
  el.querySelector('.add').onclick = () => setQty(p.id, (items[p.id] || 0) + 1);
  room.append(el);
  return {p, el, status: el.querySelector('.in-bag')};
});
const end = document.createElement('p');
end.className = 'end';
end.textContent = 'Collection study · photographs are placeholders. Checkout is a demo.';
room.insertAdjacentHTML('beforeend', `<section class="room-story" id="studio"><h2>A small studio.</h2><p>Malar means flower. Jewelry and objects, made by hand in small batches.</p></section>
<section class="room-gift" id="gift" aria-labelledby="gift-title"><div class="gift-plate"><span>malar</span><output id="gift-value">$50</output></div><div><h2 id="gift-title">Gift cards</h2><div class="gift-values" role="group" aria-label="Gift card amount"><button type="button" data-gift="25" aria-pressed="false">$25</button><button type="button" data-gift="50" aria-pressed="true">$50</button><button type="button" data-gift="100" aria-pressed="false">$100</button></div><button class="add" type="button" id="gift-add">Add to bag</button><p id="gift-added" role="status"></p></div></section>`);
let giftAmount=50;
document.querySelectorAll('[data-gift]').forEach(button=>button.addEventListener('click',()=>{giftAmount=Number(button.dataset.gift);document.querySelectorAll('[data-gift]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('#gift-value').textContent='$'+giftAmount;$('#gift-added').textContent='';}));
$('#gift-add').addEventListener('click',()=>{setQty('gift-'+giftAmount,(items['gift-'+giftAmount]||0)+1);$('#gift-added').textContent='$'+giftAmount+' gift card added';});
room.append(end);

const seen = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); }
}, {threshold: .35});
document.querySelectorAll('.reveal').forEach(el => seen.observe(el));

/* ---------- bag drawer ---------- */
const bag = $('#bag'), lines = $('#bag-lines'), note = $('#bag-note'), checkout = $('#bag-checkout');
function renderBag() {
  const focused = lines.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
  $('#bag-count').textContent = count();
  document.querySelectorAll('.night-note [data-open-bag]').forEach(el=>el.textContent='Bag · '+count());
  $('#bag-total').textContent = money(total());
  checkout.disabled = !count();
  lines.replaceChildren();
  if (!count()) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Your bag is empty.';
    lines.append(li);
  }
  for (const p of products) {
    const status=pieces.find(entry=>entry.p.id===p.id)?.status;
    const q = items[p.id] || 0;
    if(status)status.textContent = q ? `In bag · ${q}` : '';
    if (!q) continue;
    const li = document.createElement('li');
    li.innerHTML = `
      <img src="${p.image}" alt="">
      <span class="name">${p.name}</span>
      <span class="line">${money(p.price * q)}</span>
      <span class="qty">
        <button type="button" data-d="-1" aria-label="One fewer ${p.name}">−</button>
        <span aria-label="Quantity">${q}</span>
        <button type="button" data-d="1" aria-label="One more ${p.name}">+</button>
      </span>
      <button type="button" class="remove" aria-label="Remove ${p.name}">Remove</button>`;
    li.querySelectorAll('[data-d]').forEach(b => b.onclick = () => setQty(p.id, q + Number(b.dataset.d)));
    li.querySelector('.remove').onclick = () => setQty(p.id, 0);
    lines.append(li);
  }
  if(focused){const next=[...lines.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===focused);(next||lines.querySelector('button')||$('#bag-close')).focus({preventScroll:true});}
}
$('#bag-open').onclick = () => { note.textContent = ''; bag.showModal(); };
$('#bag-close').onclick = () => bag.close();
bag.addEventListener('click', e => { const r=bag.getBoundingClientRect();if(e.target===bag&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))bag.close(); });
checkout.onclick = () => {
  // TODO: payment provider. Until then this is a mock and says so.
  const sum = money(total());
  items = {};
  try { localStorage.setItem(KEY, '{}'); } catch {}
  renderBag();
  $('#bag-close').focus({preventScroll:true});
  note.textContent = `Mock order placed for ${sum}. Nothing was charged; checkout is not connected yet.`;
};
renderBag();



/* ---------- one restrained end sequence, existing upstream cutouts ---------- */
room.insertAdjacentHTML('beforeend', `<section class="night-garden" id="night-garden" aria-labelledby="night-title">
  <div class="night-stage"><div class="night-flowers" aria-hidden="true">
    <img class="night-flower rose" src="${new URL('flowers/rose-burgundy.webp',here)}" alt="" loading="lazy" decoding="async">
    <img class="night-flower lily" src="${new URL('flowers/lily-red.webp',here)}" alt="" loading="lazy" decoding="async">
    <img class="night-flower mauve" src="${new URL('flowers/rose-mauve.webp',here)}" alt="" loading="lazy" decoding="async">
  </div><div class="night-copy"><h2 id="night-title">malar</h2><p>Malar means flower.</p><a data-scroll="collection" href="#collection">Back to the collection</a></div>
  <div class="night-note"><span>Handmade jewelry &amp; objects</span><button type="button" data-open-bag>Bag · ${count()}</button></div></div>
</section>`);
function openBag(){document.querySelector('#garden-menu')?.close();note.textContent='';bag.showModal();}
document.querySelectorAll('[data-open-bag]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();openBag();}));
document.querySelectorAll('[data-scroll]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();document.querySelector('#garden-menu')?.close();document.getElementById(el.dataset.scroll)?.scrollIntoView({behavior:reduce.matches?'instant':'smooth'});}));

/* ---------- shared scroll clock, no wheel interception or scroll hijack ---------- */
const fine=matchMedia('(min-width:761px) and (pointer:fine)');
const root=document.documentElement,finale=document.querySelector('.night-garden');
const models=pieces.map(({el},i)=>({el,plate:el.querySelector('.plate'),motion:el.querySelector('.plate-motion'),text:el.querySelector('.text'),i,center:0,rect:null,x:0,y:0,focus:false,hover:false,pitch:0,yaw:0,lift:0,travel:0,objectPitch:0}));
let frame=0,last=0,finaleTop=0,viewHeight=innerHeight,visibleModels=new Set(models);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(paint);}
function measure(){
 viewHeight=innerHeight;
 models.forEach(m=>{const r=m.plate.getBoundingClientRect();m.center=scrollY+r.top+r.height/2;m.rect={x:r.left,top:scrollY+r.top,width:r.width,height:r.height};});
 finaleTop=scrollY+finale.getBoundingClientRect().top;schedule();
}
const visibility=new IntersectionObserver(entries=>{for(const entry of entries){const m=models.find(x=>x.el===entry.target);if(entry.isIntersecting)visibleModels.add(m);else visibleModels.delete(m);}schedule();},{rootMargin:'200px'});
models.forEach(m=>{
 visibility.observe(m.el);
 m.plate.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse')return;m.hover=true;schedule();});
 m.plate.addEventListener('pointermove',e=>{if(!fine.matches||reduce.matches)return;m.x=clamp((e.clientX-m.rect.x)/m.rect.width-.5,-.5,.5);m.y=clamp((e.clientY+scrollY-m.rect.top)/m.rect.height-.5,-.5,.5);schedule();});
 const leave=()=>{m.hover=false;m.x=m.y=0;schedule();};
 m.plate.addEventListener('pointerleave',leave);m.plate.addEventListener('pointercancel',leave);
 m.plate.addEventListener('focus',()=>{m.focus=true;schedule();});m.plate.addEventListener('blur',()=>{m.focus=false;schedule();});
 m.el.querySelector('.add').addEventListener('focus',()=>{m.focus=true;schedule();});m.el.querySelector('.add').addEventListener('blur',()=>{m.focus=false;schedule();});
});
function paint(now){
 frame=0;const dt=last?Math.min(50,now-last):16.67;last=now;const ease=1-Math.exp(-dt/95);let unsettled=false;
 const y=scrollY;document.querySelector('.bar').inert=y<viewHeight*.52;root.style.setProperty('--bar-visible',smooth((y-viewHeight*.5)/(viewHeight*.3)).toFixed(3));
 const dark=smooth((y+viewHeight*.88-finaleTop)/(viewHeight*.8));
 root.style.setProperty('--night',dark.toFixed(4));
 const bloom=smooth((y+viewHeight*.6-finaleTop)/(viewHeight*.68));
 finale.style.setProperty('--flower-presence',reduce.matches?'1':bloom.toFixed(4));
 finale.style.setProperty('--flower-rise',(reduce.matches?0:(1-bloom)*85).toFixed(2)+'px');
 const drift=reduce.matches?0:clamp((y-finaleTop)/viewHeight,-1,1);
 finale.style.setProperty('--rose-drift',(-drift*30).toFixed(2)+'px');finale.style.setProperty('--lily-drift',(-drift*60).toFixed(2)+'px');finale.style.setProperty('--mauve-drift',(drift*18).toFixed(2)+'px');
 for(const m of visibleModels){
  const p=clamp((y+viewHeight*.52-m.center)/(viewHeight*.85),-1,1),enabled=fine.matches&&!reduce.matches;
  const raised=enabled&&(m.hover||m.focus);
  const targets={pitch:enabled?-p*7-m.y*5:0,yaw:enabled?p*(m.i%2?1.6:-1.6)+m.x*7:0,lift:raised?-8:0,travel:enabled?p*38:0,objectPitch:enabled?-p*3:0};
  for(const key in targets){m[key]+=(targets[key]-m[key])*ease;if(Math.abs(targets[key]-m[key])>.015)unsettled=true;else m[key]=targets[key];}
  m.motion.style.setProperty('--card-travel',(m.travel+m.lift).toFixed(3)+'px');
  m.motion.style.setProperty('--card-pitch',m.pitch.toFixed(3)+'deg');m.motion.style.setProperty('--card-yaw',m.yaw.toFixed(3)+'deg');
  m.motion.style.setProperty('--object-pitch',m.objectPitch.toFixed(3)+'deg');m.motion.style.setProperty('--object-yaw',(-m.yaw*.35).toFixed(3)+'deg');
  m.motion.style.setProperty('--object-height',(25-m.lift*1.8).toFixed(3)+'px');
  m.motion.style.setProperty('--shadow-x',(5-m.yaw*.65).toFixed(3)+'px');m.motion.style.setProperty('--shadow-y',(9+m.pitch*.55-m.lift*.45).toFixed(3)+'px');
  m.text.style.setProperty('--text-travel',enabled?(-p*8).toFixed(3)+'px':'0px');
 }
 if(unsettled)schedule();else last=0;
}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure,{passive:true});
reduce.addEventListener('change',measure);fine.addEventListener('change',measure);
document.addEventListener('visibilitychange',()=>{last=0;schedule();});
new ResizeObserver(measure).observe(room);document.fonts.ready.then(measure);measure();
