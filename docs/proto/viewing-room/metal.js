// Wrinkled gold-leaf gift card, independent from the smooth bronze drawer.
import {mountFoil} from './gift-foil.js?v=1';
export const flowerEngraving=`<svg viewBox="0 0 100 110" fill="none" aria-hidden="true"><path d="M50 95V49M50 70C19 76 14 57 14 57C31 50 43 57 50 70ZM50 83C78 89 88 68 88 68C68 64 57 71 50 83ZM50 54C21 43 29 20 29 20C43 23 49 36 50 54ZM50 54C79 43 71 20 71 20C57 23 51 36 50 54ZM50 52C35 36 39 13 50 4C61 13 65 36 50 52Z" stroke="currentColor" stroke-width="1.2"/><path d="M21 60L47 69M80 72L53 81M33 28L48 49M67 28L52 49" stroke="currentColor" stroke-width=".5"/></svg>`;
export function mountGiftMirror(section,{reduced,onAdd,openBag}){
 const mirror=section.querySelector('.gift-mirror'),face=section.querySelector('.mirror-face'),value=section.querySelector('#gift-value'),status=section.querySelector('#gift-added'),add=section.querySelector('#gift-add');
 const foil=mountFoil(face,reduced);
 let amount=50,amountAnimations=[];
 section.querySelectorAll('[data-gift]').forEach(button=>button.addEventListener('click',()=>{
  const next=Number(button.dataset.gift);if(next===amount)return;
  amountAnimations.forEach(a=>a.cancel());amount=next;
  section.querySelectorAll('[data-gift]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  value.textContent='$'+amount;foil.amount(amount);status.textContent='';
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
 reduced.addEventListener('change',()=>{if(reduced.matches)amountAnimations.forEach(a=>a.cancel());});
}
export const giftMirrorMarkup=`<div class="gift-mirror gift-foil" aria-label="Wrinkled gold-leaf gift card"><div class="mirror-face"><canvas class="foil-canvas" aria-hidden="true"></canvas><div class="mirror-sweep" aria-hidden="true"></div><div class="mirror-inscription"><span class="mirror-brand">malar</span><span class="mirror-type">A small gesture.</span><output id="gift-value" aria-live="polite">$50</output><span class="mirror-foot">GIFT CARD</span></div></div></div>`;
