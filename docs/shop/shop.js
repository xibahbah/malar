import {catalogProducts, money, mountCommerce} from '../proto/viewing-room/commerce.js?v=3';

const $ = selector => document.querySelector(selector);
const {addItem} = mountCommerce();
const collection = catalogProducts.filter(product => !product.gift);
const featured = ['marigold', 'nila', 'anar', 'vase', 'champak', 'rain', 'jasmine', 'lotus', 'deepam', 'kolam', 'tulsi', 'basket'];
const byFeatured = new Map(featured.map((id, index) => [id, index]));
const rank = product => byFeatured.get(product.id) ?? Infinity;
const grid = $('#catalog-products');
const catalog = $('.catalog');
const detail = $('#detail');
const filters = [['type', $('#catalog-type')], ['material', $('#catalog-material')], ['price', $('#catalog-price')], ['sort', $('#catalog-sort')]];
const query = $('#catalog-query');
const reset = $('.reset-filters');
const slug = value => value.toLowerCase().replaceAll(' ', '-');
const compare = {
  'price-asc': (a,b) => a.price - b.price,
  'price-desc': (a,b) => b.price - a.price,
  'name-asc': (a,b) => a.name.localeCompare(b.name, 'en'),
  'name-desc': (a,b) => b.name.localeCompare(a.name, 'en')
};
const inRange = {
  'under-50': cents => cents < 5000,
  '50-75': cents => cents >= 5000 && cents <= 7500,
  'over-75': cents => cents > 7500
};

function urlWith(values) {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  return url;
}

function navigate(url, {replace = false, state = {}} = {}) {
  if (url.href !== location.href) {
    if (!replace) history.replaceState({...history.state, scrollY}, '');
    history[replace ? 'replaceState' : 'pushState'](state, '', url);
  }
  render();
}

function photo(product, lazy = false) {
  const frame = document.createElement('div');
  frame.className = 'product-photo' + (product.shopOnly ? '' : ' cutout');
  const img = document.createElement('img');
  img.src = product.image;
  img.alt = '';
  img.decoding = 'async';
  if (lazy) img.loading = 'lazy';
  frame.append(img);
  return frame;
}

function makeCard(product, index) {
  const card = document.createElement('article');
  card.className = 'shop-piece';
  card.dataset.id = product.id;
  card.innerHTML = `
    <a class="shop-detail">
      <div class="shop-caption"><h2>${product.name}</h2><span class="shop-price">${money(product.price)}</span></div>
    </a>
    <div class="card-foot"><p class="shop-spec">${product.spec}</p>
      <button class="shop-add" type="button" aria-label="Add ${product.name} to bag">Add to bag</button></div>`;
  const link = card.querySelector('a');
  link.href = urlWith({piece: product.id});
  link.prepend(photo(product, index >= 3));
  card.querySelector('button').onclick = event => addItem(product.id, event.currentTarget);
  return card;
}

function populateSelect(control, first, values) {
  const options = [...new Set(values)].sort().map(name => new Option(name, slug(name)));
  control.replaceChildren(new Option(first, ''), ...options);
}

let lastCategory;
function showCatalog(params) {
  document.title = 'Shop — Malar';
  const key = params.get('category');
  const category = key === 'objects' ? 'Objects' : key === 'all' ? 'All' : 'Jewelry';
  const department = collection.filter(p => category === 'All' || p.category === category);
  if (lastCategory !== category) {
    populateSelect($('#catalog-type'), 'All types', department.map(p => p.type));
    populateSelect($('#catalog-material'), 'All materials', department.flatMap(p => p.materials));
    lastCategory = category;
  }
  for (const link of $('.departments').children) {
    if (link.dataset.category === category) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
    link.href = urlWith({category: link.dataset.category === 'Jewelry' ? '' : slug(link.dataset.category), type:'', material:''});
  }
  const selected = {};
  for (const [key, control] of filters) {
    control.value = params.get(key) || '';
    if (control.selectedIndex === -1) control.value = '';
    selected[key] = control.value;
  }
  const search = (params.get('q') || '').slice(0,120);
  if (query.value !== search) query.value = search;
  const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const result = department.filter(p => {
    const terms = [p.name,p.spec,p.type,p.category,p.description,...p.materials].join(' ').toLowerCase();
    return (!selected.type || slug(p.type) === selected.type)
      && (!selected.material || p.materials.some(m => slug(m) === selected.material))
      && (!selected.price || inRange[selected.price](p.price))
      && words.every(word => terms.includes(word));
  });
  result.sort(compare[selected.sort] || ((a,b) => rank(a) - rank(b)));
  grid.replaceChildren(...result.map(makeCard));
  $('#piece-count').textContent = result.length + (result.length === 1 ? ' piece' : ' pieces');
  $('#no-matches').hidden = result.length > 0;
  reset.hidden = !(search || Object.values(selected).some(Boolean));
}

function showDetail(product) {
  const back = $('.back-link');
  back.href = urlWith({piece:''});
  $('#detail-name').textContent = product ? product.name : 'Piece unavailable';
  document.title = $('#detail-name').textContent + ' — Malar';
  if (!product) {
    $('.detail-photo').replaceChildren();
    for (const el of $('.product-copy').children) el.hidden = el.id !== 'detail-name';
    return;
  }
  for (const el of $('.product-copy').children) el.hidden = false;
  $('.detail-photo').replaceChildren(photo(product));
  $('.detail-photo img').alt = product.name;
  $('#detail-type').textContent = product.category + ' / ' + product.type;
  $('#detail-price').textContent = money(product.price);
  $('#detail-description').textContent = product.description;
  $('#detail-material').textContent = product.spec;
  $('.detail-add').onclick = event => addItem(product.id, event.currentTarget);
}

function render() {
  const params = new URLSearchParams(location.search);
  const id = params.get('piece');
  catalog.hidden = Boolean(id);
  detail.hidden = !id;
  if (id) showDetail(collection.find(p => p.id === id));
  else showCatalog(params);
}

function regularClick(event) {
  return !event.button && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
$('.departments').addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || !regularClick(event)) return;
  event.preventDefault();
  navigate(new URL(link.href));
});

grid.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || !regularClick(event)) return;
  event.preventDefault();
  history.replaceState({...history.state, focusPiece: link.closest('article').dataset.id}, '');
  navigate(new URL(link.href), {state:{fromList:true}});
  window.scrollTo(0, 0);
  $('#detail-name').focus({preventScroll:true});
});
$('.back-link').onclick = event => {
  if (history.state?.fromList && regularClick(event)) {
    event.preventDefault();
    history.back();
  }
};
for (const [key, control] of filters) {
  control.addEventListener('change', () => navigate(urlWith({[key]:control.value})));
}
let editingSearch = false;
query.addEventListener('input', () => {
  navigate(urlWith({q:query.value}), {replace:editingSearch});
  editingSearch = true;
});
query.addEventListener('blur', () => { editingSearch = false; });
reset.onclick = () => {
  navigate(urlWith({type:'',material:'',price:'',q:'',sort:''}));
  $('#refine-toggle').focus();
};
$('#refine-toggle').onclick = event => {
  const panel = $('#refine');
  panel.hidden = !panel.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
};
history.scrollRestoration = 'manual';
window.addEventListener('popstate', () => {
  editingSearch = false;
  render();
  const id = history.state?.focusPiece;
  if (!catalog.hidden && id) grid.querySelector('[data-id="' + CSS.escape(id) + '"] a')?.focus({preventScroll:true});
  window.scrollTo(0, history.state?.scrollY ?? 0);
});
render();
