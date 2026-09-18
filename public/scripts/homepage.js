// Multi-slide hero carousel with auto-cycle, manual controls, and hover pause
const carousel = document.getElementById('hero-carousel');
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.slide-dot');
const prevBtn = document.getElementById('prev-slide');
const nextBtn = document.getElementById('next-slide');
const progressBar = document.getElementById('progress-bar');

const totalSlides = slides.length;
const SLIDE_DURATION = 10000; // 10 seconds per slide

let currentSlide = 0;
let isPaused = false;
let autoplayInterval = null;
let progressStart = 0;

// Go to specific slide
function goToSlide(index) {
  if (index === currentSlide) return;

  // Update z-index and opacity for smooth transition
  slides.forEach((slide, i) => {
    const el = slide;
    if (i === index) {
      el.classList.remove('opacity-0', 'z-0');
      el.classList.add('opacity-100', 'z-10');
    } else if (i === currentSlide) {
      el.classList.remove('opacity-100', 'z-10');
      el.classList.add('opacity-0', 'z-0');
    }
  });

  // Update dots
  dots.forEach((dot, i) => {
    dot.setAttribute('aria-selected', i === index ? 'true' : 'false');
  });

  currentSlide = index;
  resetProgress();
}

// Next slide
function nextSlide() {
  goToSlide((currentSlide + 1) % totalSlides);
}

// Previous slide
function prevSlide() {
  goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
}

// Reset and start progress bar
function resetProgress() {
  if (progressBar) {
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';

    // Force reflow
    progressBar.offsetHeight;

    if (!isPaused) {
      progressBar.style.transition = `width ${SLIDE_DURATION}ms linear`;
      progressBar.style.width = '100%';
    }
  }
  progressStart = Date.now();
}

// Start autoplay
function startAutoplay() {
  stopAutoplay();
  autoplayInterval = setInterval(() => {
    if (!isPaused) {
      nextSlide();
    }
  }, SLIDE_DURATION);
  resetProgress();
}

// Stop autoplay
function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
}

// Pause on hover
function pauseCarousel() {
  isPaused = true;
  if (progressBar) {
    const elapsed = Date.now() - progressStart;
    const progress = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
    progressBar.style.transition = 'none';
    progressBar.style.width = `${progress}%`;
  }
}

// Resume on mouse leave
function resumeCarousel() {
  isPaused = false;
  if (progressBar) {
    const elapsed = Date.now() - progressStart;
    const remaining = SLIDE_DURATION - elapsed;
    if (remaining > 0) {
      progressBar.style.transition = `width ${remaining}ms linear`;
      progressBar.style.width = '100%';
    }
  }
}

// Initialize
if (totalSlides > 1) {
  // Event listeners for arrows
  prevBtn?.addEventListener('click', () => {
    prevSlide();
    startAutoplay(); // Reset timer on manual navigation
  });

  nextBtn?.addEventListener('click', () => {
    nextSlide();
    startAutoplay();
  });

  // Event listeners for dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      startAutoplay();
    });
  });

  // Hover pause
  carousel?.addEventListener('mouseenter', pauseCarousel);
  carousel?.addEventListener('mouseleave', resumeCarousel);

  // Touch pause (for mobile)
  carousel?.addEventListener('touchstart', pauseCarousel, { passive: true });
  carousel?.addEventListener('touchend', resumeCarousel);

  // Keyboard navigation
  carousel?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
      startAutoplay();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
      startAutoplay();
    }
  });

  // Start autoplay
  startAutoplay();
}
