// Carousels : boutons, points, clavier (← →), swipe, accessibles
document.querySelectorAll('.carousel').forEach(carousel => {
  const track = carousel.querySelector('.carousel-track');
  const imgs = track.querySelectorAll('img');
  const prev = carousel.querySelector('.carousel-prev');
  const next = carousel.querySelector('.carousel-next');
  const dotsContainer = carousel.querySelector('.carousel-dots');
  let current = 0;

  carousel.setAttribute('role', 'region');
  carousel.setAttribute('aria-roledescription', 'carrousel');
  carousel.tabIndex = 0;
  prev.type = next.type = 'button';
  prev.setAttribute('aria-label', 'Image précédente');
  next.setAttribute('aria-label', 'Image suivante');

  const dots = [...imgs].map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Image ${i + 1} sur ${imgs.length}`);
    dot.addEventListener('click', () => go(i));
    dotsContainer.appendChild(dot);
    return dot;
  });

  function go(i) {
    current = (i + imgs.length) % imgs.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, n) => d.classList.toggle('active', n === current));
  }

  if (imgs.length < 2) {
    carousel.classList.add('single');
    prev.hidden = next.hidden = true;
  }

  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));

  carousel.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { go(current - 1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { go(current + 1); e.preventDefault(); }
  });

  // Swipe tactile / souris
  let startX = null;
  carousel.addEventListener('pointerdown', e => { startX = e.clientX; });
  carousel.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
  });
  carousel.addEventListener('pointercancel', () => { startX = null; });

  go(0);
});

// Lien actif dans la nav au scroll
const navObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll('.nav-links a').forEach(a => a.style.color = '');
    const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
    if (active) active.style.color = 'var(--steel)';
  });
}, { threshold: 0.4 });
document.querySelectorAll('section[id]').forEach(s => navObserver.observe(s));

// Apparition au défilement
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Profondeur : la souris (ordinateur) ou l'inclinaison (mobile) joue le soleil.
// Les éléments ne bougent pas : chacun projette une ombre calculée depuis sa
// propre position par rapport à la lumière. Plus un élément est gros / important,
// plus il est « haut » au-dessus du fond et plus son ombre s'écarte.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Hauteur au-dessus du fond (amplitude de l'ombre), par sélecteur
  const layers = {
    '.cover-logo': 18,
    '.hero-name': 16,
    '.section-title': 11,
    '.hero-title': 9,
    '.about-photo': 9,
    '.hero-manifesto': 7,
    '.hero-tag, .hero-sub, .hero-cta, .section-label': 5,
    '.marker, .exp-item, .skill-block, .portfolio-card, .creation-card, .contact-link, .distinction-feature, .distinction-item': 7,
    '.about-fill': 6,
  };
  const SPREAD = 2.5;          // px d'ombre par unité de hauteur
  const REST = -1.2;           // lumière au repos : au-dessus de la page

  const items = [];
  for (const [sel, h] of Object.entries(layers)) {
    document.querySelectorAll(sel).forEach(el => items.push({ el, h, cx: 0, cy: 0, hh: 0 }));
  }

  // Centre de chaque élément en coordonnées de document (hors défilement)
  function measure() {
    items.forEach(it => {
      const r = it.el.getBoundingClientRect();
      it.cx = r.left + r.width / 2 + scrollX;
      it.cy = r.top + r.height / 2 + scrollY;
      it.hh = r.height / 2;
    });
    schedule();
  }

  // Lumière, en coordonnées normalisées (-1..1 = bords de la fenêtre)
  let tx = 0, ty = REST;   // cible
  let x = 0, y = REST;     // valeur lissée
  let pending = false;

  function render() {
    pending = false;
    x += (tx - x) * 0.1;
    y += (ty - y) * 0.1;
    const lx = innerWidth / 2 * (1 + x);
    const ly = innerHeight / 2 * (1 + y);
    const reach = innerHeight * 0.6;
    items.forEach(it => {
      const cy = it.cy - scrollY;
      if (cy + it.hh < -200 || cy - it.hh > innerHeight + 200) return; // hors écran
      const dx = it.cx - scrollX - lx, dy = cy - ly;
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, len / reach) / len * it.h * SPREAD;
      it.el.style.setProperty('--sx', (dx * k).toFixed(1) + 'px');
      it.el.style.setProperty('--sy', (dy * k).toFixed(1) + 'px');
    });
    if (Math.abs(tx - x) > 0.002 || Math.abs(ty - y) > 0.002) schedule();
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(render); }
  }
  function light(nx, ny) {
    tx = Math.max(-1.5, Math.min(1.5, nx));
    ty = Math.max(-1.5, Math.min(1.5, ny));
    schedule();
  }

  // Souris : le curseur est le soleil
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    light((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2);
  }, { passive: true });
  document.addEventListener('mouseleave', () => light(0, REST));

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure);
  addEventListener('load', measure);
  if (document.fonts) document.fonts.ready.then(measure);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(document.body);

  // Mobile : l'inclinaison du téléphone déplace la lumière (calibrée sur la posture de départ)
  let base = null;
  function onTilt(e) {
    if (e.gamma === null || e.beta === null) return;
    if (!base) base = { g: e.gamma, b: e.beta };
    base.g += (e.gamma - base.g) * 0.01;
    base.b += (e.beta - base.b) * 0.01;
    light((e.gamma - base.g) / 18, (e.beta - base.b) / 18 - 0.8);
  }
  function listenTilt() { addEventListener('deviceorientation', onTilt, { passive: true }); }

  if (matchMedia('(hover: none)').matches && 'DeviceOrientationEvent' in window) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS : l'autorisation doit être demandée lors d'un geste de l'utilisateur
      addEventListener('touchend', () => {
        DeviceOrientationEvent.requestPermission()
          .then(s => { if (s === 'granted') listenTilt(); })
          .catch(() => {});
      }, { once: true });
    } else {
      listenTilt();
    }
  }

  measure();
})();
