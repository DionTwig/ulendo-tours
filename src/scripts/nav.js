const nav = document.querySelector("[data-nav]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const progressBar = document.querySelector("[data-scroll-progress]");

if (nav || progressBar) {
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateNav() {
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
      const progress = scrollable > 0 ? Math.min(Math.max(currentScrollY / scrollable, 0), 1) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNav);
        ticking = true;
      }
    },
    { passive: true }
  );
}

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle("overflow-hidden", isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("overflow-hidden");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
      mobileMenu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("overflow-hidden");
      menuToggle.focus();
    }
  });
}
