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
 item.innerHTML=`<div class="stone-space"><button class="stone-card" aria-label="View details for ${p.name}" aria-pressed="false" style="--stone-pos:${pos(p.stone)};--art-pos:${pos(p.art)}"><span class="stone-turn"><span class="stone-face stone-front"><svg class="stone-art" viewBox="${crops[p.art]}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${p.name}"><defs><clipPath id="product-crop-${i}"><rect x="${crops[p.art].split(' ')[0]}" y="${crops[p.art].split(' ')[1]}" width="${crops[p.art].split(' ')[2]}" height="${crops[p.art].split(' ')[3]}"/></clipPath></defs><image href="product-objects.png" width="1230" height="1278" clip-path="url(#product-crop-${i})"/></svg></span><span class="stone-face stone-back" aria-hidden="true"><strong>${p.name}</strong><p>${p.detail}</p><p>$${p.price}</p><small>Collection preview<br>Available soon</small></span></span></button></div><div class="stone-caption"><div><h3>${p.name}</h3><p>${p.detail}</p></div><span class="stone-price">$${p.price}</span></div>`;
 const card=item.querySelector('button');
 card.addEventListener('pointermove',e=>{if(!motionOK||e.pointerType==='touch')return;const r=card.getBoundingClientRect(),x=Math.max(-.5,Math.min(.5,(e.clientX-r.left)/r.width-.5)),y=Math.max(-.5,Math.min(.5,(e.clientY-r.top)/r.height-.5));card.style.setProperty('--rx',`${-y*4}deg`);card.style.setProperty('--ry',`${x*6}deg`);card.style.setProperty('--lift','-4px');card.style.setProperty('--shine','.5');card.style.setProperty('--glint',`${x*65}%`)});
 card.addEventListener('pointerleave',()=>['--rx','--ry','--lift','--shine'].forEach(n=>card.style.removeProperty(n)));
 card.addEventListener('click',()=>{const flipped=card.classList.toggle('flipped');card.setAttribute('aria-pressed',String(flipped));card.setAttribute('aria-label',`${flipped?'Return to image of':'View details for'} ${p.name}`);card.querySelector('.stone-front').setAttribute('aria-hidden',String(flipped));card.querySelector('.stone-back').setAttribute('aria-hidden',String(!flipped))});
 document.querySelector(i<3?'#jewelry-grid':'#craft-grid').append(item);
});
const custom=document.querySelector('#custom-gift');
document.querySelectorAll('[data-amount]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-amount]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));custom.hidden=b.dataset.amount!=='custom';document.querySelector('#gift-value').textContent=b.dataset.amount==='custom'?'For you':`$${b.dataset.amount}`;if(!custom.hidden)custom.focus()}));
custom.addEventListener('input',()=>{document.querySelector('#gift-value').textContent=custom.value?`$${custom.value}`:'For you'});
document.querySelector('#gift-action').addEventListener('click',()=>{document.querySelector('#gift-status').textContent='Digital gift cards are coming soon. Checkout is not open yet.'});
document.querySelector('.newsletter').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#newsletter-status').textContent='Newsletter sign-up is coming soon. Your email has not been submitted.'});
