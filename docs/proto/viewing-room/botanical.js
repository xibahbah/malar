import {clamp,smooth} from './scroll-motion.js?v=3';

// A layered, asymmetrical frame. Central type remains clear of the blooms.
export const stems=[
 ['lily-red',-10,18,34,86,-22,0],
 ['rose-burgundy',5,23,24,88,-12,2],
 ['rose-mauve',17,51,20,65,18,4],
 ['lily-red',-5,62,32,64,27,5],
 ['rose-burgundy',29,74,18,57,-24,8],
 ['lily-red',75,22,35,88,18,1],
 ['rose-burgundy',73,44,24,84,19,3],
 ['rose-mauve',63,65,22,66,-14,6],
 ['lily-red',83,66,29,65,-27,7],
 ['rose-mauve',13,-34,23,66,168,10],
 ['rose-burgundy',42,-43,22,73,186,11],
 ['lily-red',72,-34,31,66,155,9],
 ['lily-red',-11,-31,31,74,145,12]
];
export const bloomProgress=(elapsed,order)=>smooth((elapsed-1400-order*95)/3400);
export function springStep(position,velocity,target,dt){
 // Analytical underdamped spring: a small overshoot, independent of frame rate.
 const omega=10,damping=5,frequency=Math.sqrt(omega*omega-damping*damping);
 const x=position-target,b=(velocity+damping*x)/frequency;
 const decay=Math.exp(-damping*dt),s=Math.sin(frequency*dt),c=Math.cos(frequency*dt);
 return {position:target+decay*(x*c+b*s),velocity:decay*((-damping*x+frequency*b)*c+(-damping*b-frequency*x)*s)};
}
export function mountBotanical(container,base,reduced){
 container.innerHTML=stems.map(([asset,x,y,w,h,angle,order],i)=>`<div class="flower-place stem-${i}" style="--x:${x}%;--y:${y}%;--w:${w}%;--h:${h}%;--stem-angle:${angle}deg;--layer:${order%3}"><div class="flower-reveal"><img class="night-flower" src="${new URL('flowers/'+asset+'.webp',base)}" alt="" draggable="false" decoding="async"></div></div>`).join('');
 const flowers=[...container.children].map((el,i)=>({el,img:el.querySelector('img'),i,x:0,y:0,vx:0,vy:0,lift:0,tx:0,ty:0,cx:0,cy:0}));
 let pointer=null,drag=null,stageRect=null;
 function measure(){
  stageRect=container.getBoundingClientRect();
  flowers.forEach(f=>{const r=f.el.getBoundingClientRect();f.cx=r.x+r.width*.5-f.x-stageRect.x;f.cy=r.y+r.height*.3-f.y-stageRect.y;});
 }
 container.parentElement.addEventListener('pointermove',e=>{
  if(reduced.matches||e.pointerType!=='mouse')return;
  pointer={x:e.clientX,y:e.clientY};
  if(drag){drag.f.tx=clamp(drag.x+e.clientX-drag.px,-240,240);drag.f.ty=clamp(drag.y+e.clientY-drag.py,-180,180);}
 });
 container.parentElement.addEventListener('pointerleave',()=>{pointer=null;});
 function release(){if(!drag)return;drag.f.el.classList.remove('picked');drag.f.tx=drag.f.ty=0;drag=null;}
 flowers.forEach(f=>{
  f.el.addEventListener('pointerdown',e=>{
   if(e.pointerType!=='mouse'||reduced.matches)return;
   e.preventDefault();pointer=null;drag={f,px:e.clientX,py:e.clientY,x:f.x,y:f.y};f.el.classList.add('picked');f.el.setPointerCapture(e.pointerId);
  });
  f.el.addEventListener('pointerup',()=>{pointer=null;release();});
  f.el.addEventListener('pointercancel',release);f.el.addEventListener('lostpointercapture',release);
 });
 return {measure,paint(elapsed,gate,dt){
  if(!stageRect)measure();
  flowers.forEach(f=>{
   const progress=reduced.matches?1:bloomProgress(elapsed,stems[f.i][6]);
   const visible=progress*gate;
   f.el.style.setProperty('--bloom',visible.toFixed(4));
   f.el.style.setProperty('--enter-y',((1-progress)*95).toFixed(2)+'px');
   f.el.style.setProperty('--enter-turn',((1-progress)*(f.i%2?16:-16)).toFixed(2)+'deg');
   f.el.style.setProperty('--bloom-scale',(.76+.24*progress).toFixed(4));
   f.el.style.pointerEvents=visible>.4?'auto':'none';
   const picked=drag?.f===f;
   let tx=picked?f.tx:0,ty=picked?f.ty:0;
   if(pointer&&!drag&&gate>.8){
    // The ending is sticky; coordinates are local to the viewport once entered.
    const dx=f.cx-pointer.x,dy=f.cy-pointer.y,distance=Math.hypot(dx,dy),strength=Math.max(0,1-distance/230);
    tx=dx/Math.max(distance,1)*strength*95;ty=dy/Math.max(distance,1)*strength*65;
   }
   if(reduced.matches){f.x=f.y=f.vx=f.vy=0;}else{
    const sx=springStep(f.x,f.vx,tx,dt/1000),sy=springStep(f.y,f.vy,ty,dt/1000);
    f.x=sx.position;f.vx=sx.velocity;f.y=sy.position;f.vy=sy.velocity;
   }
   f.lift+=(Number(picked)-f.lift)*(1-Math.exp(-dt/160));
   f.el.style.setProperty('--push-x',f.x.toFixed(2)+'px');f.el.style.setProperty('--push-y',f.y.toFixed(2)+'px');
   f.el.style.setProperty('--bend',(f.x*.055).toFixed(3)+'deg');f.el.style.setProperty('--lift-scale',(1+f.lift*.13).toFixed(4));
   const sway=reduced.matches?0:Math.sin(elapsed/(2900+f.i*170)+f.i*1.7)*(1.3+f.i%3*.4);
   f.img.style.transform=`rotate(${sway.toFixed(3)}deg)`;
  });
 }};
}
