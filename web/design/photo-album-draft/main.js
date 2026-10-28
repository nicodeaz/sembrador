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
  const album = document.querySelector('.photo-track');
  const photoLinks = [...album.querySelectorAll('[data-photo]')];
  const albumControls = document.querySelector('.album-controls');
  const albumFooter = document.querySelector('.album-footer');
  const albumPrevious = albumControls.querySelector('.photo-previous');
  const albumNext = albumControls.querySelector('.photo-next');
  const albumPosition = albumControls.querySelector('.album-position');
  const photoNumber = number => String(number).padStart(2, '0');
  let albumFrame = 0;
  function albumIndex() {
    const target = album.getBoundingClientRect().left + parseFloat(getComputedStyle(album).paddingLeft);
    return photoLinks.reduce((best, link, i) => Math.abs(link.parentElement.getBoundingClientRect().left - target) < Math.abs(photoLinks[best].parentElement.getBoundingClientRect().left - target) ? i : best, 0);
  }
  function updateAlbum() {
    albumFrame = 0;
    const index = albumIndex();
    albumPrevious.disabled = album.scrollLeft < 2;
    albumNext.disabled = album.scrollWidth - album.clientWidth - album.scrollLeft < 2;
    const bounds = album.getBoundingClientRect();
    const visible = photoLinks.map((link, i) => ({ i, rect: link.parentElement.getBoundingClientRect() })).filter(({ rect }) => rect.left < bounds.right - rect.width * .4 && rect.right > bounds.left + rect.width * .4);
    const first = (visible[0]?.i ?? index) + 1;
    const last = (visible.at(-1)?.i ?? index) + 1;
    const position = `${photoNumber(first)}${last > first ? `–${photoNumber(last)}` : ''} / ${photoNumber(photoLinks.length)}`;
    if (albumPosition.textContent !== position) albumPosition.textContent = position;
  }
  function stepAlbum(direction) {
    const index = Math.max(0, Math.min(photoLinks.length - 1, albumIndex() + direction));
    const card = photoLinks[index].parentElement;
    const left = album.scrollLeft + card.getBoundingClientRect().left - album.getBoundingClientRect().left - parseFloat(getComputedStyle(album).paddingLeft);
    album.scrollTo({ left, behavior: motion.matches ? 'auto' : 'smooth' });
  }
  albumControls.hidden = false;
  albumPrevious.addEventListener('click', () => stepAlbum(-1));
  albumNext.addEventListener('click', () => stepAlbum(1));
  album.addEventListener('scroll', () => { if (!albumFrame) albumFrame = requestAnimationFrame(updateAlbum); }, { passive: true });
  album.addEventListener('keydown', event => {
    if (event.target === album && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      stepAlbum(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  window.addEventListener('resize', updateAlbum, { passive: true });
  updateAlbum();
  const viewer = document.querySelector('.photo-viewer');
  const viewerImage = viewer.querySelector('.viewer-image');
  const viewerPrevious = viewer.querySelector('.viewer-previous');
  const viewerNext = viewer.querySelector('.viewer-next');
  let selectedPhoto = 0;
  function showPhoto(index) {
    selectedPhoto = Math.max(0, Math.min(photoLinks.length - 1, index));
    const link = photoLinks[selectedPhoto];
    viewerImage.src = link.href;
    viewerImage.alt = link.querySelector('img').alt;
    const caption = link.parentElement.querySelector('figcaption>div');
    viewer.querySelector('.viewer-caption').textContent = `${caption.firstChild.textContent.trim()} · ${caption.querySelector('small').textContent}`;
    viewer.querySelector('.viewer-position').textContent = `${photoNumber(selectedPhoto + 1)} / ${photoNumber(photoLinks.length)}`;
    viewerPrevious.disabled = selectedPhoto === 0;
    viewerNext.disabled = selectedPhoto === photoLinks.length - 1;
  }
  if (typeof viewer.showModal === 'function') {
    photoLinks.forEach((link, index) => link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      showPhoto(index);
      viewer.showModal();
      document.body.classList.add('photo-open');
    }));
    viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
    viewerPrevious.addEventListener('click', () => showPhoto(selectedPhoto - 1));
    viewerNext.addEventListener('click', () => showPhoto(selectedPhoto + 1));
    viewer.addEventListener('keydown', event => {
      if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        showPhoto(selectedPhoto + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    viewer.addEventListener('click', event => {
      const rect = viewer.getBoundingClientRect();
      if (event.target === viewer && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) viewer.close();
    });
    viewer.addEventListener('close', () => document.body.classList.remove('photo-open'));
  }
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
    const albumFooterRect = albumFooter.getBoundingClientRect();
    const albumControlsVisible = albumFooterRect.top < size.height && albumFooterRect.bottom > 0;
    whatsapp.classList.toggle('is-visible', scroll > 500 && !albumControlsVisible && !(contactRect.top < size.height * .65 && contactRect.bottom > size.height * .2));
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
    const blend = a.state === 'hatch' ? ease((raw-.5)/.35) : ease((raw-.62)/.3);
    const wobble = a.state === 'egg' && raw > .5 && raw < .9 ? Math.sin(raw * 65) * 3 * Math.sin(blend * Math.PI) : 0;
    paint(characters[a.state], a.state===b.state?1:1-blend, `scale(${scale}) rotate(${rotate+wobble}deg)`);
    if (a.state !== b.state) paint(characters[b.state], blend, `translateY(${(1-blend)*3}%) scale(${scale}) rotate(${rotate}deg)`);
  }
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', measure, { passive:true });
  window.addEventListener('load', measure, { once:true });
  document.querySelector('.hero-art').addEventListener('animationend', measure, { once:true });
  motion.addEventListener('change', () => {
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
