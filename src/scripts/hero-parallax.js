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

  function updateParallax() {
    if (window.innerWidth >= 768 && heroInView) {
      const offset = window.scrollY * 0.3;
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
