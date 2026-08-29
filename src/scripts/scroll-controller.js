/**
 * Single shared scroll handler for the whole page. Everything that used to be
 * its own `addEventListener('scroll', ...)` (nav hide/show, the progress bar,
 * hero parallax) lives here now, alongside the new scroll-driven work (reveal
 * fallback, Experiences horizontal pin) — one rAF tick drives all of it so
 * nothing fights over the frame budget.
 */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const supportsScrollTimeline = CSS.supports("animation-timeline: view()");

const nav = document.querySelector("[data-nav]");
const progressBar = document.querySelector("[data-scroll-progress]");
const heroParallaxLayer = document.querySelector("[data-hero-parallax]");
const hero = document.getElementById("hero");
const experiencesFrame = document.querySelector("[data-experiences-pin]");
const experiencesTrack = document.querySelector("[data-experiences-track]");
const experiencesProgressFill = document.querySelector("[data-experiences-progress-fill]");

let heroInView = true;
if (hero) {
  new IntersectionObserver(
    (entries) => entries.forEach((entry) => (heroInView = entry.isIntersecting)),
    { threshold: 0 }
  ).observe(hero);
}

// ---- Reveal fallback (only runs when the browser lacks animation-timeline: view()) ----
const revealEls = prefersReducedMotion || supportsScrollTimeline ? [] : Array.from(document.querySelectorAll("[data-reveal]"));
const activeReveals = new Set();

if (revealEls.length) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeReveals.add(entry.target);
        } else {
          activeReveals.delete(entry.target);
        }
      });
    },
    { rootMargin: "50% 0px 50% 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

function applyRevealProgress(el, progress) {
  const from = el.getAttribute("data-reveal-from") || "up";
  let tx = 0;
  let ty = 0;
  let scale = 1;
  if (from === "left") tx = -40 * (1 - progress);
  else if (from === "right") tx = 40 * (1 - progress);
  else if (from === "scale") scale = 0.94 + 0.06 * progress;
  else ty = 28 * (1 - progress);

  el.style.opacity = String(progress);
  el.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateReveals() {
  if (!activeReveals.size) return;
  const viewportHeight = window.innerHeight;
  activeReveals.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const progress = clamp((viewportHeight * 0.95 - rect.top) / (viewportHeight * 0.55), 0, 1);
    applyRevealProgress(el, progress);
  });
}

// ---- Experiences horizontal pin ----
function updateExperiences() {
  if (!experiencesFrame || !experiencesTrack || prefersReducedMotion || window.innerWidth < 768) return;
  const rect = experiencesFrame.getBoundingClientRect();
  const dwell = rect.height - window.innerHeight;
  const progress = dwell > 0 ? clamp(-rect.top / dwell, 0, 1) : 0;
  // The track sizes itself to its content (width: max-content), so its own
  // clientWidth always equals its scrollWidth — measure against the scroller
  // (the clipping parent) instead, which is what's actually visible.
  const maxScroll = experiencesTrack.scrollWidth - experiencesTrack.parentElement.clientWidth;
  experiencesTrack.style.transform = `translate3d(${-progress * maxScroll}px, 0, 0)`;
  if (experiencesProgressFill) {
    experiencesProgressFill.style.transform = `scaleX(${Math.max(progress, 0.02)})`;
  }
}

// ---- Hero parallax ----
function updateHeroParallax() {
  if (!heroParallaxLayer || prefersReducedMotion) return;
  if (window.innerWidth >= 768 && heroInView) {
    const heroHeight = hero.offsetHeight;
    const maxShift = heroHeight * 0.1;
    const progress = clamp(window.scrollY / heroHeight, 0, 1);
    heroParallaxLayer.style.transform = `translateY(${-progress * maxShift}px)`;
  } else {
    heroParallaxLayer.style.transform = "translateY(0)";
  }
}

// ---- Nav hide/show + scroll progress bar ----
let lastScrollY = window.scrollY;
function updateNavAndProgress() {
  const currentScrollY = window.scrollY;

  if (nav) {
    if (currentScrollY < 80) {
      nav.classList.remove("nav-hidden");
    } else if (currentScrollY > lastScrollY) {
      nav.classList.add("nav-hidden");
    } else {
      nav.classList.remove("nav-hidden");
    }
  }

  if (progressBar) {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? clamp(currentScrollY / scrollable, 0, 1) : 0;
    progressBar.style.transform = `scaleX(${progress})`;
  }

  lastScrollY = currentScrollY;
}

let ticking = false;
function onScrollTick() {
  // Reads first, then writes, so nothing here forces a layout mid-loop.
  updateNavAndProgress();
  updateHeroParallax();
  updateReveals();
  updateExperiences();
  ticking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      window.requestAnimationFrame(onScrollTick);
      ticking = true;
    }
  },
  { passive: true }
);

// Run once on load so the first paint (nav state, parallax, any already-visible
// reveals) is correct before the user scrolls at all.
onScrollTick();

// ---- Keyboard access into the Experiences horizontal pin ----
// Desktop only: the track's horizontal position is driven by page scroll, not
// its own scrollbar, so a card that's off to the right won't naturally scroll
// into view just because it received focus. Below 768px this is a plain
// native scroller, where the browser already does the right thing on focus.
if (experiencesTrack && experiencesFrame) {
  Array.from(experiencesTrack.children).forEach((card) => {
    card.addEventListener("focus", () => {
      if (window.innerWidth < 768) return;
      const maxScroll = experiencesTrack.scrollWidth - experiencesTrack.parentElement.clientWidth;
      if (maxScroll <= 0) return;

      const margin = 24;
      const targetTranslate = clamp(card.offsetLeft - margin, 0, maxScroll);
      const progress = targetTranslate / maxScroll;
      const dwell = experiencesFrame.offsetHeight - window.innerHeight;
      if (dwell <= 0) return;
      const frameTopDoc = experiencesFrame.getBoundingClientRect().top + window.scrollY;
      const targetScrollY = frameTopDoc + progress * dwell;

      window.scrollTo({ top: targetScrollY, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });
}
