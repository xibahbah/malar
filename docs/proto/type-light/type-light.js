'use strict';
const root=document.documentElement;
const catalogue=document.querySelector('.catalogue');
const grid=document.querySelector('.product-grid');
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const debug=new URLSearchParams(location.search).get('debug')==='1';
// Existing atlas and catalogue data only. Compact visible names, full accessible names.
const products=[
 {id:'01',name:'Marigold drop earrings',label:'Marigold drops',material:'Brass · pearl',price:48,crop:[15,130,350,450]},
 {id:'02',name:'Lotus signet ring',label:'Lotus signet',material:'Gilt brass',price:65,crop:[410,215,370,290]},
 {id:'03',name:'Jasmine strand necklace',label:'Jasmine strand',material:'Gilt brass',price:86,crop:[800,80,420,510]}
];
function art(p,shadow){
 const id=`crop-${p.id}-${shadow?'shadow':'art'}`;
 return `<svg class="${shadow?'cast-shadow':'product-art'}" viewBox="${p.crop.join(' ')}" aria-hidden="true"><defs><clipPath id="${id}"><rect x="${p.crop[0]}" y="${p.crop[1]}" width="${p.crop[2]}" height="${p.crop[3]}"/></clipPath></defs><image href="../../product-objects.png" width="1230" height="1278" clip-path="url(#${id})"/></svg>`;
}
grid.innerHTML=products.map(p=>`<article class="product" data-id="${p.id}"><button type="button" class="piece" aria-label="Select ${p.name}, ${p.material}, $${p.price}" aria-pressed="false"><span class="art-frame">${art(p,true)}${art(p,false)}</span></button><div class="meta"><span class="number">${p.id}</span><div class="description"><h2 class="name">${p.label}</h2><span class="material">${p.material}</span></div><span class="price">$${p.price}</span></div></article>`).join('');
const items=[...grid.querySelectorAll('.product')];
let hovered=null,focused=null,pinned=null;
function selection(){
 const active=hovered||focused||pinned;
 catalogue.classList.toggle('has-selection',!!active);
 items.forEach(item=>{item.classList.toggle('is-active',item===active);item.querySelector('button').setAttribute('aria-pressed',String(item===pinned));});
}
items.forEach(item=>{
 const button=item.querySelector('button');
 item.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovered=item;selection();}});
 item.addEventListener('pointerleave',()=>{if(hovered===item)hovered=null;selection();});
 button.addEventListener('focus',()=>{focused=item;selection();});
 button.addEventListener('blur',()=>{focused=null;selection();});
 button.addEventListener('click',()=>{pinned=pinned===item?null:item;selection();document.querySelector('.selection-status').textContent=pinned?`${products.find(p=>p.id===item.dataset.id).name} selected`:'Selection cleared';});
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=hovered=focused=null;document.activeElement?.blur();selection();document.querySelector('.selection-status').textContent='Selection cleared';}});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.product')){pinned=focused=null;selection();}});
// Read only the exported CSS lamp coordinates. Never subscribe to raw pointer positions.
const title=document.querySelector('h1');
let bounds=[],titleBounds,lastX=NaN,lastY=NaN;
function measure(){
 bounds=items.map(item=>item.querySelector('.art-frame').getBoundingClientRect());
 titleBounds=title.getBoundingClientRect();lastX=NaN;updateLight();
}
function vector(rect,x,y,max){
 const dx=rect.left+rect.width/2-x,dy=rect.top+rect.height/2-y;
 const distance=Math.hypot(dx,dy),length=Math.min(max,distance*.018);
 return [distance?dx/distance*length:0,distance?dy/distance*length:0];
}
function updateLight(){
 if(!titleBounds)return;
 const x=parseFloat(root.style.getPropertyValue('--lx'))||innerWidth*.16;
 const y=parseFloat(root.style.getPropertyValue('--ly'))||innerHeight*.18;
 if(Math.abs(x-lastX)<.15&&Math.abs(y-lastY)<.15)return;
 lastX=x;lastY=y;
 const [tx,ty]=vector(titleBounds,x,y,6);
 title.style.setProperty('--tx',tx.toFixed(2)+'px');title.style.setProperty('--ty',ty.toFixed(2)+'px');
 items.forEach((item,i)=>{const [sx,sy]=vector(bounds[i],x,y,18);item.style.setProperty('--sx',sx.toFixed(2)+'px');item.style.setProperty('--sy',sy.toFixed(2)+'px');});
 if(debug)document.querySelector('#lamp-readout').textContent=`--lx ${x.toFixed(1)}px  --ly ${y.toFixed(1)}px\nViewport ${innerWidth} × ${innerHeight} · ${reduced.matches?'static':'live'} light`;
}
document.addEventListener('malar:lamp',updateLight);
new ResizeObserver(measure).observe(catalogue);
addEventListener('scroll',()=>{if(!reduced.matches)measure();},{passive:true});
reduced.addEventListener('change',measure);
catalogue.addEventListener('animationend',measure);
document.fonts.ready.then(measure);measure();
if(debug){
 root.classList.add('debug');document.querySelector('#debug').hidden=false;
 let last=0,start=performance.now(),samples=[];
 function sample(t){
  if(last&&!document.hidden)samples.push(t-last);last=t;
  if(t-start>2000){
   const ordered=samples.slice().sort((a,b)=>a-b),mean=samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length);
   const p95=ordered[Math.floor(ordered.length*.95)]||0;
   document.querySelector('#frame-readout').textContent=`rAF ${mean?(1000/mean).toFixed(1):'—'} fps · p95 ${p95.toFixed(1)}ms · diagnostic only`;
   samples=[];start=t;
  }
  requestAnimationFrame(sample);
 }
 requestAnimationFrame(sample);
}
