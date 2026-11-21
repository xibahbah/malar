// Viewing room: one piece per screen on the homepage's relief wall.
// Data lives in products.json; the bag is a small local module (no payment yet).
const here = new URL('./', import.meta.url);
const $ = s => document.querySelector(s);
const money = cents => '$' + (cents / 100).toFixed(cents % 100 ? 2 : 0);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const pad = n => String(n).padStart(2, '0');

const products = await (await fetch(new URL('products.json?v=1', here))).json();
for (const p of products) p.image = new URL(p.image, here).href;

/* ---------- bag ---------- */
const KEY = 'malar-viewing-room-v1';
let items = {};
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  for (const p of products) if (Number.isInteger(saved[p.id]) && saved[p.id] > 0) items[p.id] = Math.min(20, saved[p.id]);
} catch {}
const count = () => Object.values(items).reduce((a, b) => a + b, 0);
const total = () => products.reduce((sum, p) => sum + p.price * (items[p.id] || 0), 0);
function setQty(id, q) {
  q = Math.max(0, Math.min(20, q));
  if (q) items[id] = q; else delete items[id];
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  renderBag();
}

/* ---------- pieces ---------- */
const room = $('#room'), index = $('#index');
const pieces = products.map((p, i) => {
  const el = document.createElement('section');
  el.className = 'piece';
  el.id = 'piece-' + p.id;
  el.setAttribute('aria-labelledby', 'name-' + p.id);
  el.innerHTML = `
    <div class="figure"><img class="stone-front" src="${p.image}" alt="${p.name}" decoding="async"></div>
    <div class="caption">
      <p class="no">${pad(i + 1)} <span>/ ${pad(products.length)}</span></p>
      <h2 id="name-${p.id}">${p.name}</h2>
      <p class="spec">${p.spec}</p>
    </div>
    <div class="buy">
      <span class="price">${money(p.price)}</span>
      <button class="add" type="button">Add to bag</button>
      <span class="in-bag" aria-live="polite"></span>
    </div>`;
  const img = el.querySelector('img');
  // The cutouts are small placeholders; never scale them past 1.5x.
  img.addEventListener('load', () => { img.style.maxWidth = `min(78vw, ${Math.round(img.naturalWidth * 1.5)}px)`; });
  el.querySelector('.add').onclick = () => setQty(p.id, (items[p.id] || 0) + 1);
  room.append(el);

  const jump = document.createElement('button');
  jump.type = 'button';
  jump.textContent = pad(i + 1);
  jump.setAttribute('aria-label', `${pad(i + 1)}, ${p.name}`);
  jump.onclick = () => el.scrollIntoView({behavior: reduce.matches ? 'auto' : 'smooth'});
  index.append(jump);
  return {p, el, img, jump, status: el.querySelector('.in-bag')};
});
const end = document.createElement('p');
end.className = 'end';
end.textContent = 'Prototype. Photographs are placeholders; checkout is not connected.';
room.append(end);

const seen = new IntersectionObserver(entries => {
  for (const e of entries) {
    const piece = pieces.find(x => x.el === e.target);
    if (e.isIntersecting) piece.el.classList.add('in');
    if (e.intersectionRatio > .55) pieces.forEach(x => x.jump.setAttribute('aria-current', x === piece));
  }
}, {threshold: [.2, .55]});
pieces.forEach(x => seen.observe(x.el));

/* ---------- bag drawer ---------- */
const bag = $('#bag'), lines = $('#bag-lines'), note = $('#bag-note'), checkout = $('#bag-checkout');
function renderBag() {
  $('#bag-count').textContent = count();
  $('#bag-total').textContent = money(total());
  checkout.disabled = !count();
  lines.replaceChildren();
  if (!count()) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Your bag is empty.';
    lines.append(li);
  }
  for (const {p, status} of pieces) {
    const q = items[p.id] || 0;
    status.textContent = q ? `In bag · ${q}` : '';
    if (!q) continue;
    const li = document.createElement('li');
    li.innerHTML = `
      <img src="${p.image}" alt="">
      <span class="name">${p.name}</span>
      <span class="line">${money(p.price * q)}</span>
      <span class="qty">
        <button type="button" data-d="-1" aria-label="One fewer ${p.name}">−</button>
        <span aria-label="Quantity">${q}</span>
        <button type="button" data-d="1" aria-label="One more ${p.name}">+</button>
      </span>
      <button type="button" class="remove" aria-label="Remove ${p.name}">Remove</button>`;
    li.querySelectorAll('[data-d]').forEach(b => b.onclick = () => setQty(p.id, q + Number(b.dataset.d)));
    li.querySelector('.remove').onclick = () => setQty(p.id, 0);
    lines.append(li);
  }
}
$('#menu').onclick = () => { note.textContent = ''; bag.showModal(); };
$('#bag-close').onclick = () => bag.close();
bag.addEventListener('click', e => { if (e.target === bag) bag.close(); });
checkout.onclick = () => {
  // TODO: payment provider. Until then this is a mock and says so.
  const sum = money(total());
  items = {};
  try { localStorage.setItem(KEY, '{}'); } catch {}
  renderBag();
  note.textContent = `Mock order placed for ${sum}. Nothing was charged; checkout is not connected yet.`;
};
renderBag();

/* ---------- shadows fall away from the lamp (the pointer) ---------- */
let px = innerWidth * .3, py = innerHeight * .2, frame = 0;
function shade() {
  frame = 0;
  for (const {img} of pieces) {
    const r = img.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    const dx = r.left + r.width / 2 - px, dy = r.top + r.height / 2 - py, d = Math.hypot(dx, dy) || 1;
    const len = Math.min(22, 8 + d / 40);
    img.style.setProperty('--sx', (dx / d * len).toFixed(1) + 'px');
    img.style.setProperty('--sy', (dy / d * len).toFixed(1) + 'px');
  }
}
const request = () => { if (!frame) frame = requestAnimationFrame(shade); };
addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; px = e.clientX; py = e.clientY; request(); }, {passive: true});
addEventListener('scroll', request, {passive: true});
addEventListener('resize', request);
request();
