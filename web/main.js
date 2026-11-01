/* The life cycle follows native scrolling. Text, stages and contact links also work without JS. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 1100px)');
  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#mobile-nav');
  const closeMenu = (focus = false) => {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menú');
    navigation.hidden = true;
    document.body.classList.remove('menu-open');
    if (focus) menu.focus();
  };
  menu.addEventListener('click', () => {
    const open = navigation.hidden;
    navigation.hidden = !open;
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('menu-open', open);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !navigation.hidden) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!navigation.hidden && !header.contains(event.target)) closeMenu();
  });
  document.querySelector('#year').textContent = String(new Date().getFullYear());
  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  let revealObserver;
  if ('IntersectionObserver' in window && !motion.matches) {
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: 0.08 });
    document.documentElement.classList.add('reveal-ready');
    revealItems.forEach(item => revealObserver.observe(item));
  }

  const traveler = document.querySelector('.cycle-traveler');
  const object = document.querySelector('.traveler-object');
  const characters = Object.fromEntries([...object.querySelectorAll('[data-character]')].map(img => [img.dataset.character, img]));
  const stages = [...document.querySelectorAll('[data-cycle]')];
  const localHatch = document.querySelector('.hatch-character');
  const localChick = document.querySelector('.chick-character');
  const contact = document.querySelector('#contacto');
  const whatsapp = document.querySelector('.floating-whatsapp');
  const links = [...document.querySelectorAll('.cycle-nav a')];
  const linkTargets = links.map(link => document.querySelector(link.getAttribute('href')));
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
  let frames = [];
  let transitions = [];
  let size = { height: window.innerHeight, width: window.innerWidth };
  let ready = false;
  let imageLoad;
  let frameRequest = 0;
  function schedule() { if (!frameRequest) frameRequest = requestAnimationFrame(render); }
  function documentBox(element) {
    const rect = element.getBoundingClientRect();
    // Reveals translate their element briefly; use its settled position for the route.
    const transform = getComputedStyle(element).transform;
    const matrix = transform !== 'none' && window.DOMMatrixReadOnly ? new DOMMatrixReadOnly(transform) : null;
    const left = rect.left - (matrix?.m41 || 0);
    const top = rect.top + window.scrollY - (matrix?.m42 || 0);
    const linkPadding = element.matches('.cycle-nav a') ? 12 : 0;
    return { left: left - linkPadding, top, right: left + rect.width + linkPadding, bottom: top + rect.height };
  }
  function intersects(a, b, box, clearance) {
    let near = 0, far = 1;
    for (const [axis, low, high] of [['x', 'left', 'right'], ['y', 'top', 'bottom']]) {
      const delta = b[axis] - a[axis];
      const min = box[low] - clearance, max = box[high] + clearance;
      if (Math.abs(delta) < .001) {
        if (a[axis] < min || a[axis] > max) return false;
      } else {
        const enter = (min - a[axis]) / delta, leave = (max - a[axis]) / delta;
        near = Math.max(near, Math.min(enter, leave));
        far = Math.min(far, Math.max(enter, leave));
        if (near > far) return false;
      }
    }
    return true;
  }
  function routeBetween(a, b, boxes, boundary) {
    if (a.stage === b.stage) return null;
    // Short paths through the space between scenes. No route is allowed through copy,
    // navigation links or photographs; a controlled dissolve handles tighter layouts.
    for (const width of [Math.min(160, Math.max(110, size.width * .105)), 110]) {
      const clearance = width / 2 + 12;
      const ys = [boundary, ...boxes.flatMap(box => [box.top - clearance - 1, box.bottom + clearance + 1])]
        .filter(y => y >= a.y && y <= b.y);
      const xs = [size.width / 2, ...boxes.flatMap(box => [box.left - clearance - 1, box.right + clearance + 1])]
        .filter(x => x >= clearance && x <= size.width - clearance);
      const candidates = [[a, b]];
      for (const y of ys) candidates.push([a, { x:a.x, y }, { x:b.x, y }, b]);
      for (const x of xs) candidates.push([a, { x, y:a.y }, { x, y:b.y }, b]);
      let best;
      for (const candidate of candidates) {
        const points = candidate.filter((point, i) => !i || Math.hypot(point.x - candidate[i - 1].x, point.y - candidate[i - 1].y) > .1);
        if (points.some(point => point.x < clearance || point.x > size.width - clearance)) continue;
        if (points.slice(1).some((point, i) => boxes.some(box => intersects(points[i], point, box, clearance)))) continue;
        const lengths = points.slice(1).map((point, i) => Math.hypot(point.x - points[i].x, point.y - points[i].y));
        const length = lengths.reduce((total, value) => total + value, 0);
        if (!best || length < best.length) best = { points, lengths, length, width };
      }
      if (best) return best;
    }
    return null;
  }
  function pointOnRoute(route, progress) {
    let distance = route.length * clamp(progress);
    for (let i = 0; i < route.lengths.length; i++) {
      const length = route.lengths[i];
      if (distance <= length || i === route.lengths.length - 1) {
        const t = ease(distance / Math.max(1, length));
        return { x:lerp(route.points[i].x, route.points[i + 1].x, t), y:lerp(route.points[i].y, route.points[i + 1].y, t) };
      }
      distance -= length;
    }
    return route.points[0];
  }
  function loadTraveler() {
    if (motion.matches || ready || imageLoad) return;
    imageLoad = Promise.all(Object.values(characters).map(async img => {
      const source = img.dataset.src || img.getAttribute('src');
      if (!source) throw new Error('Missing cycle image');
      if (!img.getAttribute('src') || (img.complete && !img.naturalWidth)) img.src = source;
      img.decoding = 'async';
      await img.decode();
    })).then(() => { ready = true; measure(); }).catch(() => { ready = false; imageLoad = undefined; schedule(); });
  }
  function measure() {
    size = { height: window.innerHeight, width: document.documentElement.clientWidth };
    const scroll = window.scrollY;
    const anchors = stages.map(stage => {
      const rect = stage.getBoundingClientRect();
      const y = rect.top + scroll + rect.height / 2;
      return { x: rect.left + rect.width / 2, y, width: rect.width * .84, scroll: Math.max(0, y - size.height * .53) };
    });
    frames = [
      { ...anchors[0], stage:0, scroll: 0, state: 'egg', rotate: -11, scale: .83 },
      { ...anchors[1], stage:1, scroll: anchors[1].scroll - 85, state: 'hatch', rotate: 0, scale: 1 },
      { ...anchors[1], stage:1, scroll: anchors[1].scroll + 140, state: 'chick', rotate: 0, scale: .86 },
      { ...anchors[2], stage:2, state: 'pullet', rotate: -3, scale: .95 },
      { ...anchors[3], stage:3, state: 'hen', rotate: 0, scale: .95 }
    ];
    for (let i = 1; i < frames.length; i++) frames[i].scroll = Math.max(frames[i].scroll, frames[i - 1].scroll + 1);
    if (!motion.matches) {
      // Narrow layouts stack copy across the full width, so they use the corner dock instead of routes.
      const boxes = desktop.matches ? [...document.querySelectorAll('.cycle-nav a, .story-copy, .farm-copy, .farm-entry, .farm-life')].map(documentBox) : [];
      transitions = frames.slice(1).map((frame, i) => desktop.matches ? routeBetween(frames[i], frame, boxes, documentBox(stages[frame.stage].closest('section')).top) : null);
      loadTraveler();
    }
    if (size.width > 700 && !navigation.hidden) closeMenu();
    schedule();
  }
  function paint(img, opacity, transform) {
    img.style.opacity = String(clamp(opacity));
    img.style.transform = transform;
  }
  function localAnimation() {
    const hatchRect = stages[1].getBoundingClientRect();
    const hatchProgress = clamp((size.height * .8 - hatchRect.top) / Math.max(1, hatchRect.height * .88));
    const emerge = ease((hatchProgress - .62) / .33);
    paint(localHatch, 1 - emerge, `translateY(${emerge * 5}%) scale(${1 - emerge * .08})`);
    paint(localChick, emerge, `translateY(${-Math.sin(emerge * Math.PI) * 5}%) scale(${lerp(.69, .88, emerge)})`);
    const pulletRect = stages[2].getBoundingClientRect();
    const growth = ease((size.height * .85 - pulletRect.top) / Math.max(1, pulletRect.height));
    stages[2].querySelector('.local-character').style.transform = `scale(${lerp(.72,.95,growth)}) rotate(${lerp(-4,0,growth)}deg)`;
    const eggRect = stages[0].getBoundingClientRect();
    stages[0].querySelector('.local-character').style.transform = `scale(.83) rotate(${-11 + clamp(-eggRect.top / size.height) * 7}deg)`;
  }
  function resetMotion() {
    document.querySelectorAll('.local-character').forEach(img => {
      img.style.removeProperty('opacity');
      img.style.removeProperty('transform');
    });
    Object.values(characters).forEach(img => {
      img.style.removeProperty('opacity');
      img.style.removeProperty('transform');
    });
    object.style.removeProperty('transform');
    object.style.removeProperty('--dock');
    traveler.classList.remove('is-docked');
  }
  function render() {
    frameRequest = 0;
    const scroll = Math.max(0, window.scrollY);
    const contactRect = contact.getBoundingClientRect();
    whatsapp.classList.toggle('is-visible', scroll > 500 && !(contactRect.top < size.height * .65 && contactRect.bottom > size.height * .2));
    let current = 0;
    linkTargets.forEach((target, i) => { if (target.offsetTop <= scroll + size.height * .45) current = i; });
    links.forEach((link, i) => {
      link.classList.toggle('is-current', i === current);
      if (i === current) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    const enhanced = ready && !motion.matches;
    document.documentElement.classList.toggle('cycle-enabled', enhanced);
    traveler.classList.toggle('is-ready', enhanced);
    if (motion.matches) return;
    if (!enhanced) { localAnimation(); return; }
    if (!frames.length) return;
    let index = 0;
    while (index < frames.length - 2 && scroll >= frames[index + 1].scroll) index++;
    const a = frames[index], b = frames[index + 1];
    const raw = clamp((scroll - a.scroll) / Math.max(1, b.scroll - a.scroll));
    const route = transitions[index];
    let position, width, scale, rotate, blend, opacity = 1, dock = 0;
    if (a.stage === b.stage) {
      const t = ease((raw - .18) / .64);
      position = a;
      width = lerp(a.width, b.width, t);
      scale = lerp(a.scale, b.scale, t);
      rotate = lerp(a.rotate, b.rotate, t);
      blend = t;
    } else if (route) {
      const departure = ease((raw - .10) / .15);
      const arrival = ease((raw - .76) / .16);
      position = pointOnRoute(route, (raw - .25) / .51);
      width = raw < .5 ? lerp(a.width, route.width, departure) : lerp(route.width, b.width, arrival);
      scale = raw < .5 ? lerp(a.scale, 1, departure) : lerp(1, b.scale, arrival);
      rotate = raw < .5 ? lerp(a.rotate, 0, departure) : lerp(0, b.rotate, arrival);
      blend = ease((raw - .70) / .18);
    } else if (!desktop.matches) {
      // On phones and tablets the copy fills the column: the character leaves its scene,
      // waits in a small badge at the lower left while the text scrolls by, grows there
      // into its next stage and flies into the following scene.
      const dockWidth = size.width < 500 ? 76 : 92;
      const corner = { x: 14 + dockWidth / 2, y: scroll + size.height - 14 - dockWidth / 2 };
      const leaving = raw < .5;
      const t = leaving ? ease((raw - .06) / .24) : ease((raw - .70) / .24);
      const from = leaving ? a : corner, to = leaving ? corner : b;
      position = { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) };
      width = leaving ? lerp(a.width, dockWidth, t) : lerp(dockWidth, b.width, t);
      scale = leaving ? lerp(a.scale, 1, t) : lerp(1, b.scale, t);
      rotate = leaving ? lerp(a.rotate, 0, t) : lerp(0, b.rotate, t);
      blend = ease((raw - .40) / .20);
      dock = leaving ? t : 1 - t;
    } else {
      // When the available corridor is too narrow, keep both scenes legible instead
      // of flying over their content or shrinking the character to an unreadable dot.
      const incoming = raw >= .5;
      const frame = incoming ? b : a;
      position = frame;
      width = frame.width;
      scale = frame.scale;
      rotate = frame.rotate;
      blend = incoming ? 1 : 0;
      opacity = incoming ? ease((raw - .52) / .30) : 1 - ease((raw - .18) / .30);
    }
    const x = position.x, y = position.y - scroll;
    object.style.width = `${width.toFixed(2)}px`;
    object.style.height = `${width.toFixed(2)}px`;
    object.style.transform = `translate3d(${(x-width/2).toFixed(2)}px,${(y-width/2).toFixed(2)}px,0)`;
    object.style.setProperty('--dock', dock.toFixed(3));
    traveler.classList.toggle('is-docked', dock > 0);
    Object.values(characters).forEach(img => { img.style.opacity = '0'; });
    // Finish at the farm: the hen stays in that section and scrolls out naturally.
    paint(characters[a.state], opacity * (1 - blend), `scale(${scale}) rotate(${rotate}deg)`);
    paint(characters[b.state], opacity * blend, `scale(${scale}) rotate(${rotate}deg)`);
  }
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', measure, { passive:true });
  window.addEventListener('online', loadTraveler);
  window.addEventListener('load', measure, { once:true });
  document.querySelector('.hero-art').addEventListener('animationend', measure, { once:true });
  motion.addEventListener('change', () => {
    resetMotion();
    if (motion.matches) {
      revealObserver?.disconnect();
      revealItems.forEach(item => item.classList.add('is-revealed'));
      document.documentElement.classList.remove('reveal-ready');
    }
    measure();
  });
  desktop.addEventListener('change', measure);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
  document.fonts?.ready.then(measure);
  measure();
})();
