import test from 'node:test';
import assert from 'node:assert/strict';
import {layers, scrollPose, follow} from '../docs/proto/viewing-room/scroll-motion.js';

test('foreground rates differ, exceed native travel, and separate clearly from the wall',()=>{
 assert.equal(new Set(layers.map(l=>l.speed)).size,6);
 for(const layer of layers){
  const a=scrollPose(layer,1000,1600,1000,600);
  const b=scrollPose(layer,1200,1600,1000,600);
  const screenDistance=200+a.travel-b.travel;
  assert.ok(Math.abs(screenDistance/200-layer.speed)<1e-10);
  assert.ok(screenDistance/(200*.24)>4.8);
 }
});
test('a visible crossing has no clamp plateau; reverse scroll returns to identical geometry',()=>{
 for(const layer of layers){
  let previous;
  for(let y=500;y<=2100;y+=20){
   const pose=scrollPose(layer,y,1800,1000,700);
   const top=1800-350-y+pose.travel;
   if(top<1000 && top+700>0 && previous){
    assert.ok(Math.abs((pose.travel-previous.travel)/20+(layer.speed-1))<1e-10);
   }
   previous=pose;
  }
  const first=scrollPose(layer,1200,1800,1000,700);
  scrollPose(layer,3000,1800,1000,700);
  assert.deepEqual(scrollPose(layer,1200,1800,1000,700),first);
 }
});
test('easing is frame-rate independent and settles without overshoot in either direction',()=>{
 for(const layer of layers){
  const integrate=(fps,target)=>{let x=0;for(let n=0;n<fps;n++)x=follow(x,target,1000/fps,layer.settle);return x;};
  for(const target of [-400,400]){
   assert.ok(Math.abs(integrate(60,target)-integrate(120,target))<1e-9);
   assert.ok(Math.abs(integrate(60,target))<=Math.abs(target));
   assert.ok(Math.abs(integrate(60,target)-target)<1);
  }
 }
});

test('the no-WebGL fallback handles desktop, narrow and reduced-motion settings',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=await readFile(new URL('../docs/garden.js',import.meta.url),'utf8');
 const gardenSource=source.slice(source.indexOf('function garden(hero)'),source.lastIndexOf("garden(document.querySelector"));
 for(const width of [390,1280])for(const reduced of [false,true]){
  let wallPosition;
  const root={classList:{remove(){}}};
  const document={body:{classList:{contains(){return true;}}},documentElement:root,getElementById(){return null;}};
  const stage={offsetHeight:10000,getBoundingClientRect(){return {top:-1000};}};
  const hero={clientWidth:width,clientHeight:900,offsetHeight:900,parentElement:stage,querySelector(){return {getContext(){return null;}};},style:{setProperty(name,value){if(name==='--wall-position')wallPosition=parseFloat(value);}}};
  const run=new Function('document','performance','matchMedia','window','clearTimeout','addEventListener','hero',gardenSource+';garden(hero);');
  run(document,{now:()=>0},()=>({matches:reduced,addEventListener(){}}),{},()=>{},()=>{},hero);
  assert.ok(Number.isFinite(wallPosition));
  if(reduced)assert.equal(wallPosition,0);else assert.ok(wallPosition>0 && wallPosition<100);
 }
});

test('captions stay attached throughout fast forward/reverse scroll and settling',()=>{
 for(const layer of layers){
  let card=0,text=0;
  for(const y of [0,500,1500,2300,900,1700,0]){
   const target=scrollPose(layer,y,1400,900,600);
   for(let n=0;n<45;n++){
    card=follow(card,target.travel,1000/60,layer.settle);
    text=follow(text,target.textTravel,1000/60,layer.settle);
    assert.ok(Math.abs(card-text)<=14.00001);
   }
  }
 }
});

test('ending separates black, typography, and flowers; flowers develop without further scroll',async()=>{
 const {endingPose}=await import('../docs/proto/viewing-room/scroll-motion.js');
 const {bloomProgress,stems}=await import('../docs/proto/viewing-room/botanical.js');
 const blooms=t=>stems.map(s=>bloomProgress(t,s[6]));
 const top=6000,h=1000,y=top+h;
 const first=endingPose(y,top,h,0),words=endingPose(y,top,h,1300),late=endingPose(y,top,h,6000);
 assert.equal(first.dark,1);assert.equal(first.copy,0);assert.ok(blooms(0).every(x=>x===0));
 assert.equal(words.copy,1);assert.ok(blooms(1300).every(x=>x===0));
 assert.ok(blooms(6000).every(x=>x===1));assert.ok(blooms(2400)[0]>blooms(2400)[12]);
 assert.equal(endingPose(top,top,h,6000).gate,0);
 assert.ok(endingPose(top,top,h,0).dark>0&&endingPose(top,top,h,0).dark<1);
});

test('wheel motion coasts, reverses promptly, and releases keyboard/dialog scrolling',async()=>{
 const {createMomentum}=await import('../docs/proto/viewing-room/momentum.js');
 const saved=new Map(),set=(k,v)=>{saved.set(k,Object.getOwnPropertyDescriptor(globalThis,k));Object.defineProperty(globalThis,k,{value:v,writable:true,configurable:true});};
 const events={},frames=new Map();let seq=0,time=0,modal=false;
 try{
  set('scrollY',0);set('innerHeight',800);
  set('matchMedia',()=>({matches:true,addEventListener(){}}));
  set('Element',class{});
  set('document',{documentElement:{scrollHeight:6000},body:{},hidden:false,querySelector:()=>modal?{}:null,addEventListener(){}});
  set('addEventListener',(type,fn)=>{events[type]=fn;});
  set('requestAnimationFrame',fn=>{frames.set(++seq,fn);return seq;});
  set('cancelAnimationFrame',id=>frames.delete(id));
  set('window',{scrollTo:({top})=>{globalThis.scrollY=top;events.scroll();}});
  const controller=createMomentum({matches:false,addEventListener(){}});
  const step=()=>{time+=1000/60;const list=[...frames.values()];frames.clear();for(const f of list)f(time);};
  const wheel=delta=>{let prevented=false;events.wheel({deltaX:0,deltaY:delta,deltaMode:0,target:null,preventDefault(){prevented=true;}});return prevented;};
  assert.equal(wheel(700),true);step();const first=scrollY;for(let i=0;i<15;i++)step();
  assert.ok(scrollY>first+200&&scrollY<700); // Input has stopped but travel continues.
  const oldPosition=scrollY;globalThis.scrollY=oldPosition-8;events.scroll();globalThis.scrollY=oldPosition;assert.ok(frames.size>0);
  const before=scrollY;wheel(-200);for(let i=0;i<12;i++)step();assert.ok(scrollY<before);
  events.keydown({key:'PageUp'});const stopped=scrollY;step();assert.equal(scrollY,stopped);
  modal=true;assert.equal(wheel(300),false);assert.equal(frames.size,0);
  modal=false;controller.go(99999);for(let i=0;i<220;i++)step();assert.equal(scrollY,5200);
 }finally{for(const [k,d]of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}
});


test('coast velocity is continuous across packets and frame-rate independent',async()=>{
 const {coastStep}=await import('../docs/proto/viewing-room/momentum.js');
 const simulate=fps=>{let p=0,v=0;for(let i=0;i<fps;i++){const n=coastStep(p,v,900,1/fps);p=n.position;v=n.velocity;}return {p,v};};
 const a=simulate(60),b=simulate(120);assert.ok(Math.abs(a.p-b.p)<1e-8);assert.ok(Math.abs(a.v-b.v)<1e-8);
 const before=coastStep(0,0,300,.1),after=coastStep(before.position,before.velocity,600,.000001);
 assert.ok(Math.abs(before.velocity-after.velocity)<.1);
});
test('picked flower springs overshoot and settle without frame-rate dependence',async()=>{
 const {springStep,stems}=await import('../docs/proto/viewing-room/botanical.js');
 assert.equal(stems.length,13);
 const simulate=fps=>{let p=180,v=0,crossed=false;for(let i=0;i<fps*3;i++){const n=springStep(p,v,0,1/fps);p=n.position;v=n.velocity;if(p<0)crossed=true;}return {p,v,crossed};};
 const a=simulate(60),b=simulate(120);assert.equal(a.crossed,true);assert.ok(Math.abs(a.p)<.001);assert.ok(Math.abs(a.p-b.p)<1e-8);
});
