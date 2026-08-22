const root = document.querySelector("[data-slideshow]");

if (root) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const slides = Array.from(root.querySelectorAll("[data-slide]"));
  const dots = Array.from(root.querySelectorAll("[data-dot]"));
  const INTERVAL = 5000;

  if (prefersReducedMotion || slides.length <= 1) {
    // Static: first slide only, no timers.
  } else {
    let current = 0;
    let timer = null;
    let inViewport = true;
    let paused = false;

    function goTo(index) {
      slides[current].setAttribute("data-active", "false");
      dots[current]?.setAttribute("aria-current", "false");
      current = (index + slides.length) % slides.length;
      slides[current].setAttribute("data-active", "true");
      dots[current]?.setAttribute("aria-current", "true");
    }

    let announceTimer = null;

    // Only announce slide changes when the user drives navigation directly
    // (dot click, swipe) — autoplay stays silent so it doesn't spam screen readers.
    function goToManual(index) {
      root.setAttribute("aria-live", "polite");
      goTo(index);
      window.clearTimeout(announceTimer);
      announceTimer = window.setTimeout(() => {
        root.setAttribute("aria-live", "off");
      }, 1000);
    }

    function next() {
      goTo(current + 1);
    }

    function start() {
      stop();
      if (!paused && inViewport) {
        timer = window.setInterval(next, INTERVAL);
      }
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        goToManual(index);
        start();
      });
    });

    root.addEventListener("mouseenter", () => {
      paused = true;
      stop();
    });
    root.addEventListener("mouseleave", () => {
      paused = false;
      start();
    });
    root.addEventListener("focusin", () => {
      paused = true;
      stop();
    });
    root.addEventListener("focusout", () => {
      paused = false;
      start();
    });

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inViewport = entry.isIntersecting;
          if (inViewport) {
            start();
          } else {
            stop();
          }
        });
      },
      { threshold: 0.1 }
    );
    visibilityObserver.observe(root);

    // Touch swipe.
    let touchStartX = 0;
    root.addEventListener(
      "touchstart",
      (event) => {
        touchStartX = event.touches[0].clientX;
      },
      { passive: true }
    );
    root.addEventListener(
      "touchend",
      (event) => {
        const deltaX = event.changedTouches[0].clientX - touchStartX;
        if (Math.abs(deltaX) > 40) {
          deltaX < 0 ? goToManual(current + 1) : goToManual(current - 1);
          start();
        }
      },
      { passive: true }
    );

    start();
  }
}
