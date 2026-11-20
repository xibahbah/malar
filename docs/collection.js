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


// A desktop viewing room; close it to return to the exact place on the wall.
if(desktopExhibition.matches){
 const room=document.createElement('dialog');room.className='viewing-room';room.setAttribute('aria-label','View piece');
 room.innerHTML=`<button class="room-close" aria-label="Close product view">Close</button><div class="room-layout"><button class="room-image" aria-label="Enlarge product" aria-pressed="false"></button><div class="room-info"><h2 id="room-title"></h2><p class="room-material"></p><p class="room-price"></p><div class="room-actions"><button class="room-zoom" aria-pressed="false">Enlarge</button><span>Available soon</span></div><div class="room-pagination"><button class="room-prev">Previous</button><span class="room-count" aria-live="polite"></span><button class="room-next">Next</button></div></div></div>`;
 document.body.append(room);room.setAttribute('aria-labelledby','room-title');
 const artwork=room.querySelector('.room-image');let selected=0,zoomed=false,origin=null;
 function setZoom(value){zoomed=value;room.classList.toggle('is-enlarged',value);artwork.setAttribute('aria-pressed',String(value));artwork.setAttribute('aria-label',value?'Reduce product':'Enlarge product');room.querySelector('.room-zoom').setAttribute('aria-pressed',String(value));room.querySelector('.room-zoom').textContent=value?'Reduce':'Enlarge';artwork.style.removeProperty('--detail-x');artwork.style.removeProperty('--detail-y')}
 function renderPiece(index){
  selected=(index+malarProducts.length)%malarProducts.length;const p=malarProducts[selected],c=crops[p.art].split(' ');
  artwork.innerHTML=`<svg viewBox="${crops[p.art]}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${p.name}"><defs><clipPath id="room-object-crop"><rect x="${c[0]}" y="${c[1]}" width="${c[2]}" height="${c[3]}"/></clipPath></defs><image href="product-objects.png" width="1230" height="1278" clip-path="url(#room-object-crop)"/></svg>`;
  artwork.style.setProperty('--stone-pos',pos(p.stone));room.querySelector('#room-title').textContent=p.name;room.querySelector('.room-material').textContent=p.detail;room.querySelector('.room-price').textContent=`$${p.price}`;room.querySelector('.room-count').textContent=`${selected+1} / ${malarProducts.length}`;setZoom(false);
 }
 function openPiece(index,trigger,enlarge=false){origin=trigger;renderPiece(index);room.showModal();document.documentElement.classList.add('viewing-piece');if(enlarge)setZoom(true);room.querySelector('.room-close').focus({preventScroll:true})}
 room.querySelector('.room-close').addEventListener('click',()=>room.close());
 room.addEventListener('click',e=>{if(e.target===room)room.close()});
 room.addEventListener('close',()=>{document.documentElement.classList.remove('viewing-piece');setZoom(false);origin?.focus({preventScroll:true})});
 room.querySelector('.room-prev').addEventListener('click',()=>renderPiece(selected-1));room.querySelector('.room-next').addEventListener('click',()=>renderPiece(selected+1));
 room.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();renderPiece(selected+1)}if(e.key==='ArrowLeft'){e.preventDefault();renderPiece(selected-1)}});
 artwork.addEventListener('click',()=>setZoom(!zoomed));room.querySelector('.room-zoom').addEventListener('click',()=>setZoom(!zoomed));
 artwork.addEventListener('pointermove',e=>{if(!zoomed||!motionOK)return;const r=artwork.getBoundingClientRect();artwork.style.setProperty('--detail-x',`${20+60*(e.clientX-r.left)/r.width}%`);artwork.style.setProperty('--detail-y',`${20+60*(e.clientY-r.top)/r.height}%`)});
 document.querySelectorAll('.stone-item').forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.className='view-closely';b.textContent='View closely';b.setAttribute('aria-label',`View ${malarProducts[i].name} closely`);item.querySelector('.piece-details').prepend(b);b.addEventListener('click',()=>openPiece(i,b))});
 study.removeAttribute('aria-hidden');study.setAttribute('role','button');study.tabIndex=0;study.setAttribute('aria-label','View the marigold detail');study.addEventListener('click',()=>openPiece(0,study,true));study.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPiece(0,study,true)}});
 // Section navigation follows the work in view without rules or progress bars.
 const sectionLinks=[...document.querySelectorAll('.shop-nav a')];
 const sectionObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;sectionLinks.forEach(link=>{const active=link.hash===`#${entry.target.id}`;link.classList.toggle('is-current',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')})})},{rootMargin:'-20% 0px -55% 0px',threshold:0});
 sectionLinks.forEach(link=>{const section=document.querySelector(link.hash);if(section)sectionObserver.observe(section)});
}
