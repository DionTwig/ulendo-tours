const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const groups = new Map();
  items.forEach((el) => {
    const group = el.getAttribute("data-reveal-group") || el;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(el);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const group = el.getAttribute("data-reveal-group");
        let delay = 0;
        if (group) {
          const siblings = groups.get(group);
          const index = Math.min(siblings.indexOf(el), 6);
          delay = index * 80;
        }
        window.setTimeout(() => el.classList.add("is-visible"), delay);
        observer.unobserve(el);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initReveal);
} else {
  initReveal();
}
