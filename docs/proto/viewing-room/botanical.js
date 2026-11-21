import {clamp,smooth} from './scroll-motion.js?v=3';

// Independent silhouettes: cascading canopy, large low blooms, airy connecting vines.
// asset, x/y/w/h (%), angle, entrance order, narrow layout, depth brightness.
export const stems=[
 ['kanikonna-kerala',4,-29,25,85,-9,0,[-10,-15,52,53,-12],.62],
 ['jasmine-kerala',-7,-22,28,80,122,5,[-20,-22,54,56,136],.52],
 ['ixora-kerala',-7,4,23,69,24,8,[-25,12,52,50,18],.55],
 ['hibiscus-kerala',-2,30,29,82,-19,2,[-30,47,68,58,-20],.76],
 ['butterfly-pea-kerala',14,36,15,58,12,11,[-11,27,38,49,14],.62],
 ['jasmine-kerala',-5,64,31,78,47,6,[-24,70,64,51,42],.73],
 ['marigold-kerala',20,75,24,68,-31,3,[5,80,49,44,-29],.66],
 ['ixora-kerala',-3,84,27,71,33,15,[-13,90,52,44,29],.63],
 ['jasmine-kerala',31,73,25,64,-63,13,[18,89,53,46,-58],.58],
 ['butterfly-pea-kerala',45,77,17,62,-44,17,[45,86,38,43,-35],.62],
 ['marigold-kerala',58,70,24,72,15,4,[66,83,48,49,17],.72],
 ['hibiscus-kerala',75,63,31,90,23,1,[72,66,64,54,20],.69],
 ['ixora-kerala',81,31,26,74,-22,9,[79,39,49,48,-17],.7],
 ['butterfly-pea-kerala',72,23,18,66,-8,10,[78,22,39,45,-10],.58],
 ['jasmine-kerala',87,-11,26,80,-32,7,[83,-5,51,56,-30],.67],
 ['kanikonna-kerala',74,-35,22,76,17,12,[66,-20,50,56,18],.54],
 ['ixora-kerala',40,-44,22,69,152,16,[34,-39,48,53,151],.46],
 ['marigold-kerala',25,-43,21,68,164,14,[14,-34,43,46,164],.54],
 ['kanikonna-kerala',93,42,19,70,-15,18,[104,62,40,48,-15],.43],
 ['hibiscus-kerala',-17,70,28,89,-58,19,[-39,91,61,58,-58],.45],
 ['jasmine-kerala',65,88,29,78,63,20,[53,99,61,51,63],.6],
 ['ixora-kerala',87,86,24,72,13,21,[98,97,50,49,13],.49]
];
export const bloomProgress=(elapsed,order)=>smooth((elapsed-1400-order*65)/3400);
export function springStep(position,velocity,target,dt){
 // Analytical underdamped spring: a small overshoot, independent of frame rate.
 const omega=10,damping=5,frequency=Math.sqrt(omega*omega-damping*damping);
 const x=position-target,b=(velocity+damping*x)/frequency;
 const decay=Math.exp(-damping*dt),s=Math.sin(frequency*dt),c=Math.cos(frequency*dt);
 return {position:target+decay*(x*c+b*s),velocity:decay*((-damping*x+frequency*b)*c+(-damping*b-frequency*x)*s)};
}
export function mountBotanical(container,base,reduced,wake){
 container.innerHTML=stems.map(([asset,x,y,w,h,angle,order,mobile,light],i)=>`<div class="flower-place stem-${i}" style="--x:${x}%;--y:${y}%;--w:${w}%;--h:${h}%;--stem-angle:${angle}deg;--layer:${order%3};--growth-origin:${y<0?0:100}%;--light:${light};--sway-time:${(9+i*.53).toFixed(2)}s;--sway-delay:-${(i*1.37).toFixed(2)}s;--sway-angle:${1.3+i%3*.4}deg;--mx:${mobile[0]}%;--my:${mobile[1]}%;--mw:${mobile[2]}%;--mh:${mobile[3]}%;--ma:${mobile[4]}deg"><div class="flower-reveal"><img class="night-flower" src="${new URL('flowers/'+asset+'.webp',base)}" alt="" draggable="false" decoding="async" loading="lazy"></div></div>`).join('');
 const flowers=[...container.children].map((el,i)=>({el,i,progress:-1,interactive:false,x:0,y:0,vx:0,vy:0,lift:0,tx:0,ty:0,cx:0,cy:0}));
 let pointer=null,drag=null,stageRect=null;
 function measure(){
  stageRect=container.getBoundingClientRect();
  flowers.forEach(f=>{const r=f.el.getBoundingClientRect();f.cx=r.x+r.width*.5-f.x-stageRect.x;f.cy=r.y+r.height*.3-f.y-stageRect.y;});
 }
 container.parentElement.addEventListener('pointermove',e=>{
  if(reduced.matches||e.pointerType!=='mouse')return;
  pointer={x:e.clientX,y:e.clientY};wake();
  if(drag){drag.f.tx=clamp(drag.x+e.clientX-drag.px,-240,240);drag.f.ty=clamp(drag.y+e.clientY-drag.py,-180,180);}
 });
 container.parentElement.addEventListener('pointerleave',()=>{pointer=null;wake();});
 function release(){if(!drag)return;drag.f.el.classList.remove('picked');drag.f.tx=drag.f.ty=0;drag=null;wake();}
 flowers.forEach(f=>{
  f.el.addEventListener('pointerdown',e=>{
   if(e.pointerType!=='mouse'||reduced.matches)return;
   e.preventDefault();pointer=null;drag={f,px:e.clientX,py:e.clientY,x:f.x,y:f.y};f.el.classList.add('picked');f.el.setPointerCapture(e.pointerId);wake();
  });
  f.el.addEventListener('pointerup',()=>{pointer=null;release();});
  f.el.addEventListener('pointercancel',release);f.el.addEventListener('lostpointercapture',release);
 });
 return {measure,paint(elapsed,gate,dt){
  if(!stageRect)measure();
  let moving=false;
  flowers.forEach(f=>{
   const progress=reduced.matches?1:bloomProgress(elapsed,stems[f.i][6]);
   if(f.progress!==progress){
    f.progress=progress;
    f.el.style.setProperty('--bloom',progress.toFixed(4));
    f.el.style.setProperty('--enter-y',((1-progress)*(stems[f.i][2]<0?-95:95)).toFixed(2)+'px');
    f.el.style.setProperty('--enter-x',((1-progress)*(stems[f.i][1]<20?-55:stems[f.i][1]>70?55:0)).toFixed(2)+'px');
    f.el.style.setProperty('--enter-turn',((1-progress)*(f.i%2?16:-16)).toFixed(2)+'deg');
    f.el.style.setProperty('--bloom-scale',(.76+.24*progress).toFixed(4));
   }
   const interactive=progress*gate>.4;
   if(interactive!==f.interactive){f.interactive=interactive;f.el.style.pointerEvents=interactive?'auto':'none';}
   const picked=drag?.f===f;
   let tx=picked?f.tx:0,ty=picked?f.ty:0;
   if(pointer&&!drag&&gate>.8){
    // The ending is sticky; coordinates are local to the viewport once entered.
    const dx=f.cx-pointer.x,dy=f.cy-pointer.y,distance=Math.hypot(dx,dy),strength=Math.max(0,1-distance/230);
    tx=dx/Math.max(distance,1)*strength*95;ty=dy/Math.max(distance,1)*strength*65;
   }
   const distance=Math.abs(tx-f.x)+Math.abs(ty-f.y)+Math.abs(f.vx)+Math.abs(f.vy)+Math.abs(Number(picked)-f.lift);
   if(distance===0)return;
   if(distance<.012||reduced.matches){f.x=tx;f.y=ty;f.vx=f.vy=0;f.lift=Number(picked);}else{
    moving=true;
    const sx=springStep(f.x,f.vx,tx,dt/1000),sy=springStep(f.y,f.vy,ty,dt/1000);
    f.x=sx.position;f.vx=sx.velocity;f.y=sy.position;f.vy=sy.velocity;
   }
   f.lift+=(Number(picked)-f.lift)*(1-Math.exp(-dt/160));
   f.el.style.setProperty('--push-x',f.x.toFixed(2)+'px');f.el.style.setProperty('--push-y',f.y.toFixed(2)+'px');
   f.el.style.setProperty('--bend',(f.x*.055).toFixed(3)+'deg');f.el.style.setProperty('--lift-scale',(1+f.lift*.13).toFixed(4));
  });
  return moving;
 }};
}
