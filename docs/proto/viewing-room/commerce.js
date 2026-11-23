const here = new URL('./', import.meta.url);
const $ = selector => document.querySelector(selector);
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
export const money = cents => '$' + (cents / 100).toFixed(cents % 100 ? 2 : 0);

export const products = await (await fetch(new URL('products.json?v=7', here))).json();
for (const p of products) p.image = new URL(p.image, here).href;
for(const amount of [25,50,100])products.push({id:'gift-'+amount,name:'Gift card · $'+amount,price:amount*100,image:new URL('../../gift-gold.svg',here).href,gift:true});

export function mountCommerce({pausePage = () => {}, resumePage = () => {}, productStatus = () => null} = {}) {
  /* ---------- bag ---------- */
  const KEY = 'malar-viewing-room-v1';
  let items;
  function restoreItems() {
    items = {};
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      for (const {id} of products) {
        if (Number.isInteger(saved[id]) && saved[id] > 0) items[id] = Math.min(20, saved[id]);
      }
    } catch {}
  }
  restoreItems();
  const count = () => Object.values(items).reduce((a, b) => a + b, 0);
  const total = () => products.reduce((sum, p) => sum + p.price * (items[p.id] || 0), 0);
  function setQty(id, q) {
    q = Math.max(0, Math.min(20, q));
    if (q) items[id] = q; else delete items[id];
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    renderBag();
  }

  /* ---------- bag drawer ---------- */
  const menu = $('#menu'), nav = $('#site-links');
  let drawerTrigger = null;
  const bag = $('#bag'), lines = $('#bag-lines'), note = $('#bag-note'), checkout = $('#bag-checkout');
  function createBagRow(p) {
    const li = document.createElement('li');
    li.dataset.product = p.id;
    li.innerHTML = `
        <span class="bag-art${p.gift ? ' bag-art-gift' : ''}" aria-hidden="true">
          <img src="${p.image}" alt="">
          ${p.gift ? '<span class="card-mark">malar</span>' : ''}
        </span>
        <span class="bag-product"><span class="name">${p.gift ? 'Gift card' : p.name}</span>
          <span class="unit-price">${money(p.price)} each</span>
        </span>
        <span class="line"></span>
        <span class="qty">
          <button type="button" data-d="-1" aria-label="One fewer ${p.name}">−</button>
          <span aria-label="Quantity"></span>
          <button type="button" data-d="1" aria-label="One more ${p.name}">+</button>
        </span>
        <button type="button" class="remove" aria-label="Remove ${p.name}">Remove</button>`;
    li.querySelectorAll('[data-d]').forEach(b => b.onclick = () => setQty(p.id, (items[p.id] || 0) + Number(b.dataset.d)));
    li.querySelector('.remove').onclick = () => setQty(p.id, 0);
    return li;
  }

  // The amount is committed immediately, even when the previous gesture is still settling.
  function updateBagValue(el, next, direction) {
    if (el.textContent === next) return;
    const animate = el.textContent && bag.open && !reduce.matches && direction;
    el.textContent = next;
    if (!animate) return;
    el.getAnimations().forEach(animation => animation.cancel());
    el.animate([
      {transform:'translateY(' + direction * 6 + 'px)', opacity:.4},
      {transform:'translateY(0)', opacity:1}
    ], {duration:200, easing:'cubic-bezier(.2,.7,.25,1)'});
  }

  function removeBagRow(row) {
    if (!bag.open || reduce.matches || !row.offsetHeight) { row.remove(); return; }
    const style = getComputedStyle(row);
    const start = {height:row.offsetHeight + 'px', paddingTop:style.paddingTop, paddingBottom:style.paddingBottom};
    row.inert = true;
    row.style.overflow = 'clip';
    const exit = row.animate([
      {...start, opacity:1, offset:0},
      {...start, opacity:0, offset:.4},
      {height:'0px', paddingTop:'0px', paddingBottom:'0px', borderTopWidth:'0px', opacity:0}
    ], {duration:240, easing:'cubic-bezier(.25,.7,.35,1)', fill:'forwards'});
    exit.onfinish = () => row.remove();
  }

  function renderBag() {
    const focused = document.activeElement;
    const rowWithFocus = lines.contains(focused) ? focused.closest('li') : null;
    const quantity = count();
    $('#bag-count').textContent = quantity;
    document.querySelectorAll('.night-note [data-open-bag]').forEach(el=>el.textContent='Bag · '+quantity);
    checkout.disabled = !quantity;
    if (quantity) lines.querySelector('.empty')?.remove();
    let direction = 0;
    let previousRow = null;
    for (const p of products) {
      const q = items[p.id] || 0;
      const status = productStatus(p.id);
      if (status) status.textContent = q ? `In bag · ${q}` : '';
      let row = lines.querySelector('[data-product="' + p.id + '"]:not([inert])');
      if (!q) {
        if (row) { direction = -1; removeBagRow(row); }
        continue;
      }
      if (!row) {
        row = createBagRow(p);
        lines.insertBefore(row, previousRow ? previousRow.nextSibling : lines.firstChild);
      }
      previousRow = row;
      const counter = row.querySelector('[aria-label="Quantity"]');
      const change = Math.sign(q - Number(counter.textContent));
      if (change) direction = change;
      updateBagValue(counter, String(q), change);
      updateBagValue(row.querySelector('.line'), money(p.price * q), change);
    }
    updateBagValue($('#bag-total'), money(total()), direction);
    if (!quantity && !lines.querySelector('.empty')) {
      const empty = document.createElement('li');
      empty.className = 'empty';
      empty.textContent = 'Your bag is empty.';
      lines.append(empty);
    }
    if (rowWithFocus && (rowWithFocus.inert || !rowWithFocus.isConnected)) {
      (lines.querySelector('li:not([inert]) button') || $('#bag-close')).focus({preventScroll:true});
    }
  }
  function setMenu(open, restoreFocus = false) {
    nav.hidden = !open;
    menu.setAttribute('aria-expanded', String(open));
    if (restoreFocus) menu.focus({preventScroll:true});
  }
  menu.addEventListener('click', () => {
    if (nav.hidden) {
      pausePage();
    }
    setMenu(nav.hidden);
  });
  document.addEventListener('pointerdown', e => {
    if (!nav.hidden && !menu.parentElement.contains(e.target)) setMenu(false);
  });
  menu.parentElement.addEventListener('focusout', e => {
    if (!menu.parentElement.contains(e.relatedTarget)) setMenu(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !nav.hidden) {
      e.preventDefault();
      setMenu(false, true);
    }
  });
  function openBag(trigger) {
    setMenu(false);
    pausePage();
    if (!bag.open) drawerTrigger = trigger;
    note.textContent = '';
    $('#bag-open').setAttribute('aria-expanded', 'true');
    if (!bag.open) bag.showModal();
  }
  function addItem(id, trigger) {
    const quantity = items[id] || 0;
    if (quantity < 20) setQty(id, quantity + 1);
    openBag(trigger);
    return quantity < 20;
  }
  $('#bag-open').onclick = e => openBag(e.currentTarget);
  bag.addEventListener('close', () => {
    $('#bag-open').setAttribute('aria-expanded', 'false');
    drawerTrigger?.focus({preventScroll:true});
    drawerTrigger = null;
    dispatchEvent(new Event('malar:wall-wake'));
    resumePage();
  });
  $('#bag-close').onclick = () => bag.close();
  bag.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const controls = [...bag.querySelectorAll('button:not(:disabled),a[href]')].filter(el => !el.closest('[inert]') && el.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
  bag.addEventListener('click', e => { const r=bag.getBoundingClientRect();if(e.target===bag&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))bag.close(); });
  checkout.onclick = () => {
    // TODO: payment provider. Until then this is a mock and says so.
    const sum = money(total());
    items = {};
    try { localStorage.setItem(KEY, '{}'); } catch {}
    renderBag();
    $('#bag-close').focus({preventScroll:true});
    note.textContent = `Mock order placed for ${sum}. Nothing was charged; checkout is not connected yet.`;
  };
  renderBag();
  function syncBag() {
    restoreItems();
    renderBag();
  }
  addEventListener('pageshow', event => { if (event.persisted) syncBag(); });
  addEventListener('storage', event => { if (event.key === KEY || event.key === null) syncBag(); });
  return {addItem, openBag, count, bag, nav, setMenu};
}
