// Collection study: flat plates and plain type placed on the homepage's relief wall.
// Data lives in products.json; the bag is a small local module (no payment yet).
const here = new URL('./', import.meta.url);
const $ = s => document.querySelector(s);
const money = cents => '$' + (cents / 100).toFixed(cents % 100 ? 2 : 0);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const pad = n => String(n).padStart(2, '0');

const products = await (await fetch(new URL('products.json?v=4', here))).json();
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
const room = $('#room');
const statement = (label, text, tag, short) => {
  const el = document.createElement('div');
  el.className = 'statement' + (short ? ' short' : '');
  el.innerHTML = `<p class="label reveal">${label}</p><${tag} class="reveal">${text}</${tag}>`;
  room.append(el);
};
const WIDE = new Set(['lotus', 'basket']);
statement('Jewelry', 'Malar means flower. Jewelry and objects, made by hand in small batches.', 'h1');
const pieces = products.map((p, i) => {
  if (i === 3) statement('Objects', 'For the home, by hand.', 'h2', true);
  const el = document.createElement('article');
  el.className = `piece v${i + 1}`;
  el.setAttribute('aria-labelledby', 'name-' + p.id);
  el.innerHTML = `
    <div class="plate stone-front${WIDE.has(p.id) ? ' wide' : ''}"><img src="${p.image}" alt="${p.name}" decoding="async"></div>
    <div class="text reveal">
      <p class="no">${pad(i + 1)}</p>
      <h3 id="name-${p.id}">${p.name}</h3>
      <p class="spec">${p.spec}</p>
      <p class="buy"><span class="price">${money(p.price)}</span><button class="add" type="button">Add to bag</button><span class="in-bag" aria-live="polite"></span></p>
    </div>`;
  el.querySelector('.add').onclick = () => setQty(p.id, (items[p.id] || 0) + 1);
  room.append(el);
  return {p, el, status: el.querySelector('.in-bag')};
});
const end = document.createElement('p');
end.className = 'end';
end.textContent = 'Prototype. Photographs are placeholders; checkout is not connected.';
room.append(end);

const seen = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); }
}, {threshold: .35});
document.querySelectorAll('.reveal').forEach(el => seen.observe(el));

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
