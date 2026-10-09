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
