// Nav hide/show and the scroll progress bar now live in scroll-controller.js,
// which owns the page's single shared scroll listener. This file only handles
// the mobile menu's own (non-scroll) interactions.
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

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
