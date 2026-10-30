/* The life cycle follows native scrolling. Text, stages and contact links also work without JS. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = window.matchMedia('(min-width: 900px)');
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
  const dock = document.querySelector('.mobile-dock');
  const dockLinks = [...dock.querySelectorAll('a[href^="#"]')];
  const dockTargets = dockLinks.map(link => document.querySelector(link.getAttribute('href')));
  const hatchStage = stages[1];
  // Frame order is egg, hatch, chick, pullet, hen; hatch and chick share the recría stage.
  const frameStage = [0, 1, 1, 2, 3];
  const setLanded = landed => stages.forEach((stage, i) => stage.classList.toggle('is-landed', i === landed));
  const live = () => document.documentElement.classList.toggle('scenes-live', !motion.matches);
  live();
  const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
  let frames = [];
  let size = { height: window.innerHeight, width: window.innerWidth };
  let ready = false;
  let frameRequest = 0;
  function schedule() { if (!frameRequest) frameRequest = requestAnimationFrame(render); }
  function measure() {
    size = { height: window.innerHeight, width: document.documentElement.clientWidth };
    const scroll = window.scrollY;
    const anchors = stages.map(stage => {
      const rect = stage.getBoundingClientRect();
      const y = rect.top + scroll + rect.height / 2;
      return { x: rect.left + rect.width / 2, y, width: rect.width * .84, scroll: Math.max(0, y - size.height * .53) };
    });
    frames = [
      { ...anchors[0], scroll: 0, state: 'egg', rotate: -11, scale: .83 },
      { ...anchors[1], scroll: anchors[1].scroll - 85, state: 'hatch', rotate: 0, scale: 1 },
      { ...anchors[1], scroll: anchors[1].scroll + 140, state: 'chick', rotate: 0, scale: .86 },
      { ...anchors[2], state: 'pullet', rotate: -3, scale: .95 },
      { ...anchors[3], state: 'hen', rotate: 0, scale: .95 }
    ];
    for (let i = 1; i < frames.length; i++) frames[i].scroll = Math.max(frames[i].scroll, frames[i - 1].scroll + 1);
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
    hatchStage.classList.toggle('show-chick', emerge > .5);
    let landed = -1;
    stages.forEach((stage, i) => {
      const rect = stage.getBoundingClientRect();
      const middle = (rect.top + rect.height / 2) / size.height;
      if (middle > .12 && middle < .88 && landed < 0) landed = i;
    });
    setLanded(landed);
    const pulletRect = stages[2].getBoundingClientRect();
    const growth = ease((size.height * .85 - pulletRect.top) / Math.max(1, pulletRect.height));
    stages[2].querySelector('.local-character').style.transform = `scale(${lerp(.72,.95,growth)}) rotate(${lerp(-4,0,growth)}deg)`;
    const eggRect = stages[0].getBoundingClientRect();
    stages[0].querySelector('.local-character').style.transform = `scale(.83) rotate(${-11 + clamp(-eggRect.top / size.height) * 7}deg)`;
  }
  function render() {
    frameRequest = 0;
    const scroll = Math.max(0, window.scrollY);
    const contactRect = contact.getBoundingClientRect();
    whatsapp.classList.toggle('is-visible', scroll > 500 && !(contactRect.top < size.height * .65 && contactRect.bottom > size.height * .2));
    header.classList.toggle('is-scrolled', scroll > 8);
    dock.classList.toggle('is-visible', scroll > size.height * .5);
    let section = -1;
    dockTargets.forEach((target, i) => { if (target.offsetTop <= scroll + size.height * .5) section = i; });
    if (contact.offsetTop <= scroll + size.height * .5) section = -1;
    dockLinks.forEach((link, i) => {
      if (i === section) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    let current = 0;
    linkTargets.forEach((target, i) => { if (target.offsetTop <= scroll + size.height * .45) current = i; });
    links.forEach((link, i) => {
      link.classList.toggle('is-current', i === current);
      if (i === current) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    const enhanced = ready && desktop.matches && !motion.matches;
    document.documentElement.classList.toggle('cycle-enabled', enhanced);
    traveler.classList.toggle('is-ready', enhanced);
    if (motion.matches) return;
    traveler.classList.toggle('is-resting', false);
    if (!enhanced) { localAnimation(); return; }
    if (!frames.length) return;
    let index = 0;
    while (index < frames.length - 2 && scroll >= frames[index + 1].scroll) index++;
    const a = frames[index], b = frames[index + 1];
    const raw = clamp((scroll - a.scroll) / Math.max(1, b.scroll - a.scroll));
    const t = ease(raw);
    const width = lerp(a.width, b.width, t);
    const x = lerp(a.x, b.x, t);
    const y = lerp(a.y, b.y, t) - scroll;
    object.style.width = `${width.toFixed(2)}px`;
    object.style.height = `${width.toFixed(2)}px`;
    object.style.transform = `translate3d(${(x-width/2).toFixed(2)}px,${(y-width/2).toFixed(2)}px,0) rotateY(${(Math.sin(raw*Math.PI)*9).toFixed(2)}deg)`;
    Object.values(characters).forEach(img => { img.style.opacity = '0'; });
    const rotate = lerp(a.rotate, b.rotate, t);
    const scale = lerp(a.scale, b.scale, t);
    // Finish at the farm: the hen stays in that section and scrolls out naturally.
    const blend = b.state === 'hen' ? ease((raw-.4)/.2) : a.state === 'hatch' ? ease((raw-.5)/.35) : ease((raw-.62)/.3);
    const wobble = a.state === 'egg' && raw > .5 && raw < .9 ? Math.sin(raw * 65) * 3 * Math.sin(blend * Math.PI) : 0;
    paint(characters[a.state], a.state===b.state?1:1-blend, `scale(${scale}) rotate(${rotate+wobble}deg)`);
    if (a.state !== b.state) paint(characters[b.state], blend, `translateY(${(1-blend)*3}%) scale(${scale}) rotate(${rotate}deg)`);
    // The scene opens once the traveler settles; the character then starts its idle movement.
    const last = frames.length - 1;
    let nearest = 0;
    frames.forEach((frame, i) => { if (Math.abs(scroll - frame.scroll) < Math.abs(scroll - frames[nearest].scroll)) nearest = i; });
    const resting = scroll >= frames[last].scroll || Math.abs(scroll - frames[nearest].scroll) < size.height * .2;
    const shown = blend > .5 ? b.state : a.state;
    setLanded(resting ? frameStage[scroll >= frames[last].scroll ? last : nearest] : -1);
    hatchStage.classList.toggle('show-chick', ['chick', 'pullet', 'hen'].includes(shown));
    traveler.dataset.life = shown;
    traveler.classList.toggle('is-resting', resting);
  }
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', measure, { passive:true });
  window.addEventListener('load', measure, { once:true });
  document.querySelector('.hero-art').addEventListener('animationend', measure, { once:true });
  motion.addEventListener('change', () => {
    live();
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
  Promise.all(Object.values(characters).map(img => img.decode())).then(() => { ready=true; measure(); }).catch(() => { ready=false; measure(); });
  measure();
})();
