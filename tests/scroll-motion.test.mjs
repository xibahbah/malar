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
