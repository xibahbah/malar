// Light moves across the polished gift mirror; the bag uses a separate patinated bronze.
export const flowerEngraving=`<svg viewBox="0 0 100 110" fill="none" aria-hidden="true"><path d="M50 95V49M50 70C19 76 14 57 14 57C31 50 43 57 50 70ZM50 83C78 89 88 68 88 68C68 64 57 71 50 83ZM50 54C21 43 29 20 29 20C43 23 49 36 50 54ZM50 54C79 43 71 20 71 20C57 23 51 36 50 54ZM50 52C35 36 39 13 50 4C61 13 65 36 50 52Z" stroke="currentColor" stroke-width="1.2"/><path d="M21 60L47 69M80 72L53 81M33 28L48 49M67 28L52 49" stroke="currentColor" stroke-width=".5"/></svg>`;
export function mountGiftMirror(section,{reduced,onAdd,openBag}){
 const mirror=section.querySelector('.gift-mirror'),face=section.querySelector('.mirror-face'),value=section.querySelector('#gift-value'),status=section.querySelector('#gift-added'),add=section.querySelector('#gift-add');
 let amount=50,lightFrame=0,tx=50,ty=35,x=50,y=35,last=0,amountAnimations=[];
 function light(now){
  lightFrame=0;const dt=last?Math.min(60,now-last):16;last=now;const k=1-Math.exp(-dt/140);x+=(tx-x)*k;y+=(ty-y)*k;
  mirror.style.setProperty('--light-x',x.toFixed(2)+'%');mirror.style.setProperty('--light-y',y.toFixed(2)+'%');
  mirror.style.setProperty('--mirror-yaw',((x-50)*.075).toFixed(2)+'deg');mirror.style.setProperty('--mirror-pitch',((35-y)*.06).toFixed(2)+'deg');
  if(Math.abs(tx-x)+Math.abs(ty-y)>.05)lightFrame=requestAnimationFrame(light);else last=0;
 }
 function aim(e){if(reduced.matches||e.pointerType!=='mouse')return;const r=mirror.getBoundingClientRect();tx=Math.max(5,Math.min(95,(e.clientX-r.left)/r.width*100));ty=Math.max(5,Math.min(95,(e.clientY-r.top)/r.height*100));if(!lightFrame)lightFrame=requestAnimationFrame(light);}
 mirror.addEventListener('pointermove',aim);
 mirror.addEventListener('pointerleave',()=>{tx=50;ty=35;if(!lightFrame&&!reduced.matches)lightFrame=requestAnimationFrame(light);});
 section.querySelectorAll('[data-gift]').forEach(button=>button.addEventListener('click',()=>{
  const next=Number(button.dataset.gift);if(next===amount)return;
  amountAnimations.forEach(a=>a.cancel());amount=next;
  section.querySelectorAll('[data-gift]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  value.textContent='$'+amount;status.textContent='';
  if(reduced.matches)return;
  amountAnimations=[value.animate([{opacity:0,filter:'blur(5px)',transform:'translateY(9px)'},{opacity:1,filter:'blur(0px)',transform:'translateY(0)'}],{duration:620,easing:'cubic-bezier(.16,1,.3,1)'}),section.querySelector('.mirror-sweep').animate([{transform:'translateX(-145%) rotate(-24deg)',opacity:0},{opacity:.7,offset:.35},{transform:'translateX(145%) rotate(-24deg)',opacity:0}],{duration:850,easing:'cubic-bezier(.22,.61,.36,1)'})];
 }));
 add.addEventListener('click',()=>{
  if(!onAdd(amount)){status.textContent='This gift amount is already at the bag limit.';return;}
  status.textContent='$'+amount+' gift card added.';
  if(reduced.matches)return;
  face.animate([{transform:'scale(1)'},{transform:'scale(.965)',offset:.3},{transform:'scale(1)'}],{duration:650,easing:'cubic-bezier(.16,1,.3,1)'});
  const start=face.getBoundingClientRect(),target=document.querySelector('#bag-open').getBoundingClientRect();
  const token=document.createElement('div');token.className='gift-flight';token.setAttribute('aria-hidden','true');token.textContent='$'+amount;
  token.style.cssText=`left:${start.left+start.width*.5-32}px;top:${start.top+start.height*.55-38}px`;document.body.append(token);
  const flight=token.animate([{transform:'translate(0,0) scale(1)',opacity:0},{opacity:.95,offset:.15},{transform:`translate(${target.left+target.width*.5-start.left-start.width*.5}px,${target.top+target.height*.5-start.top-start.height*.55}px) scale(.18) rotate(14deg)`,opacity:0}],{duration:850,easing:'cubic-bezier(.5,0,.2,1)'});
  flight.finished.then(()=>{token.remove();document.querySelector('#bag-count').animate([{transform:'scale(1)'},{transform:'scale(1.4)'},{transform:'scale(1)'}],{duration:360});}).catch(()=>token.remove());
 });
 section.querySelector('.gift-view-bag').addEventListener('click',openBag);
 reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(lightFrame);lightFrame=0;amountAnimations.forEach(a=>a.cancel());mirror.style.setProperty('--mirror-yaw','0deg');mirror.style.setProperty('--mirror-pitch','0deg');}});
}
export const giftMirrorMarkup=`<div class="gift-mirror" aria-label="Polished metal gift mirror"><div class="mirror-crown">${flowerEngraving}</div><div class="mirror-rim"><div class="mirror-face"><div class="mirror-reflection" aria-hidden="true"></div><div class="mirror-sweep" aria-hidden="true"></div><div class="mirror-inscription"><span class="mirror-brand">malar</span><span class="mirror-type">A gift, reflected.</span><span class="mirror-flower">${flowerEngraving}</span><output id="gift-value" aria-live="polite">$50</output><span class="mirror-foot">GIFT CARD</span></div></div></div><div class="mirror-handle" aria-hidden="true"><span></span></div></div>`;
