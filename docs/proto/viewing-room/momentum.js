import {clamp} from './scroll-motion.js?v=3';

// Exact critically damped spring: velocity survives between wheel packets.
// Unlike repeated position lerps, the next packet cannot step the velocity.
export function coastStep(position,velocity,target,dt,frequency=9){
 const displacement=position-target,c=velocity+frequency*displacement;
 const decay=Math.exp(-frequency*dt);
 return {position:target+(displacement+c*dt)*decay,
  velocity:(velocity-frequency*c*dt)*decay};
}
export function createMomentum(reduced){
 const pointer=matchMedia('(min-width:761px) and (pointer:fine)');
 let target=scrollY,current=scrollY,velocity=0,frame=0,last=0,limit=0;
 const measure=()=>{limit=Math.max(0,document.documentElement.scrollHeight-innerHeight);};
 const enabled=()=>pointer.matches&&!reduced.matches;
 function stop(){if(!frame)return;cancelAnimationFrame(frame);frame=0;last=0;velocity=0;current=target=scrollY;}
 function tick(now){
  if(!enabled()||document.querySelector('dialog[open]')){stop();return;}
  const dt=last?Math.min(.08,(now-last)/1000):1/60;last=now;
  target=clamp(target,0,limit);
  const next=coastStep(current,velocity,target,dt);
  current=clamp(next.position,0,limit);velocity=next.velocity;
  if(Math.abs(target-current)<.45&&Math.abs(velocity)<4){current=target;velocity=0;}
  window.scrollTo({top:current,behavior:'instant'});
  if(current!==target||velocity)frame=requestAnimationFrame(tick);else{frame=0;last=0;}
 }
 function go(top){
  measure();
  if(!enabled()){stop();window.scrollTo({top:clamp(top,0,limit),behavior:'instant'});return;}
  if(!frame)current=scrollY;
  target=clamp(top,0,limit);
  if(!frame)frame=requestAnimationFrame(tick);
 }
 // Trackpads already deliver OS inertia, including the decaying release tail.
 // Never intercept it or route it through a second spring/main-thread scrollTo.
 // Only explicit navigation uses the spring; real input immediately takes over.
 addEventListener('wheel',stop,{passive:true});
 addEventListener('pointerdown',stop,{passive:true});
 addEventListener('touchstart',stop,{passive:true});
 addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Tab'].includes(e.key))stop();});
 // Scroll events are asynchronous and may report an older compositor position.
 // Explicit input handlers relinquish control; our own scroll events never do.
 addEventListener('scroll',()=>{if(!frame)current=target=scrollY;},{passive:true});
 addEventListener('resize',()=>{measure();target=clamp(target,0,limit);},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 reduced.addEventListener('change',stop);pointer.addEventListener('change',stop);
 measure();return {go,stop,get active(){return Boolean(frame);}};
}
