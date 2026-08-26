/**
 * Swaps the hero's still image for a looping video, but only when it's cheap
 * to do so. Runs immediately (this script is loaded right after the hero
 * markup, before the rest of the page), so the swap happens before the
 * poster's entrance animation has painted a visible frame — no flash, because
 * the poster IS the same image already in the DOM.
 */
(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return; // Reduced motion: never even request the video.

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    if (connection.saveData) return;
    if (connection.effectiveType === "2g" || connection.effectiveType === "3g") return;
  }

  const mediaLayer = document.querySelector("[data-hero-parallax]");
  const picture = mediaLayer ? mediaLayer.querySelector("picture") : null;
  if (!mediaLayer || !picture) return;

  const video = document.createElement("video");
  video.className = picture.querySelector("img").className;
  video.autoplay = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("poster", "/images/hero.jpg");

  const sourceWebm = document.createElement("source");
  sourceWebm.src = "/images/hero.webm";
  sourceWebm.type = "video/webm";
  video.appendChild(sourceWebm);

  const sourceMp4 = document.createElement("source");
  sourceMp4.src = "/images/hero.mp4";
  sourceMp4.type = "video/mp4";
  video.appendChild(sourceMp4);

  mediaLayer.replaceChild(video, picture);
})();
