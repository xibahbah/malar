const malarProducts=[
 {name:'Marigold drop earrings',detail:'Brass, freshwater pearl',price:48,stone:2,art:0},
 {name:'Lotus signet ring',detail:'Gold-plated brass',price:65,stone:0,art:1},
 {name:'Jasmine strand necklace',detail:'Gold-plated brass',price:86,stone:1,art:2},
 {name:'Hand-thrown bud vase',detail:'Stoneware, amber glaze',price:38,stone:4,art:3},
 {name:'Kolam brass tray',detail:'Etched brass, 10 in',price:54,stone:3,art:4},
 {name:'Woven palm basket',detail:'Palm leaf, natural dye',price:42,stone:5,art:5}
];
const crops=['15 130 350 450','410 215 370 290','800 80 420 510','15 720 340 460','375 720 420 460','820 790 405 350'];
const pos=i=>`${i%3*50}% ${i<3?0:100}%`;
const motionOK=!matchMedia('(prefers-reduced-motion:reduce)').matches;
malarProducts.forEach((p,i)=>{
 const item=document.createElement('article');item.className='stone-item';
 item.innerHTML=`<div class="stone-space"><button class="stone-card" aria-label="View details for ${p.name}" aria-pressed="false" style="--stone-pos:${pos(p.stone)};--art-pos:${pos(p.art)}"><span class="stone-turn"><span class="stone-face stone-front"><svg class="stone-art" viewBox="${crops[p.art]}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${p.name}"><defs><clipPath id="product-crop-${i}"><rect x="${crops[p.art].split(' ')[0]}" y="${crops[p.art].split(' ')[1]}" width="${crops[p.art].split(' ')[2]}" height="${crops[p.art].split(' ')[3]}"/></clipPath></defs><image href="product-objects.png" width="1230" height="1278" clip-path="url(#product-crop-${i})"/></svg></span><span class="stone-face stone-back" aria-hidden="true"><strong>${p.name}</strong><p>${p.detail}</p><p>$${p.price}</p><small>Available soon</small></span></span></button></div><div class="stone-caption"><div><h3>${p.name}</h3></div><span class="stone-price">$${p.price}</span></div>`;
 const card=item.querySelector('button');
 const space=item.querySelector('.stone-space');
 const desktopMotion=matchMedia('(min-width:761px)');
 let frame=0,lastTime=0,bounds=null,inside=false;
 const current={x:0,y:0,lift:0},target={x:0,y:0,lift:0};
 function animate(now){
  const dt=lastTime?Math.min(48,now-lastTime):16.67;lastTime=now;
  const ease=1-Math.exp(-dt/75);
  let moving=false;
  for(const key of ['x','y','lift']){
   current[key]+=(target[key]-current[key])*ease;
   if(Math.abs(target[key]-current[key])<.015)current[key]=target[key];else moving=true;
  }
  card.style.transform=`translate3d(0,${current.lift}px,0) rotateX(${current.x}deg) rotateY(${current.y}deg)`;
  if(moving)frame=requestAnimationFrame(animate);else{frame=0;lastTime=0}
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(animate)}
 function aim(e){
  if(!bounds||!inside)return;
  target.x=-Math.max(-.5,Math.min(.5,(e.clientY-bounds.top)/bounds.height-.5))*5;
  target.y=Math.max(-.5,Math.min(.5,(e.clientX-bounds.left)/bounds.width-.5))*6;
  schedule();
 }
 function resetMotion(){
  inside=false;bounds=null;space.classList.remove('is-hovered');
  if(desktopMotion.matches&&motionOK){target.x=target.y=0;target.lift=card.classList.contains('flipped')?-10:0;schedule()}
  else card.style.removeProperty('--lift');
 }
 // Listen on the stationary footprint, never on the moving card.
 space.addEventListener('pointerenter',e=>{
  if(!motionOK||e.pointerType==='touch')return;
  if(!desktopMotion.matches){card.style.setProperty('--lift','-6px');return}
  inside=true;bounds=space.getBoundingClientRect();space.classList.add('is-hovered');
  target.lift=-10;aim(e);
 });
 space.addEventListener('pointermove',e=>{if(motionOK&&desktopMotion.matches&&e.pointerType!=='touch')aim(e)});
 space.addEventListener('pointerleave',resetMotion);
 space.addEventListener('pointercancel',resetMotion);
 window.addEventListener('scroll',()=>{if(inside)bounds=space.getBoundingClientRect()},{passive:true});
 window.addEventListener('resize',()=>{if(inside)bounds=space.getBoundingClientRect();if(!desktopMotion.matches){cancelAnimationFrame(frame);frame=0;card.style.removeProperty('transform')}},{passive:true});
 card.addEventListener('focus',()=>{if(desktopMotion.matches&&motionOK){target.lift=-10;schedule()}});
 card.addEventListener('blur',()=>{if(!inside)resetMotion()});
 card.addEventListener('keydown',e=>{if(e.key==='Escape'&&card.classList.contains('flipped')){card.click();resetMotion()}});
 card.addEventListener('click',()=>{
 const flipped=card.classList.toggle('flipped');if(desktopMotion.matches&&motionOK){target.lift=(flipped||inside)?-10:0;schedule()};card.setAttribute('aria-pressed',String(flipped));card.setAttribute('aria-label',`${flipped?'Return to image of':'View details for'} ${p.name}`);card.querySelector('.stone-front').setAttribute('aria-hidden',String(flipped));card.querySelector('.stone-back').setAttribute('aria-hidden',String(!flipped))});
 document.querySelector(i<3?'#jewelry-grid':'#craft-grid').append(item);
});

const desktopExhibition=matchMedia('(min-width: 761px)');
if(desktopExhibition.matches && motionOK){
 const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');reveal.unobserve(entry.target)}}),{threshold:.12});
 document.querySelectorAll('.stone-item,.material-study').forEach(item=>{item.classList.add('exhibit-enter');reveal.observe(item)});
}

const custom=document.querySelector('#custom-gift');
document.querySelectorAll('[data-amount]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-amount]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));custom.hidden=b.dataset.amount!=='custom';document.querySelector('#gift-value').textContent=b.dataset.amount==='custom'?'For you':`$${b.dataset.amount}`;if(!custom.hidden)custom.focus()}));
custom.addEventListener('input',()=>{document.querySelector('#gift-value').textContent=custom.value?`$${custom.value}`:'For you'});
document.querySelector('#gift-action').addEventListener('click',()=>{document.querySelector('#gift-status').textContent='Gift cards coming soon.'});
document.querySelector('.newsletter').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#newsletter-status').textContent='Sign-up is not open yet.'});


