import {clamp,follow} from './scroll-motion.js?v=2';

// Animate the real document scroll position, so focus, anchors and sticky
// sections retain their normal browser semantics. Touch stays native.
export function createMomentum(reduced){
 const pointer=matchMedia('(pointer:fine)');
 let target=scrollY,current=scrollY,frame=0,last=0,direction=0;
 const max=()=>Math.max(0,document.documentElement.scrollHeight-innerHeight);
 const enabled=()=>pointer.matches&&!reduced.matches;
 function stop(){cancelAnimationFrame(frame);frame=0;last=0;direction=0;current=target=scrollY;}
 function tick(now){
  if(!enabled()||document.querySelector('dialog[open]')){stop();return;}
  const dt=last?Math.min(50,now-last):16.67;last=now;
  target=clamp(target,0,max());current=follow(current,target,dt,260);
  if(Math.abs(target-current)<.3)current=target;
  window.scrollTo({top:current,behavior:'instant'});
  if(current!==target)frame=requestAnimationFrame(tick);else{frame=0;last=0;direction=0;}
 }
 function go(top){
  if(!enabled()){stop();window.scrollTo({top,behavior:'instant'});return;}
  if(!frame)current=scrollY;
  target=clamp(top,0,max());
  if(!frame)frame=requestAnimationFrame(tick);
 }
 function ownsScroll(node){
  for(let el=node instanceof Element?node:null;el&&el!==document.body;el=el.parentElement){
   if(el.matches('dialog,[contenteditable="true"],textarea,select,input'))return true;
   const style=getComputedStyle(el);
   if(/auto|scroll/.test(style.overflowY)&&el.scrollHeight>el.clientHeight+1)return true;
  }
  return false;
 }
 addEventListener('wheel',e=>{
  if(!enabled()||e.ctrlKey||e.metaKey||e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)||document.querySelector('dialog[open]')||ownsScroll(e.target)){stop();return;}
  if(!e.deltaY)return;
  e.preventDefault();
  const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);
  const nextDirection=Math.sign(delta);
  if(!frame||direction&&direction!==nextDirection)target=current=scrollY;
  direction=nextDirection;go(target+delta);
 },{passive:false});
 // A scrollbar drag, keyboard action or touch input takes control immediately.
 addEventListener('pointerdown',stop,{passive:true});
 addEventListener('touchstart',stop,{passive:true});
 addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Tab'].includes(e.key))stop();});
 addEventListener('scroll',()=>{if(frame&&Math.abs(scrollY-current)>2)stop();else if(!frame)current=target=scrollY;},{passive:true});
 addEventListener('resize',()=>{target=clamp(target,0,max());},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 reduced.addEventListener('change',stop);pointer.addEventListener('change',stop);
 return {go,stop};
}
