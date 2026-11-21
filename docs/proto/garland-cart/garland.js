import {createCart} from './cart.js';

const $ = s => document.querySelector(s);
const money = n => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD'}).format(n / 100);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;
if (new URLSearchParams(location.search).has('debug')) document.body.classList.add('debug');

let products, cart, state, justAdded = null, flyFrom = null;

try {
  const res = await fetch('./products.json');
  if (!res.ok) throw Error('data');
  products = await res.json();
  if (!Array.isArray(products) || !products.length) throw Error('empty');
  cart = createCart(products);
} catch {
  $('#load').textContent = 'Could not load the collection. ';
  const retry = document.createElement('button');
  retry.className = 'add';
  retry.textContent = 'Reload';
  retry.onclick = () => location.reload();
  $('#load').append(retry);
  throw Error('Product data unavailable');
}

/* ---------- Collection ---------- */
const hang = $('#pieces');
$('#load').remove();
const pendants = [];
for (const p of products) {
  const el = document.createElement('article');
  el.className = 'piece';
  el.dataset.material = p.material;
  el.innerHTML = `
    <div class="pendant"><span class="knot"></span><span class="drop"></span>
      <img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async"></div>
    <div class="label">
      <p class="kicker">${p.material}</p>
      <h2>${p.name}</h2>
      <p class="detail">${p.detail}</p>
      <span class="price">${money(p.price)}</span>
      <button class="add" data-add="${p.id}" aria-describedby="on-${p.id}">Add to strand</button>
      <span class="on" id="on-${p.id}"></span>
    </div>`;
  const pendant = el.querySelector('.pendant');
  const img = pendant.querySelector('img');
  el.querySelector('.add').onclick = () => {
    justAdded = p.id;
    flyFrom = {src: p.image, rect: img.getBoundingClientRect()};
    cart.add(p.id);
  };
  // Focus moves the lamp to the piece, so keyboard users get the same light.
  el.querySelector('.add').addEventListener('focus', () => aimAt(img));
  hang.append(el);
  pendants.push({el: pendant, img, material: p.material});
}

/* ---------- Strand (cart) ---------- */
cart.subscribe(next => {
  state = next;
  const focus = document.activeElement?.dataset || {};
  $('#count').textContent = next.count;
  $('#mobile-count').textContent = next.count;
  $('#total').textContent = money(next.total);
  const checkout = $('#checkout');
  checkout.disabled = !next.count;
  checkout.textContent = next.count ? `Tie off · ${money(next.total)}` : 'Tie off';

  const strand = $('#strand');
  strand.replaceChildren();
  const mini = $('#mini');
  mini.replaceChildren();
  if (!next.count) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'Nothing tied yet. Choose a piece to begin.';
    strand.append(li);
  }
  for (const p of products) {
    const q = next.items[p.id];
    document.getElementById(`on-${p.id}`).textContent = q ? `On your strand · ${q}` : '';
    const addBtn = document.querySelector(`[data-add="${p.id}"]`);
    addBtn.textContent = q ? 'Add another' : 'Add to strand';
    if (!q) continue;
    const li = document.createElement('li');
    li.className = 'bead' + (justAdded === p.id ? ' tied' : '');
    li.dataset.bead = p.id;
    li.innerHTML = `
      <span class="stone"><img src="${p.image}" alt=""><span class="qty-badge" aria-hidden="true">${q}</span></span>
      <div><h3>${p.name}</h3>
        <div class="controls">
          <button data-id="${p.id}" data-action="less" aria-label="One fewer ${p.name}">−</button>
          <output aria-label="Quantity">${q}</output>
          <button data-id="${p.id}" data-action="more" aria-label="One more ${p.name}" ${q >= 20 ? 'disabled' : ''}>+</button>
          <span class="line">${money(p.price * q)}</span>
          <button class="remove" data-id="${p.id}" data-action="remove" aria-label="Remove ${p.name}">Remove</button>
        </div></div>`;
    li.querySelectorAll('button').forEach(b => b.onclick = () =>
      cart.set(p.id, b.dataset.action === 'remove' ? 0 : q + (b.dataset.action === 'more' ? 1 : -1)));
    strand.append(li);
    const m = document.createElement('img');
    m.src = p.image; m.alt = '';
    mini.append(m);
  }
  if (focus.id) {
    const dest = document.querySelector(`[data-id="${focus.id}"][data-action="${focus.action}"]`)
      || document.querySelector(`[data-add="${focus.id}"]`);
    dest?.focus({preventScroll: true});
  }
  $('#status').textContent = justAdded
    ? `${products.find(p => p.id === justAdded).name} tied on. ${next.count} on your strand.`
    : (next.count ? `${next.count} on your strand.` : '');
  if (!next.persistent) $('#status').textContent += ' Storage unavailable; this visit only.';
  if (justAdded && flyFrom) fly(flyFrom, justAdded);
  justAdded = null; flyFrom = null;
});

/* The piece travels to its bead, then the bead tightens. */
function fly(from, id) {
  if (reduce.matches) return;
  const bead = document.querySelector(`[data-bead="${id}"] .stone`);
  if (!bead) return;
  const to = bead.getBoundingClientRect();
  const visible = to.bottom > 0 && to.top < innerHeight;
  if (!visible) return;
  const f = from.rect, img = new Image();
  img.src = from.src; img.className = 'flyer'; img.alt = '';
  Object.assign(img.style, {left: f.left + 'px', top: f.top + 'px', width: f.width + 'px', height: f.height + 'px'});
  document.body.append(img);
  const dx = to.left + to.width / 2 - (f.left + f.width / 2);
  const dy = to.top + to.height / 2 - (f.top + f.height / 2);
  const s = Math.min(to.width / f.width, to.height / f.height) * .72;
  img.animate([
    {transform: 'translate(0,0) scale(1)', opacity: 1},
    {transform: `translate(${dx * .5}px,${dy * .5 - 90}px) scale(${(1 + s) / 2}) rotate(-6deg)`, opacity: 1, offset: .55},
    {transform: `translate(${dx}px,${dy}px) scale(${s})`, opacity: .2}
  ], {duration: 720, easing: 'cubic-bezier(.3,.6,.2,1)'}).finished.then(() => img.remove(), () => img.remove());
}

/* ---------- Checkout ---------- */
const dialog = $('#checkout-dialog');
$('#checkout').onclick = () => {
  $('#receipt').hidden = true;
  $('#order').hidden = false;
  const review = $('#review');
  review.replaceChildren();
  for (const p of products) {
    const q = state.items[p.id];
    if (!q) continue;
    const li = document.createElement('li');
    li.innerHTML = `<span class="stone"><img src="${p.image}" alt=""></span><span>${p.name}${q > 1 ? ` × ${q}` : ''}</span><span class="line">${money(p.price * q)}</span>`;
    review.append(li);
  }
  $('#checkout-total').textContent = money(state.total);
  dialog.showModal();
  $('#confirm').focus();
};
$('#close').onclick = () => dialog.close();
dialog.onclose = () => (state.count ? $('#checkout') : document.querySelector('[data-add]')).focus({preventScroll: true});
$('#order').onsubmit = e => {
  e.preventDefault();
  if (!state.count) return;
  const amount = state.total;
  /* TODO: payment provider. Replace with an adapter; never treat this as a paid order. */
  cart.clear();
  $('#order').hidden = true;
  $('#receipt').hidden = false;
  $('#receipt-total').textContent = money(amount);
  $('#message').value = '';
  $('#continue').focus();
};
$('#continue').onclick = () => dialog.close();

/* ---------- Lamp: one light for the wall and every piece ---------- */
const lamp = {x: innerWidth * .5, y: innerHeight * .3, tx: innerWidth * .5, ty: innerHeight * .3};
let frame = 0, lastScroll = scrollY;
const isFine = matchMedia('(pointer: fine)');

function aimAt(el) {
  const r = el.getBoundingClientRect();
  lamp.tx = r.left + r.width / 2;
  lamp.ty = r.top + r.height * .35;
  request();
}
addEventListener('pointermove', e => {
  if (e.pointerType === 'touch') return;
  lamp.tx = e.clientX; lamp.ty = e.clientY; request();
}, {passive: true});
addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  lamp.tx = e.clientX; lamp.ty = e.clientY; request();
}, {passive: true});
addEventListener('scroll', request, {passive: true});
addEventListener('resize', request);
reduce.addEventListener('change', request);

function request() { if (!frame) frame = requestAnimationFrame(update); }

function update() {
  frame = 0;
  const k = reduce.matches ? 1 : .16;
  lamp.x += (lamp.tx - lamp.x) * k;
  lamp.y += (lamp.ty - lamp.y) * k;
  root.style.setProperty('--lx', lamp.x.toFixed(1) + 'px');
  root.style.setProperty('--ly', lamp.y.toFixed(1) + 'px');

  const velocity = scrollY - lastScroll;
  lastScroll = scrollY;
  const reach = Math.max(innerWidth, innerHeight) * .55;
  for (const p of pendants) {
    const r = p.img.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight + 200) continue;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = cx - lamp.x, dy = cy - lamp.y, d = Math.hypot(dx, dy) || 1;
    const near = Math.max(0, 1 - d / reach);
    // Brass catches light hardest; clay and palm stay softer.
    const gain = p.material === 'brass' ? .55 : .38;
    p.img.style.setProperty('--lit', (.62 + gain * near * near + .08).toFixed(3));
    // Shadow falls away from the lamp and lengthens as the lamp moves off.
    const len = 6 + 16 * (1 - near);
    p.img.style.setProperty('--sx', (dx / d * len).toFixed(1) + 'px');
    p.img.style.setProperty('--sy', (dy / d * len + 6).toFixed(1) + 'px');
    if (!reduce.matches) {
      const pos = Math.max(-1, Math.min(1, (cy - innerHeight / 2) / innerHeight));
      const swing = pos * 2.2 + Math.max(-3, Math.min(3, velocity * .12));
      p.el.style.setProperty('--swing', swing.toFixed(2) + 'deg');
    }
  }
  const settling = Math.abs(lamp.tx - lamp.x) > .5 || Math.abs(lamp.ty - lamp.y) > .5 || Math.abs(velocity) > .5;
  if (settling) request();
}
if (!isFine.matches) { lamp.tx = innerWidth * .5; lamp.ty = innerHeight * .35; }
request();
