import {clamp, smooth} from './scroll-motion.js?v=3';
import {coastStep} from './momentum.js?v=4';

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

// The reading point stays still while the original pictures and their spacing scale.
export function projectCollection(progress, position, height, compactScale) {
  progress = clamp(progress, 0, 1);
  const scale = Math.exp(Math.log(compactScale) * progress);
  const pivot = height * .5;
  return {
    scale,
    translateY: pivot - (position + pivot) * scale,
    align: smooth((progress - .22) / .78),
    captions: 1 - smooth((progress - .24) / .46),
    labels: smooth((progress - .62) / .34)
  };
}

export function advanceZoom(position, velocity, goal, seconds) {
  const next = coastStep(position, velocity, goal, seconds, goal ? 6 : 6.8);
  if (Math.abs(next.position - goal) < .001 && Math.abs(next.velocity) < .009) {
    return {position:goal, velocity:0};
  }
  return {position:clamp(next.position, 0, 1), velocity:next.velocity};
}

function layoutOffset(element, ancestor, key) {
  let result = 0;
  for (let node = element; node && node !== ancestor; node = node.offsetParent) result += node[key];
  return result;
}

export function mountCollectionCamera(track, pieces, {wake, stopNavigation}) {
  const windowEl = track.querySelector('.collection-window');
  const content = track.querySelector('.collection-content');
  const toggle = document.querySelector('#collection-toggle');
  const nav = document.createElement('nav');
  nav.id = 'collection-index';
  nav.className = 'chapter-index';
  nav.setAttribute('aria-label', 'Collection index');
  nav.hidden = true;
  const list = document.createElement('ol');
  const chapters = pieces.map(({p, el}) => {
    const row = document.createElement('li');
    const link = document.createElement('a');
    const label = document.createElement('span');
    label.textContent = p.name;
    const destination = new URL(location.href);
    destination.hash = el.id;
    link.href = destination.href;
    link.append(label);
    row.append(link);
    list.append(row);
    return {plate:el.querySelector('.plate'), heading:el.querySelector('h3'), link, row};
  });
  nav.append(list);
  windowEl.append(nav);

  let enabled = false, top = 0, range = 0, height = 1, width = 1;
  let centers = [], metrics = [], rowHeight = 100, compactScale = .2;
  let position = 0, lastTarget = 0, time = 0, panVelocity = 0;
  let zoom = 0, zoomVelocity = 0, sweep = 0, enteredAt = 0, holdUntil = 0;
  let mode = 'detail', selected = -1, focusList = false, focusingPiece = false;
  let directInput = false, wasNavigating = false, zoomStyles = false;
  let previousTransform = '', activeChapter = -1;

  function atCollection(center, margin = .47) {
    return center >= centers[0] - height * margin && center <= centers.at(-1) + height * margin;
  }

  function pageTop(element) {
    if (!content.contains(element)) return element.getBoundingClientRect().top + scrollY;
    return top + layoutOffset(element, content, 'offsetTop');
  }

  function clearProjection() {
    if (!zoomStyles) return;
    zoomStyles = false;
    content.style.removeProperty('--detail-ink');
    for (const {plate} of chapters) plate.style.removeProperty('transform');
  }

  function applyScene(transform) {
    if (transform === previousTransform) return;
    previousTransform = transform;
    content.style.transform = transform;
  }

  function setInterface(open, interactive) {
    if (toggle.getAttribute('aria-expanded') !== String(open)) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close collection index' : 'Open collection index');
    }
    const blockIndex = !interactive;
    if (nav.inert !== blockIndex || !nav.hasAttribute('aria-hidden')) {
      nav.inert = blockIndex;
      nav.setAttribute('aria-hidden', String(blockIndex));
    }
    const lockDetail = interactive || (enabled && zoom > .35);
    if (content.inert !== lockDetail) content.inert = lockDetail;
    if (interactive && focusList) {
      focusList = false;
      const i = Math.round(chapterAt(centers, position + height / 2));
      chapters[i].link.focus({preventScroll:true});
    }
  }

  function markChapter(index) {
    if (activeChapter === index) return;
    if (activeChapter >= 0) chapters[activeChapter].link.removeAttribute('aria-current');
    chapters[index].link.setAttribute('aria-current', 'location');
    activeChapter = index;
  }

  function paintProjection() {
    const view = projectCollection(zoom, position, height, compactScale);
    applyScene('translate3d(0,' + view.translateY.toFixed(3) + 'px,0) scale(' + view.scale.toFixed(6) + ')');
    if (nav.hidden !== (view.labels === 0)) nav.hidden = view.labels === 0;
    if (!zoom) {
      clearProjection();
      setInterface(false, false);
      return;
    }
    zoomStyles = true;
    content.style.setProperty('--detail-ink', view.captions.toFixed(4));
    nav.style.opacity = view.labels.toFixed(4);
    const center = position + height / 2;
    const chapter = chapterAt(centers, center);
    if (!nav.hidden) markChapter(Math.round(chapter));
    const sideOffset = clamp(width * .218, 120, 305);
    for (let i = 0; i < chapters.length; i++) {
      const {plate, row} = chapters[i], m = metrics[i];
      const naturalX = (m.x - width / 2) * view.scale;
      const naturalY = centers[i] * view.scale + view.translateY;
      const rowY = height / 2 + (i - chapter) * rowHeight;
      const dx = ((m.x < width / 2 ? -sideOffset : sideOffset) - naturalX) * view.align;
      const dy = (rowY - naturalY) * view.align;
      const thumbnailScale = 1 + (m.thumbnailScale - 1) * view.align;
      plate.style.transform = 'translate3d(' + (dx / view.scale).toFixed(2) + 'px,' +
        (dy / view.scale).toFixed(2) + 'px,0) scale(' + thumbnailScale.toFixed(5) + ')';
      if (!nav.hidden) {
        row.style.transform = 'translate3d(0,' + (naturalY + dy - rowHeight / 2).toFixed(2) + 'px,0)';
        row.style.setProperty('--emphasis', Math.max(.62, 1 - Math.abs(i - chapter) * .28).toFixed(3));
      }
    }
    const open = mode === 'glance' || mode === 'browse';
    setInterface(open, open && view.labels > .2);
  }

  function focusSelected() {
    if (selected < 0) return;
    focusingPiece = true;
    chapters[selected].heading.focus({preventScroll:true});
    focusingPiece = false;
    selected = -1;
  }

  function snap(y) {
    mode = 'detail';
    selected = -1;
    focusList = false;
    zoom = zoomVelocity = sweep = panVelocity = time = 0;
    position = lastTarget = clamp(y - top, 0, range);
    track.classList.remove('manual-index-open');
    nav.hidden = true;
    clearProjection();
    if (enabled) paintProjection();
    else { applyScene(''); setInterface(false, false); }
  }

  function measure(active) {
    const changedMode = enabled !== active;
    enabled = active;
    const contentHeight = content.offsetHeight;
    track.style.setProperty('--track-height', contentHeight + 'px');
    track.classList.toggle('with-camera', enabled);
    height = enabled ? windowEl.clientHeight : innerHeight;
    width = windowEl.clientWidth;
    top = track.getBoundingClientRect().top + scrollY;
    range = Math.max(0, contentHeight - height);
    centers = chapters.map(({plate}) => layoutOffset(plate, content, 'offsetTop') + plate.offsetHeight / 2);
    const meanGap = (centers.at(-1) - centers[0]) / Math.max(1, centers.length - 1);
    rowHeight = clamp(height * .15, 74, 142);
    compactScale = clamp(rowHeight / Math.max(1, meanGap), .145, .235);
    const thumbHeight = clamp(height * .102, 62, 104);
    metrics = chapters.map(({plate}) => ({
      x:layoutOffset(plate, content, 'offsetLeft') + plate.offsetWidth / 2,
      thumbnailScale:thumbHeight / Math.max(1, plate.offsetHeight * compactScale)
    }));
    nav.style.setProperty('--row-height', rowHeight + 'px');
    if (changedMode || (!zoom && mode === 'detail')) snap(scrollY);
    wake();
  }

  function dismiss(restoreFocus = false) {
    if (mode === 'detail' && !zoom) return;
    mode = 'detail';
    selected = -1;
    focusList = false;
    sweep = 0;
    if (!enabled) snap(scrollY);
    if (restoreFocus) toggle.focus({preventScroll:true});
    wake();
  }

  function centerPiece(i) {
    const target = clamp(centers[i] - height / 2, 0, range);
    window.scrollTo({top:top + target, behavior:'instant'});
  }

  function select(i, record = true) {
    stopNavigation();
    if (record && location.hash !== chapters[i].link.hash) {
      history.replaceState({...history.state, collectionScroll:scrollY}, '');
      history.pushState(null, '', chapters[i].link.hash);
    }
    // Center the chosen original in overview before opening it at reading size.
    if (!enabled || (!zoom && mode === 'detail')) {
      snap(scrollY);
      centerPiece(i);
      snap(scrollY);
      selected = i;
      focusSelected();
    } else {
      selected = i;
      mode = 'select';
      focusList = false;
      centerPiece(i);
    }
    wake();
  }

  addEventListener('popstate', e => {
    const i = chapters.findIndex(({link}) => link.hash === location.hash);
    if (i >= 0) select(i, false);
    else if (Number.isFinite(e.state?.collectionScroll)) {
      stopNavigation();
      window.scrollTo({top:e.state.collectionScroll, behavior:'instant'});
      snap(scrollY);
      wake();
    }
  });

  toggle.addEventListener('click', e => {
    if (mode !== 'detail') { dismiss(true); return; }
    stopNavigation();
    mode = 'browse';
    focusList = e.detail === 0;
    if (!enabled) {
      track.classList.add('manual-index-open');
      nav.hidden = false;
      nav.style.removeProperty('opacity');
      markChapter(Math.round(chapterAt(centers, position + height / 2)));
      setInterface(true, true);
    }
    wake();
  });

  for (const [i, {link}] of chapters.entries()) {
    link.addEventListener('click', e => {
      if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      select(i);
    });
    link.addEventListener('focus', () => {
      if (nav.inert) return;
      mode = 'browse';
      if (enabled && link.matches(':focus-visible')) {
        const r = link.getBoundingClientRect();
        if (r.top < 58 || r.bottom > height - 20) centerPiece(i);
      }
      wake();
    });
    link.addEventListener('pointermove', () => {
      if (!nav.inert && mode === 'glance') mode = 'browse';
    });
    link.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowDown') next = Math.min(i + 1, chapters.length - 1);
      else if (e.key === 'ArrowUp') next = Math.max(i - 1, 0);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = chapters.length - 1;
      else return;
      e.preventDefault();
      if (enabled) centerPiece(next);
      chapters[next].link.focus({preventScroll:true});
      wake();
    });
  }

  function paint(y, now, navigating) {
    const target = clamp(y - top, 0, range);
    const hideToggle = mode === 'detail' && zoom === 0 && !atCollection(target + height / 2);
    if (toggle.hidden !== hideToggle) toggle.hidden = hideToggle;
    if (!enabled) { position = target; return {y, moving:false, detail:1}; }
    const elapsed = time ? Math.max(1, now - time) : 16.67;
    // The idle interval before a new gesture is not elapsed animation time.
    const dt = (elapsed > 64 && zoom === 0 ? 16.67 : Math.min(elapsed, 45)) / 1000;
    time = now;
    const delta = target - lastTarget;
    const direct = directInput || navigating || wasNavigating;
    wasNavigating = navigating;
    if (Math.sign(delta) && Math.sign(delta) !== Math.sign(sweep)) sweep = 0;
    sweep = sweep * Math.exp(-elapsed / 165) + delta;
    if (mode === 'detail' && selected < 0 && !direct && delta && Math.abs(sweep) > height * .86 &&
        (atCollection(position + height / 2) || atCollection(target + height / 2))) {
      mode = 'glance';
      enteredAt = now;
      holdUntil = now + 1850;
    }
    if (mode === 'glance' && Math.abs(delta) > 1) holdUntil = now + 1850;
    if (mode === 'glance' && now >= holdUntil) mode = 'detail';
    if ((mode === 'browse' || (mode === 'glance' && now - enteredAt > 500)) &&
        delta && !atCollection(target + height / 2, 1.05)) dismiss();
    if (navigating && mode !== 'detail') dismiss();

    if (zoom || mode !== 'detail' || selected >= 0) {
      const frequency = mode === 'select' || selected >= 0 ? 11 : 3.6 + 4.6 * zoom;
      const pan = coastStep(position, panVelocity, target, dt, frequency);
      position = clamp(pan.position, 0, range);
      panVelocity = pan.velocity;
      if (Math.abs(position - target) < .25 && Math.abs(panVelocity) < 4) {
        position = target; panVelocity = 0;
      }
      if (mode === 'select' && Math.abs(target - position) < height * .14) mode = 'detail';
      const goal = mode === 'detail' ? 0 : 1;
      const lens = advanceZoom(zoom, zoomVelocity, goal, dt);
      zoom = lens.position;
      zoomVelocity = lens.velocity;
    } else {
      const before = position;
      position = direct ? target : advanceCamera(position, lastTarget, target, elapsed, height);
      panVelocity = clamp((position - before) / dt, -height * 1.6, height * 1.6);
    }
    lastTarget = target;
    paintProjection();
    if (!zoom && mode === 'detail' && selected >= 0 && position === target) focusSelected();
    const moving = position !== target || (mode === 'detail' ? zoom > 0 : zoom < 1) || mode === 'glance' || mode === 'select';
    return {y:y-target+position, moving, detail:1 - smooth(zoom / .8)};
  }

  addEventListener('wheel', e => {
    if (!e.ctrlKey && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
      directInput = false;
      if (selected >= 0) { selected = -1; mode = 'detail'; }
    }
  }, {passive:true});
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && mode !== 'detail' && !document.querySelector('dialog[open]')) {
      e.preventDefault(); dismiss(true); return;
    }
    if (['Tab','Home','End','PageUp','PageDown','ArrowDown','ArrowUp',' '].includes(e.key)) directInput = true;
  });
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.clientX >= document.documentElement.clientWidth) directInput = true;
  }, {passive:true});
  content.addEventListener('focusin', e => {
    if (focusingPiece || !enabled || !e.target.matches(':focus-visible')) return;
    snap(scrollY);
    const rect = e.target.getBoundingClientRect();
    if (rect.top >= 56 && rect.bottom <= height - 20) return;
    window.scrollTo({top:pageTop(e.target) - height * .45, behavior:'instant'});
    snap(scrollY);
  });
  return {measure, pageTop, paint, snap, dismiss};
}
