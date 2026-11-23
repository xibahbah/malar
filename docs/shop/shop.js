import {mountCommerce, money, products} from '../proto/viewing-room/commerce.js';

const {addItem} = mountCommerce();
const grid = document.querySelector('#catalog-products');
const filters = document.querySelector('.catalog-tools nav');
const collection = products.filter(product => !product.gift);
const stone = {
  marigold:'100% 0%', lotus:'0% 0%', jasmine:'50% 0%',
  vase:'50% 100%', kolam:'0% 100%', basket:'100% 100%'
};

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
  grid.append(card);
}

function selectCategory() {
  const selection = new URLSearchParams(location.search).get('category');
  const active = selection === 'objects' ? 'Objects' : selection === 'all' ? 'All' : 'Jewelry';
  for (const link of filters.querySelectorAll('a')) {
    if (link.dataset.category === active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  let visible = 0;
  for (const card of grid.children) {
    card.hidden = active !== 'All' && card.dataset.category !== active;
    if (!card.hidden) card.style.setProperty('--order', visible++);
  }
  document.querySelector('#piece-count').textContent = visible + (visible === 1 ? ' piece' : ' pieces');
}

filters.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (link.hasAttribute('aria-current')) return;
  history.pushState(null, '', link.href);
  selectCategory();
});
window.addEventListener('popstate', selectCategory);
selectCategory();
