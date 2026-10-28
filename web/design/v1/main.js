/* Progressive enhancement: the entire page and all contact links work without JS. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wideScreen = window.matchMedia('(min-width: 900px)');
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  const closeMenu = (restoreFocus = false) => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
    mobileNav.hidden = true;
    document.body.classList.remove('menu-open');
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Cerrar menú' : 'Abrir menú');
    mobileNav.hidden = !opening;
    document.body.classList.toggle('menu-open', opening);
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!mobileNav.hidden && !header.contains(event.target)) closeMenu();
  });
  document.querySelector('#year').textContent = String(new Date().getFullYear());

  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  let revealObserver;
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    document.documentElement.classList.add('reveal-ready');
    revealItems.forEach(item => revealObserver.observe(item));
  }

  const scene = document.querySelector('.floating-scene');
  const maize = document.querySelector('.maize-object');
  const heroImage = document.querySelector('.hero-photo');
  const mobileMaize = document.querySelector('.mobile-maize');
  const whatsapp = document.querySelector('.floating-whatsapp');
  const sections = ['inicio', 'servicios', 'nosotros', 'contacto'].map(id => document.getElementById(id));
  let frames = [];
  let animationFrame = 0;
  let viewportHeight = window.innerHeight;
  let viewportWidth = window.innerWidth;
  let cornSize = 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const measure = () => {
    viewportHeight = window.innerHeight;
    viewportWidth = document.documentElement.clientWidth;
    cornSize = maize.offsetWidth;
    const offsets = sections.map(section => ({ top: section.offsetTop, height: section.offsetHeight }));
    const serviceScroll = offsets[1].top - viewportHeight * .12;
    const serviceCopyBottom = document.querySelector('.services-intro > p:not(.eyebrow)').getBoundingClientRect().bottom + window.scrollY;
    const serviceCornY = (serviceCopyBottom - serviceScroll + cornSize * .48 + 26) / viewportHeight;
    frames = [
      { scroll: 0, x: .57, y: Math.min(.81, (offsets[0].top + offsets[0].height * .69) / viewportHeight), rotate: -20, tilt: -15, scale: 1 },
      { scroll: serviceScroll, x: .245, y: serviceCornY, rotate: 23, tilt: 18, scale: .72 },
      { scroll: offsets[2].top - viewportHeight * .12, x: .435, y: .66, rotate: -34, tilt: -20, scale: .73 },
      { scroll: offsets[3].top - viewportHeight * .13, x: .825, y: .58, rotate: 17, tilt: 20, scale: .91 },
      { scroll: offsets[3].top + offsets[3].height, x: .86, y: -.3, rotate: 32, tilt: 5, scale: .65 }
    ];
    if (viewportWidth > 700 && !mobileNav.hidden) closeMenu();
    requestRender();
  };
  const render = () => {
    animationFrame = 0;
    const scroll = Math.max(0, window.scrollY);
    const contactRect = sections[3].getBoundingClientRect();
    whatsapp.classList.toggle('is-visible', scroll > 420 && !(contactRect.top < viewportHeight * .55 && contactRect.bottom > viewportHeight * .4));
    if (reducedMotion.matches) {
      scene.classList.remove('is-ready');
      heroImage.style.transform = '';
      mobileMaize.style.transform = '';
      return;
    }
    if (scroll < sections[0].offsetHeight + 150) {
      heroImage.style.transform = `translate3d(0,${Math.min(scroll * .075, 65)}px,0) scale(1.14)`;
      if (!wideScreen.matches) mobileMaize.style.transform = `rotate(${clamp(scroll * .025, 0, 16)}deg) translateY(${-Math.min(scroll * .035, 18)}px)`;
    }
    if (!wideScreen.matches || !frames.length) {
      scene.classList.remove('is-ready');
      return;
    }
    let i = 0;
    while (i < frames.length - 2 && scroll > frames[i + 1].scroll) i++;
    const a = frames[i], b = frames[i + 1];
    const raw = clamp((scroll - a.scroll) / Math.max(1, b.scroll - a.scroll), 0, 1);
    const t = raw * raw * (3 - 2 * raw);
    const x = lerp(a.x, b.x, t) * viewportWidth - cornSize / 2;
    const y = lerp(a.y, b.y, t) * viewportHeight - cornSize / 2;
    maize.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotateZ(${lerp(a.rotate,b.rotate,t).toFixed(2)}deg) rotateY(${lerp(a.tilt,b.tilt,t).toFixed(2)}deg) rotateX(${(Math.sin(raw * Math.PI) * 9).toFixed(2)}deg) scale(${lerp(a.scale,b.scale,t).toFixed(3)})`;
    scene.classList.add('is-ready');
  };
  function requestRender() { if (!animationFrame) animationFrame = requestAnimationFrame(render); }
  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('load', measure, { once: true });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      revealObserver?.disconnect();
      revealItems.forEach(item => item.classList.add('is-revealed'));
      document.documentElement.classList.remove('reveal-ready');
    }
    measure();
  });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
  document.fonts?.ready.then(measure);
  measure();
})();
