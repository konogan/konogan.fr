function moveCarousel(btn, dir) {
  const carousel = btn.closest('.carousel');
  const track = carousel.querySelector('.carousel-track');
  const imgs = track.querySelectorAll('img');
  const dots = carousel.querySelectorAll('.carousel-dots span');
  let current = parseInt(carousel.dataset.current || 0);

  current = (current + dir + imgs.length) % imgs.length;
  carousel.dataset.current = current;
  track.style.transform = `translateX(-${current * 100}%)`;

  dots.forEach((d, i) => d.classList.toggle('active', i === current));
}

// Init dots pour chaque carousel
document.querySelectorAll('.carousel').forEach(carousel => {
  const imgs = carousel.querySelectorAll('img');
  const dotsContainer = carousel.querySelector('.carousel-dots');
  imgs.forEach((_, i) => {
    const dot = document.createElement('span');
    if (i === 0) dot.classList.add('active');
    dotsContainer.appendChild(dot);
  });
  carousel.dataset.current = 0;
});