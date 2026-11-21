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
 assert.ok(blooms(6500).every(x=>x===1));assert.ok(blooms(2400)[0]>blooms(2400)[12]);
 assert.equal(endingPose(top,top,h,6000).gate,0);
 assert.ok(endingPose(top,top,h,0).dark>0&&endingPose(top,top,h,0).dark<1);
});

test('native wheel inertia is untouched and immediately interrupts programmatic navigation',async()=>{
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
  assert.equal(wheel(700),false);step();assert.equal(scrollY,0);
  assert.equal(frames.size,0); // Browser owns wheel position and its momentum tail.
  globalThis.scrollY=700;events.scroll();
  controller.go(1600);for(let i=0;i<8;i++)step();assert.ok(scrollY>700);
  assert.equal(wheel(-200),false);assert.equal(frames.size,0);
  const stopped=scrollY;step();assert.equal(scrollY,stopped);
  controller.go(1800);events.keydown({key:'PageUp'});assert.equal(frames.size,0);
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
 assert.equal(stems.length,22);assert.equal(new Set(stems.map(s=>s[0])).size,6);
 const simulate=fps=>{let p=180,v=0,crossed=false;for(let i=0;i<fps*3;i++){const n=springStep(p,v,0,1/fps);p=n.position;v=n.velocity;if(p<0)crossed=true;}return {p,v,crossed};};
 const a=simulate(60),b=simulate(120);assert.equal(a.crossed,true);assert.ok(Math.abs(a.p)<.001);assert.ok(Math.abs(a.p-b.p)<1e-8);
});

test('a packet after a long rest moves immediately and keeps a monotone release tail at 60 and 120 Hz', async () => {
  const {advanceCamera} = await import('../docs/proto/viewing-room/collection-camera.js');
  for (const distance of [-176, 176]) {
    const start = 1600, target = start + distance;
    const first = advanceCamera(start, start, target, 3000, 800);
    const immediate = (first - start) / distance;
    assert.ok(immediate > .5 && immediate < .65);
    const settle = fps => {
      let position = first;
      for (let i = 0; i < fps / 2; i++) {
        const next = advanceCamera(position, target, target, 1000 / fps, 800);
        assert.ok((next - position) * distance > 0);
        assert.ok(Math.abs(next - target) < Math.abs(position - target));
        position = next;
      }
      return position;
    };
    assert.ok(Math.abs(settle(60) - settle(120)) < 1e-8);
    assert.ok(Math.abs(settle(60) - target) < 3);
  }
});

test('reversing a live coast immediately moves in the new direction and fast travel remains bounded', async () => {
  const {advanceCamera, chapterAt} = await import('../docs/proto/viewing-room/collection-camera.js');
  const first = advanceCamera(0, 0, 1400, 16, 800);
  assert.ok(1400 - first <= 800 * .43);
  const reverse = advanceCamera(first, 1400, 1394, 16, 800);
  assert.ok(reverse < first);
  const centers = [1100, 1830, 2450, 3700, 4360, 4850];
  for (let i = 0; i < centers.length; i++) {
    assert.equal(chapterAt(centers, centers[i]), i);
    if (i) assert.equal(chapterAt(centers, (centers[i-1] + centers[i]) / 2), i - .5);
  }
  assert.equal(chapterAt(centers, 100), 0);
  assert.equal(chapterAt(centers, 9000), 5);
});

test('the overview scales all six pictures and their spacing around the reading point', async () => {
  const {projectCollection} = await import('../docs/proto/viewing-room/collection-camera.js');
  const position = 2900, height = 800, compact = .18, pivot = position + height / 2;
  let previousScale = 1;
  for (let frame = 0; frame <= 100; frame++) {
    const {scale, translateY} = projectCollection(frame / 100, position, height, compact);
    const screenY = y => y * scale + translateY;
    assert.ok(Math.abs(screenY(pivot) - height / 2) < 1e-9);
    assert.ok(Math.abs(screenY(3550) - screenY(3100) - 450 * scale) < 1e-9);
    assert.ok(scale <= previousScale && previousScale - scale < .02);
    previousScale = scale;
  }
  assert.equal(projectCollection(-.1, position, height, compact).scale, 1);
  assert.ok(Math.abs(projectCollection(1.1, position, height, compact).scale - compact) < 1e-9);
});

test('index labels arrive after the pullback and both directions pass through intermediate sizes', async () => {
  const {projectCollection, advanceZoom} = await import('../docs/proto/viewing-room/collection-camera.js');
  const view = progress => projectCollection(progress, 2800, 800, .18);
  assert.deepEqual(view(0), {scale:1, translateY:-2800, align:0, captions:1, labels:0});
  assert.ok(view(.6).scale < .4);
  assert.equal(view(.6).labels, 0);
  assert.ok(view(.8).labels > 0 && view(.8).labels < 1);
  assert.equal(view(1).labels, 1);
  assert.equal(view(1).captions, 0);
  const run = hz => {
    let lens = {position:0, velocity:0};
    const scales = [];
    for (const target of [1, 0]) {
      for (let frame = 1; frame <= hz; frame++) {
        lens = advanceZoom(lens.position, lens.velocity, target, 1 / hz);
        if (frame % (hz / 4) === 0) scales.push(view(lens.position).scale);
      }
    }
    return scales;
  };
  const series = run(60);
  assert.ok(series[0] > .35 && series[0] < .8);
  assert.ok(series[1] < series[0] && series[2] < series[1]);
  assert.ok(series[4] > series[3] && series[5] > series[4] && series[7] > .97);
  run(120).forEach((s,i) => assert.ok(Math.abs(series[i] - s) < 1e-8));
});
