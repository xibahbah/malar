import {mountFoil} from './gift-foil.js?v=2';

export const giftCardMarkup = `<div class="gift-stage">
  <div class="gift-foil" aria-label="Gold-leaf gift card">
    <canvas class="foil-canvas" aria-hidden="true"></canvas>
    <div class="foil-inscription">
      <span class="foil-brand">malar</span><span class="foil-gesture">A small gesture</span>
      <span class="foil-foot">Gift card</span><output id="gift-value" aria-live="polite">$50</output>
    </div>
  </div>
</div>`;

export function mountGiftCard(section, reduced, addItem) {
  const foil = mountFoil(section.querySelector('.gift-foil'), reduced);
  const value = section.querySelector('#gift-value');
  const status = section.querySelector('#gift-added');
  const choices = [...section.querySelectorAll('[data-gift]')];
  let amount = 50;
  for (const button of choices) {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-pressed') === 'true') return;
      amount = Number(button.dataset.gift);
      for (const choice of choices) choice.setAttribute('aria-pressed', String(choice === button));
      value.textContent = '$' + amount;
      status.textContent = '';
      foil.amount(amount);
    });
  }
  section.querySelector('#gift-add').addEventListener('click', e => {
    if (!addItem('gift-' + amount, e.currentTarget)) status.textContent = 'This gift amount is already at the bag limit.';
  });
}
