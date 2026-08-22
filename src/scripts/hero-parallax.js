const hero = document.getElementById("hero");
const parallaxLayer = document.querySelector("[data-hero-parallax]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (hero && parallaxLayer && !prefersReducedMotion) {
  let ticking = false;
  let heroInView = true;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        heroInView = entry.isIntersecting;
      });
    },
    { threshold: 0 }
  );
  observer.observe(hero);

  // The layer overhangs the hero by 10% top and bottom (top: -10%, height: 120%).
  // Clamp the shift to that overhang so the image never exposes the section background.
  function updateParallax() {
    if (window.innerWidth >= 768 && heroInView) {
      const heroHeight = hero.offsetHeight;
      const maxShift = heroHeight * 0.1;
      const progress = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
      const offset = -progress * maxShift;
      parallaxLayer.style.transform = `translateY(${offset}px)`;
    } else {
      parallaxLayer.style.transform = "translateY(0)";
    }
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    },
    { passive: true }
  );
}
