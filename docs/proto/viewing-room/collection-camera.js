import {clamp} from './scroll-motion.js?v=3';

// Only the displayed collection follows this camera. Native scrolling keeps ownership
// of wheel, touchpad inertia, scrollbars and the document's actual destination.
export function advanceCamera(position, previousTarget, target, elapsed, viewport) {
  const step = target - previousTarget;
  const immediate = position + step * .53;
  // An idle frame gap predates the new input. Only integrate the first slice
  // of its response here; subsequent frames can use their full elapsed time.
  const elapsedSinceInput = Math.min(step ? 24 : 48, elapsed);
  const remainder = (target - immediate) * Math.exp(-elapsedSinceInput / 155);
  const next = target - clamp(remainder, -viewport * .43, viewport * .43);
  if (step && (next - position) * step < 0) return immediate;
  return Math.abs(next - target) < .12 ? target : next;
}

// Interpolate between actual piece centers so a sweep lands on the piece it previews.
export function chapterAt(centers, position) {
  if (position <= centers[0]) return 0;
  for (let i = 1; i < centers.length; i++) {
    if (position <= centers[i]) {
      return i - 1 + (position - centers[i - 1]) / (centers[i] - centers[i - 1]);
    }
  }
  return centers.length - 1;
}

export function mountCollectionCamera(track, pieces) {
  const windowEl = track.querySelector('.collection-window');
  const content = track.querySelector('.collection-content');
  const index = document.createElement('div');
  index.className = 'chapter-index';
  index.setAttribute('aria-hidden', 'true');
  index.inert = true;
  const rail = document.createElement('div');
  rail.className = 'chapter-rail';
  const chapters = pieces.map(({p}) => {
    const row = document.createElement('div');
    row.className = 'chapter-row';
    const img = new Image();
    img.alt = '';
    img.decoding = 'async';
    img.src = p.image;
    const title = document.createElement('span');
    title.textContent = p.name;
    row.append(img, title);
    rail.append(row);
    return row;
  });
  index.append(rail);
  windowEl.append(index);

  let enabled = false, top = 0, range = 0, viewport = 0, centers = [];
  let position = 0, lastTarget = 0, lastTime = 0;
  let directInput = false;
  let sweep = 0, holdUntil = 0, showingIndex = false, wasNavigating = false;

  function setIndex(show) {
    if (showingIndex === show) return;
    showingIndex = show;
    track.classList.toggle('show-index', show);
  }

  function paintPosition(value) {
    if (value === position) return;
    position = value;
    content.style.transform = 'translate3d(0,' + (-value).toFixed(2) + 'px,0)';
  }

  function snap(y) {
    lastTarget = clamp(y - top, 0, range);
    if (enabled) paintPosition(lastTarget);
    sweep = holdUntil = lastTime = 0;
    setIndex(false);
  }

  function measure(active) {
    enabled = active;
    const height = content.offsetHeight;
    track.style.setProperty('--track-height', height + 'px');
    track.classList.toggle('with-camera', enabled);
    viewport = windowEl.clientHeight;
    top = track.getBoundingClientRect().top + scrollY;
    range = Math.max(0, height - viewport);
    const origin = content.getBoundingClientRect().top;
    centers = pieces.map(({el}) => {
      const bounds = el.getBoundingClientRect();
      return bounds.top - origin + bounds.height / 2;
    });
    index.style.setProperty('--row-height', clamp(viewport * .135, 70, 120) + 'px');
    if (!enabled) {
      content.style.removeProperty('transform');
      position = 0;
    }
    snap(scrollY);
  }

  function pageTop(element) {
    if (!enabled || !content.contains(element)) return element.getBoundingClientRect().top + scrollY;
    return top + element.getBoundingClientRect().top - content.getBoundingClientRect().top;
  }

  function paint(y, now, navigating) {
    if (!enabled) return {y, moving:false};
    const target = clamp(y - top, 0, range);
    const elapsed = lastTime ? Math.max(1, now - lastTime) : 16.67;
    lastTime = now;
    const delta = target - lastTarget;
    // A deliberate jump or a keyboard destination is exact on its first frame.
    // A wheel gesture, including its OS release packets, gets one visual response.
    const direct = navigating || directInput || wasNavigating;
    wasNavigating = navigating;
    paintPosition(direct ? target : advanceCamera(position, lastTarget, target, elapsed, viewport));
    lastTarget = target;

    if (Math.sign(delta) && Math.sign(delta) !== Math.sign(sweep)) sweep = 0;
    sweep = sweep * Math.exp(-elapsed / 155) + delta;
    const at = position + viewport / 2;
    const inCollection = at > centers[0] - viewport * .4 && at < centers.at(-1) + viewport * .4;
    if (delta && !direct && inCollection && Math.abs(sweep) > viewport * .55) holdUntil = now + 470;
    if (!inCollection || direct) holdUntil = 0;
    setIndex(holdUntil > now);
    if (showingIndex) {
      const chapter = chapterAt(centers, at);
      const rowHeight = clamp(viewport * .135, 70, 120);
      rail.style.transform = 'translate3d(0,' + (-(chapter + .5) * rowHeight).toFixed(2) + 'px,0)';
      for (let i = 0; i < chapters.length; i++) {
        const distance = Math.min(2.5, Math.abs(i - chapter));
        chapters[i].style.opacity = String(Math.max(.2, 1 - distance * .38));
      }
    }
    return {y:y - target + position, moving:position !== target || showingIndex};
  }

  addEventListener('wheel', e => {
    if (!e.ctrlKey && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) directInput = false;
  }, {passive:true});
  addEventListener('keydown', e => {
    if (['Tab','Home','End','PageUp','PageDown','ArrowDown','ArrowUp',' '].includes(e.key)) directInput = true;
  });
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.clientX >= document.documentElement.clientWidth) directInput = true;
  }, {passive:true});
  // Transformed, clipped content still participates in native tab order. Bring its
  // real document position into view when focus enters from a different chapter.
  content.addEventListener('focusin', e => {
    if (!enabled || !e.target.matches(':focus-visible')) return;
    snap(scrollY);
    const rect = e.target.getBoundingClientRect();
    if (rect.top >= 56 && rect.bottom <= viewport - 20) return;
    const destination = pageTop(e.target) - viewport * .45;
    window.scrollTo({top:destination, behavior:'instant'});
    snap(scrollY);
  });
  return {measure, pageTop, paint, snap};
}
