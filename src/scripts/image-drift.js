const driftEls = document.querySelectorAll("[data-drift]");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (driftEls.length && !prefersReducedMotion && window.innerWidth >= 768) {
  const thresholds = Array.from({ length: 51 }, (_, i) => i / 50);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const rect = entry.boundingClientRect;
        const viewportHeight = window.innerHeight;
        const total = viewportHeight + rect.height;
        const traveled = viewportHeight - rect.top;
        const progress = Math.min(Math.max(traveled / total, 0), 1);
        const offset = (progress - 0.5) * 40; // -20px to +20px
        entry.target.style.transform = `translateY(${offset}px) scale(1.08)`;
      });
    },
    { threshold: thresholds }
  );

  driftEls.forEach((el) => observer.observe(el));
}
