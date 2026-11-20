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
 const details=document.createElement('div');details.className='piece-details';details.id=`piece-details-${i}`;details.hidden=true;
 details.innerHTML=`<p>${p.detail}</p><span>Available soon</span><button type="button" aria-label="Close details for ${p.name}">Close</button>`;
 item.append(details);
 const closeDetails=()=>{item.classList.remove('piece-open');details.hidden=true;card.setAttribute('aria-expanded','false');};
 details.querySelector('button').addEventListener('click',()=>{closeDetails();card.focus({preventScroll:true})});
 item.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDetails();card.focus({preventScroll:true})}});
 if(matchMedia('(min-width: 761px)').matches){card.removeAttribute('aria-pressed');card.setAttribute('aria-expanded','false');card.setAttribute('aria-controls',details.id)}

 card.addEventListener('pointerenter',e=>{if(motionOK&&e.pointerType!=='touch')card.style.setProperty('--lift','-6px')});
 card.addEventListener('pointerleave',()=>card.style.removeProperty('--lift'));
 card.addEventListener('click',()=>{
 if(matchMedia('(min-width: 761px)').matches){
  const open=!item.classList.contains('piece-open');
  document.querySelectorAll('.piece-open').forEach(other=>{other.classList.remove('piece-open');other.querySelector('.piece-details').hidden=true;other.querySelector('.stone-card').setAttribute('aria-expanded','false')});
  item.classList.toggle('piece-open',open);details.hidden=!open;card.setAttribute('aria-expanded',String(open));return;
 }
 const flipped=card.classList.toggle('flipped');card.setAttribute('aria-pressed',String(flipped));card.setAttribute('aria-label',`${flipped?'Return to image of':'View details for'} ${p.name}`);card.querySelector('.stone-front').setAttribute('aria-hidden',String(flipped));card.querySelector('.stone-back').setAttribute('aria-hidden',String(!flipped))});
 document.querySelector(i<3?'#jewelry-grid':'#craft-grid').append(item);
});

const study=document.createElement('div');study.className='material-study';study.setAttribute('aria-hidden','true');
study.innerHTML='<svg viewBox="45 285 145 235" preserveAspectRatio="xMidYMid slice"><defs><clipPath id="study-crop"><rect x="45" y="285" width="145" height="235"/></clipPath></defs><image href="product-objects.png" width="1230" height="1278" clip-path="url(#study-crop)"/></svg>';
document.querySelector('#jewelry-grid').append(study);
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
