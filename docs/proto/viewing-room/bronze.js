// The burnishing stays fixed while a wide, soft reflection tracks the pointer.
export function mountBronze(drawer, reduced) {
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  let frame = 0, last = 0, current = 0, target = 0, bounds;
  function paint(time) {
    frame = 0;
    if (!drawer.open || reduced.matches || !fine.matches) { reset(); return; }
    const dt = last ? Math.min(48, time - last) : 16;
    last = time;
    current += (target - current) * (1 - Math.exp(-dt / 115));
    drawer.style.setProperty('--reflection-x', (current * 21).toFixed(2) + '%');
    if (Math.abs(current - target) > .002) frame = requestAnimationFrame(paint);
    else last = 0;
  }
  function wake() {
    if (!frame && drawer.open && !reduced.matches && fine.matches) frame = requestAnimationFrame(paint);
  }
  function reset() {
    cancelAnimationFrame(frame);
    frame = last = current = target = 0;
    bounds = null;
    drawer.style.removeProperty('--reflection-x');
  }
  drawer.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || reduced.matches || !fine.matches) return;
    bounds ??= drawer.getBoundingClientRect();
    const x = (e.clientX - bounds.left) / Math.max(1, bounds.width) - .5;
    const y = (e.clientY - bounds.top) / Math.max(1, bounds.height) - .5;
    target = Math.min(1, Math.max(-1, x * 1.6 + y * .4));
    wake();
  }, {passive:true});
  drawer.addEventListener('pointerleave', () => { target = 0; wake(); });
  drawer.addEventListener('animationend', () => { bounds = null; });
  drawer.addEventListener('close', reset);
  addEventListener('resize', () => { bounds = null; }, {passive:true});
  fine.addEventListener('change', reset);
  reduced.addEventListener('change', reset);
}
