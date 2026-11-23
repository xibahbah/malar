import {mountCommerce, money, products} from '../proto/viewing-room/commerce.js?v=2';

const {addItem} = mountCommerce();
const grid = document.querySelector('#catalog-products');
const filters = document.querySelector('.catalog-tools nav');
const collection = products.filter(product => !product.gift);
const stone = {
  marigold:'100% 0%', lotus:'0% 0%', jasmine:'50% 0%',
  vase:'50% 100%', kolam:'0% 100%', basket:'100% 100%'
};

const cards = new Map();
for (const product of collection) {
  const card = document.createElement('article');
  card.dataset.category = product.category;
  card.className = 'shop-piece';
  card.style.setProperty('--stone', stone[product.id]);
  const href = './#piece-' + product.id;
  card.innerHTML = `
    <a class="shop-detail" href="${href}">
      <div class="shop-photo"><img src="${product.image}" alt="" decoding="async"></div>
      <div class="shop-caption"><h2>${product.name}</h2><span class="shop-price">${money(product.price)}</span></div>
    </a>
    <p class="shop-spec">${product.spec}</p>
    <button class="shop-add" type="button" aria-label="Add ${product.name} to bag">Add to bag</button>`;
  card.querySelector('.shop-add').addEventListener('click', event => addItem(product.id, event.currentTarget));
  cards.set(product.id, card);
}

const types = document.querySelector('.type-links');
const query = document.querySelector('#catalog-query');
const material = document.querySelector('#catalog-material');
const price = document.querySelector('#catalog-price');
const sort = document.querySelector('#catalog-sort');
const summary = document.querySelector('#filter-summary');
const reset = document.querySelector('.reset-filters');
const slug = value => value.toLowerCase().replaceAll(' ', '-');

function urlWith(values) {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  return url;
}
function navigate(url, replace = false) {
  if (url.href !== location.href) history[replace ? 'replaceState' : 'pushState'](null, '', url);
  render();
}
function selectLinks(nav, key, selected) {
  for (const link of nav.querySelectorAll('a')) {
    if (link.dataset[key] === selected) link.setAttribute('aria-current','true');
    else link.removeAttribute('aria-current');
  }
}
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
let lastCategory;
function render() {
  grid.classList.toggle('catalog-enter', lastCategory === undefined);
  const params = new URLSearchParams(location.search);
  const cat = params.get('category');
  const category = cat === 'objects' ? 'Objects' : cat === 'all' ? 'All' : 'Jewelry';
  const department = collection.filter(p => category === 'All' || p.category === category);
  if (lastCategory !== category) {
    const typeNames = [...new Set(department.map(p => p.type))].sort();
    types.replaceChildren(...['', ...typeNames].map(name => {
      const link = document.createElement('a');
      link.dataset.type = slug(name);
      link.textContent = name || (category === 'All' ? 'All types' : 'All ' + category.toLowerCase());
      return link;
    }));
    const materials = [...new Set(department.flatMap(p => p.materials))].sort();
    material.replaceChildren(new Option('All materials',''), ...materials.map(name => new Option(name,slug(name))));
    lastCategory = category;
  }
  for (const link of filters.querySelectorAll('a')) {
    const target = link.dataset.category;
    link.href = urlWith({category:target === 'Jewelry' ? '' : slug(target), type:'', material:''});
  }
  for (const link of types.querySelectorAll('a')) link.href = urlWith({type:link.dataset.type});
  const type = [...types.children].some(link => link.dataset.type === params.get('type')) ? params.get('type') : '';
  selectLinks(filters,'category',category);
  selectLinks(types,'type',type);
  for (const [control,key] of [[material,'material'],[price,'price'],[sort,'sort']]) {
    control.value = params.get(key) || '';
    if (control.selectedIndex === -1) control.value = '';
  }
  const search = (params.get('q') || '').slice(0,120);
  if (query.value !== search) query.value = search;
  const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const result = department.filter(p => {
    const description = [p.name,p.spec,p.type,p.category,...p.materials].join(' ').toLowerCase();
    return (!type || slug(p.type) === type)
      && (!material.value || p.materials.some(name => slug(name) === material.value))
      && (!price.value || inRange[price.value](p.price))
      && words.every(word => description.includes(word));
  });
  if (sort.value) result.sort(compare[sort.value]);
  grid.replaceChildren(...result.map((product,index) => {
    const card = cards.get(product.id);
    card.style.setProperty('--order', index);
    return card;
  }));
  document.querySelector('#piece-count').textContent = result.length + (result.length === 1 ? ' piece' : ' pieces');
  document.querySelector('#no-matches').hidden = result.length > 0;
  summary.hidden = !(type || material.value || price.value || search);
}
for (const nav of [filters,types]) nav.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(new URL(link.href));
});
for (const [control,key] of [[material,'material'],[price,'price'],[sort,'sort']]) {
  control.addEventListener('change', () => navigate(urlWith({[key]:control.value})));
}
let editingSearch = false;
query.addEventListener('input', () => {
  navigate(urlWith({q:query.value}), editingSearch);
  editingSearch = true;
});
query.addEventListener('blur', () => { editingSearch = false; });
reset.addEventListener('click', () => {
  navigate(urlWith({type:'',material:'',price:'',q:''}));
  types.querySelector('[aria-current]').focus();
});
window.addEventListener('popstate', () => { editingSearch = false; render(); });
render();
