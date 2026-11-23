// Continuous gallery: shallow stone planes and raised photographic cutouts.
// Data lives in products.json; the bag is a small local module (no payment yet).
const here = new URL('./', import.meta.url);
import {layers,scrollPose,follow,clamp,smooth,endingPose} from './scroll-motion.js?v=3';
import {createMomentum} from './momentum.js?v=4';
import {mountGiftCard,giftCardMarkup} from './metal.js?v=3';
import {mountCollectionCamera} from './collection-camera.js?v=5';
import {mountBotanical} from './botanical.js?v=3';
const $ = s => document.querySelector(s);
import {products, money, mountCommerce} from './commerce.js';
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const momentum=createMomentum(reduce);
const pad = n => String(n).padStart(2, '0');

/* ---------- pieces ---------- */
const room = $('#room');
const content = room.querySelector('.collection-content');
const WIDE = new Set(['lotus', 'basket']);
content.insertAdjacentHTML('beforeend','<h2 class="room-heading reveal" id="collection">Jewelry</h2>');
const pieces = products.filter(p=>!p.gift).map((p, i) => {
  if (i === 3) content.insertAdjacentHTML('beforeend','<h2 class="room-heading objects reveal" id="crafts">Objects</h2>');
  const el = document.createElement('article');
  el.className = `piece v${i + 1}`;
  el.id = 'piece-' + p.id;
  el.setAttribute('aria-labelledby', 'name-' + p.id);
  el.innerHTML = `
    <div class="plate stone-front${WIDE.has(p.id) ? ' wide' : ''}" tabindex="0" role="group" aria-label="${p.name} presentation" style="--stone-pos:${[2,0,1,4,3,5][i]%3*50}% ${i<3?0:100}%">
      <div class="plate-motion"><div class="plate-stone"></div>
        <div class="object-shadow" aria-hidden="true"><img src="${p.image}" alt="" decoding="async" loading="lazy"></div>
        <div class="object-layer"><img src="${p.image}" alt="${p.name}" decoding="async" fetchpriority="low"></div>
      </div></div>
    <div class="text">
      <p class="no">${pad(i + 1)}</p>
      <h3 id="name-${p.id}" tabindex="-1">${p.name}</h3>
      <p class="spec">${p.spec}</p>
      <p class="buy"><span class="price">${money(p.price)}</span><button class="add" type="button">Add to bag</button><span class="in-bag" aria-live="polite"></span></p>
    </div>`;
  el.querySelector('.add').onclick = e => addItem(p.id, e.currentTarget);
  content.append(el);
  return {p, el, status: el.querySelector('.in-bag')};
});
const end = document.createElement('p');
end.className = 'end';
end.textContent = 'Collection study · photographs are placeholders. Checkout is a demo.';
content.insertAdjacentHTML('beforeend', `<section class="room-story" id="studio"><h2>A small studio.</h2><p>Malar means flower. Jewelry and objects, made by hand in small batches.</p></section>
<section class="room-gift" id="gift" aria-labelledby="gift-title">${giftCardMarkup}<div class="gift-details"><p class="gift-eyebrow">A small gesture</p><h2 id="gift-title">Gift cards</h2><p class="gift-description">Something beautiful.<br>Chosen by them.</p><p class="gift-amount-label" id="gift-amount-label">Choose an amount</p><div class="gift-values" role="group" aria-labelledby="gift-amount-label"><button type="button" data-gift="25" aria-pressed="false">$25</button><button type="button" data-gift="50" aria-pressed="true">$50</button><button type="button" data-gift="100" aria-pressed="false">$100</button></div><button class="add" type="button" id="gift-add">Add to bag <span aria-hidden="true">↗</span></button><p id="gift-added" role="status"></p></div></section>`);
const bar = $('.bar');
const {addItem, openBag, count, bag, nav, setMenu} = mountCommerce({
  pausePage() { camera.dismiss(); momentum.stop(); },
  resumePage: schedule,
  productStatus: id => pieces.find(entry => entry.p.id === id)?.status
});
mountGiftCard($('#gift'), reduce, addItem);
content.append(end);

const seen = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); }
}, {threshold: .35});
document.querySelectorAll('.reveal').forEach(el => seen.observe(el));





/* ---------- black interval → typography → timed botanical entrance ---------- */
room.insertAdjacentHTML('beforeend', `<section class="night-garden" id="night-garden" aria-labelledby="night-title">
  <div class="night-stage"><div class="night-flowers" aria-hidden="true">
  </div><div class="night-copy"><p class="night-eyebrow">Malar · A small studio</p><h2 id="night-title">Malar means flower.</h2><a data-scroll="collection" href="#collection">Back to the collection</a></div>
  <div class="night-note"><span>Handmade jewelry &amp; objects</span><button type="button" data-open-bag>Bag · ${count()}</button></div></div>
</section>`);
document.querySelectorAll('[data-open-bag]').forEach(el => el.addEventListener('click', e => {
  e.preventDefault();
  openBag(el);
}));
function goToSection(id) {
  const destination = document.getElementById(id);
  if (destination) momentum.go(id === 'garden' ? 0 : camera.pageTop(destination) - Math.min(110, innerHeight * .12));
}
document.querySelectorAll('[data-scroll]').forEach(el => el.addEventListener('click', e => {
  e.preventDefault();
  if (bag.open) bag.close();
  if (!nav.hidden) setMenu(false, nav.contains(document.activeElement));
  goToSection(el.dataset.scroll);
}));

/* ---------- one clock for paired foreground motion and the timed ending ---------- */
const fine=matchMedia('(min-width:761px) and (min-height:360px) and (pointer:fine)');
const root=document.documentElement,finale=document.querySelector('.night-garden');
const models=pieces.map(({el},i)=>({el,plate:el.querySelector('.plate'),motion:el.querySelector('.plate-motion'),text:el.querySelector('.text'),layer:layers[i],i,center:0,rect:null,x:0,y:0,focus:false,hover:false,pitch:0,yaw:0,lift:0,travel:0,textTravel:0,objectPitch:0,initialized:false}));
let frame=0,last=0,finaleTop=0,viewHeight=innerHeight,finaleHeight=0,endingStarted=null,wallHidden=false;
const camera=mountCollectionCamera(room.querySelector('.collection-track'),pieces,{wake:schedule,stopNavigation:momentum.stop});
const hero=document.querySelector('.hero'), axis=document.querySelector('.axis');
const flowerGarden=finale.querySelector('.night-flowers');
const botanical=mountBotanical(flowerGarden,here,reduce,schedule);
const nightCopy=finale.querySelector('.night-copy'),nightNote=finale.querySelector('.night-note');
function schedule(){if(!frame&&!document.hidden)frame=requestAnimationFrame(paint);}
function measure(){
 viewHeight=innerHeight;
 const animated=fine.matches&&!reduce.matches;
 camera.measure(animated);
 if(!animated){
  for(const m of models){
   m.motion.removeAttribute('style');m.text.removeAttribute('style');
   m.initialized=false;m.travel=m.lift=0;
  }
 }
 models.forEach(m=>{
  const pageTop=camera.pageTop(m.plate);
  m.center=pageTop+m.plate.offsetHeight/2;
  m.rect={x:m.plate.getBoundingClientRect().left,top:pageTop,width:m.plate.offsetWidth,height:m.plate.offsetHeight};
 });
 finaleTop=scrollY+finale.getBoundingClientRect().top;finaleHeight=finale.offsetHeight;botanical.measure();schedule();
}
models.forEach(m=>{
 m.motion.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse')return;m.hover=true;schedule();});
 m.motion.addEventListener('pointermove',e=>{if(!fine.matches||reduce.matches)return;m.x=clamp((e.clientX-m.rect.x)/m.rect.width-.5,-.5,.5);m.y=clamp((e.clientY+sceneY-m.rect.top-m.travel-m.lift)/m.rect.height-.5,-.5,.5);schedule();});
 const leave=()=>{m.hover=false;m.x=m.y=0;schedule();};
 m.motion.addEventListener('pointerleave',leave);m.motion.addEventListener('pointercancel',leave);
 m.plate.addEventListener('focus',()=>{m.focus=true;schedule();});m.plate.addEventListener('blur',()=>{m.focus=false;schedule();});
 m.el.querySelector('.add').addEventListener('focus',()=>{m.focus=true;schedule();});m.el.querySelector('.add').addEventListener('blur',()=>{m.focus=false;schedule();});
});
let sceneY=scrollY;
function setVariable(element,key,value){
 if(element.style.getPropertyValue(key)!==value)element.style.setProperty(key,value);
}
function paint(now){
 frame=0;const dt=last?Math.min(50,now-last):16.67;last=now;let unsettled=false;
 if(bag.open){last=0;return;}
 const nativeY=scrollY;
 const enabled=fine.matches&&!reduce.matches;
 const cameraFrame=camera.paint(nativeY,now,momentum.active);
 const y=sceneY=cameraFrame.y;
 unsettled=cameraFrame.moving;
 if(hero.setGalleryScroll)hero.setGalleryScroll(y);
 axis.style.translate=nativeY<viewHeight*2?'0 '+(nativeY-y).toFixed(2)+'px':'';
 axis.style.opacity=cameraFrame.detail<1?String(cameraFrame.detail):'';
 bar.classList.toggle('show-mark',y>viewHeight*.6);
 const entry=y-finaleTop;
 if(entry>=viewHeight*.85&&endingStarted===null)endingStarted=now;
 if(entry<viewHeight*.3)endingStarted=null;
 const elapsed=endingStarted===null?0:now-endingStarted;
 const ending=endingPose(y,finaleTop,viewHeight,reduce.matches?10000:elapsed);
 setVariable(root,'--night',ending.dark.toFixed(4));
 if(wallHidden&&ending.dark<.999)dispatchEvent(new Event('malar:wall-wake'));
 wallHidden=ending.dark>=.999;
 setVariable(finale,'--copy-presence',ending.copy.toFixed(4));
 setVariable(finale,'--note-presence',ending.note.toFixed(4));
 flowerGarden.style.opacity=ending.gate.toFixed(4);flowerGarden.inert=ending.gate<.05;
 const inEnding=entry>viewHeight*.3&&entry<finaleHeight;
 nightCopy.inert=ending.copy<.05;nightNote.inert=ending.note<.05;
 flowerGarden.classList.toggle('in-view',ending.gate>.05);
 if(inEnding||ending.gate>0){
  const stemsMoving=botanical.paint(elapsed,ending.gate,dt);
  const entering=endingStarted!==null&&elapsed<6400;
  if(!reduce.matches&&(entering||stemsMoving))unsettled=true;
 }
 if(enabled)for(const m of models){
  if(cameraFrame.detail===1&&Math.abs(m.center-y-viewHeight*.5)>viewHeight*1.3+m.rect.height*.5){m.initialized=false;continue;}
  const pose=scrollPose(m.layer,y,m.center,viewHeight,m.rect.height);
  const phase=pose.phase;
  m.travel=pose.travel*cameraFrame.detail;
  m.textTravel=pose.textTravel*cameraFrame.detail;
  const targets={
   pitch:(pose.pitch-m.y*5)*cameraFrame.detail,
   yaw:(phase*(m.i%2?1.6:-1.6)+m.x*7)*cameraFrame.detail,
   lift:(m.hover||m.focus?-8:0)*cameraFrame.detail,
   objectPitch:-phase*3*cameraFrame.detail
  };
  for(const key in targets){
   const target=targets[key];
   m[key]=m.initialized?follow(m[key],target,dt,m.layer.settle):target;
   if(Math.abs(target-m[key])>.015)unsettled=true;
   else m[key]=target;
  }
  m.initialized=true;
  setVariable(m.motion,'--card-travel',(m.travel+m.lift).toFixed(3)+'px');
  setVariable(m.motion,'--card-pitch',m.pitch.toFixed(3)+'deg');setVariable(m.motion,'--card-yaw',m.yaw.toFixed(3)+'deg');
  setVariable(m.motion,'--object-pitch',m.objectPitch.toFixed(3)+'deg');setVariable(m.motion,'--object-yaw',(-m.yaw*.35).toFixed(3)+'deg');
  setVariable(m.motion,'--object-height',(25-m.lift*1.8).toFixed(3)+'px');
  setVariable(m.motion,'--shadow-x',(5-m.yaw*.65).toFixed(3)+'px');setVariable(m.motion,'--shadow-y',(9+m.pitch*.55-m.lift*.45).toFixed(3)+'px');
  setVariable(m.text,'--text-travel',m.textTravel.toFixed(3)+'px');
 }
 if(unsettled)schedule();else last=0;
}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure,{passive:true});
reduce.addEventListener('change',measure);fine.addEventListener('change',measure);
document.addEventListener('visibilitychange',()=>{last=0;schedule();});
const dimensions=new ResizeObserver(measure);
dimensions.observe(content);dimensions.observe(room);
document.fonts.ready.then(measure);measure();
const initialId=location.hash.slice(1);
if(initialId==='bag')openBag($('#bag-open'));
else if(initialId && document.getElementById(initialId)){
 const section=document.getElementById(initialId);
 const anchor=section.matches('.piece') ? section.querySelector('.plate') : section;
 const inset=anchor===section ? 90 : (innerHeight-anchor.offsetHeight)/2;
 window.scrollTo({top:Math.max(0,camera.pageTop(anchor)-inset),behavior:'instant'});
 camera.snap(scrollY);schedule();
}
