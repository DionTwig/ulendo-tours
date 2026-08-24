# Ulendo Tours — Marketing Site

Single-page Astro + Tailwind CSS site for Ulendo Tours (ulendotours.co.za). Static output, no CMS, no backend. Every conversion path is an outbound link to WhatsApp, email, or social.

## Stack

- [Astro](https://astro.build) (static output)
- Tailwind CSS, configured via `tailwind.config.mjs` with the brand's design tokens
- `@fontsource-variable/instrument-sans` (self-hosted variable font, no Google Fonts CDN)
- Vanilla JS for scroll reveal, nav auto-hide, hero parallax, count-up stats, a scroll progress bar, subtle image drift, and the Nights slideshow — no GSAP/Framer Motion/Lenis

## Getting started

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## Before launch

- **`/public/images/package-cape-town.jpg` / `.webp` are low-resolution** (864×355px, the size of the source photo supplied). At 1240px+ wide on desktop the billboard card will visibly upscale and soften this image. It reads fine on mobile/tablet, but before launch it's worth sourcing a higher-resolution version of the same photo (2000px+ wide) and swapping the two files — nothing else needs to change.
- **Featured package price is still invented.** `R8 500 pp` on the Packages billboard was never a real Ulendo figure. A small "Placeholder pricing" caption is deliberately kept under the price on the live page (even though the approved design doesn't show one) so the site never states a fake price as a genuine offer. Before launch: either replace it with a confirmed real price, or remove the price block from the billboard entirely — and remove the caption once the price is real.
- **Viator URL is still pending** (`links.viator` in `src/config/links.ts` is `"#"`). The Nights section's "Book on Viator" button is conditionally rendered — it's simply absent from the page while the URL is a placeholder, and `Ask us on WhatsApp` takes over as that section's primary CTA. The moment a real URL lands in `links.ts`, the Viator button reappears automatically with no other code change needed.
- **Re-check spacing/imagery against the actual Figma file** (https://www.figma.com/design/BzfFY55SSQyxUzY2bTGzRu/Ulendo-Tours-Web-Design) where this build had to infer from a written brief rather than live Figma access (see "Source of truth" below) — most section body copy has since been replaced with client-approved text, but a few blurbs (Experience card bodies, How It Works step copy, package inclusions) are still placeholder voice-matched copy, not sourced from Figma.

## Source of truth

The initial build was done without live Figma access (MCP hit the Starter plan's rate limit; the exported PDF couldn't be rendered locally). Two rounds of client revisions since then have replaced most placeholder copy with the approved text and fixed several implementation bugs — see git history for the full trail. Copy not explicitly specified by the client (card blurbs, step descriptions, package inclusions) remains placeholder voice-matched text and should be reviewed against Figma when convenient.

## Live links

All outbound links are centralised in `src/config/links.ts`:

- WhatsApp: `+27 79 956 9295` (`wa.me/27799569295`), with a distinct pre-filled message per section.
- Email: `bookings@ulendotours.co.za`.
- Instagram: `instagram.com/ulendotours.co.za`.
- Facebook: page linked in `links.facebook`.
- Viator: pending (see "Before launch").

## Accessibility notes

- Orange (`#F15C22`) is used for eyebrow labels and headline accent words per the brand's signature device, even though it's contrast-marginal on white at small sizes. This is a deliberate brand-identity choice — worth a final contrast check with the client's design team if strict AA compliance is required, particularly the 13px eyebrow label and the Final CTA band's white-on-orange body text.
- All images have descriptive, scene-based alt text.
- The Nights slideshow keeps `aria-live="off"` during autoplay (so it doesn't spam screen readers every 5s) and switches to `aria-live="polite"` only when a visitor drives navigation directly (dot click or swipe). Dots are plain labelled buttons with `aria-current`, not an incomplete tablist/tab pattern.
- Nav has a visible orange focus ring (`:focus-visible`), and the mobile menu button swaps to a close (×) icon when open.
- Everything respects `prefers-reduced-motion: reduce` — reveals, hero animation, parallax, the scroll progress bar, image drift and the slideshow all disable transforms/timers.

## Favicon — deliberate deviation from the original brief

The brief said to generate the whole favicon set from `mark-green.svg`, including the `apple-touch-icon.png` on a `#0E574A` (dark green) background. Since `mark-green.svg`'s fill is itself dark green (#0c574a), that combination would be nearly invisible, so:

- `favicon.svg` / `favicon.ico` — generated from `mark-green.svg` (reads fine in a light browser tab).
- `apple-touch-icon.png` — generated from `mark-cream.svg` on a `#0E574A` background instead, for contrast.

## Not yet configured

- No analytics (client hasn't picked a provider yet).
- No CMS/backend — copy edits are direct file edits in `src/components/*.astro`.
