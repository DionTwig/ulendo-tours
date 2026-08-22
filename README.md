# Ulendo Tours — Marketing Site

Single-page Astro + Tailwind CSS site for Ulendo Tours (ulendotours.co.za). Static output, no CMS, no backend. Every conversion path is an outbound link to WhatsApp or Viator.

## Stack

- [Astro](https://astro.build) (static output)
- Tailwind CSS, configured via `tailwind.config.mjs` with the brand's design tokens
- `@fontsource-variable/instrument-sans` (self-hosted variable font, no Google Fonts CDN)
- Vanilla JS for scroll reveal, nav auto-hide, hero parallax, count-up stats and the Nights slideshow — no GSAP/Framer Motion/Lenis

## Getting started

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## Source of truth

This build was done **without live Figma access** — the MCP connection hit the Starter plan's tool-call rate limit before it could pull node data, and the exported PDF (`Ulendo Tours — Web Design.pdf`) couldn't be rendered locally (no `poppler`/PDF-to-image tooling on this machine). Everything here was built from the written brief, which the brief itself designates as the fallback. **Before launch, re-check every section against the actual Figma file** (https://www.figma.com/design/BzfFY55SSQyxUzY2bTGzRu/Ulendo-Tours-Web-Design) for exact spacing, imagery choices and any copy not explicitly given in the brief.

## Placeholder content — replace before launch

The brief flags these explicitly:

- **WhatsApp number** (`src/config/links.ts` → `links.whatsapp.base`) — currently `https://wa.me/27XXXXXXXXX`.
- **Viator URL** (`src/config/links.ts` → `links.viator`) — currently `#`.
- **Instagram URL** (`src/config/links.ts` → `links.instagram`) — currently `#`.
- **Featured package price** (Packages section) — R8 500 pp for the Cape Town Long Weekend is an invented placeholder, labelled as such on the page.
- **Email address** (`links.email`) — `hello@ulendotours.co.za` needs confirming before launch.

All stubbed links render as normal buttons/links but point at `#` and carry `data-pending="true"` so they're easy to grep for later.

### Additional placeholders introduced during this build (not covered by the brief)

Because the brief only specifies exact copy for headlines and a handful of bullets, the following body copy, card blurbs, step descriptions and package inclusions were **written to match the brand voice**, not sourced from Figma. Flag these for the client to review/replace with final copy once Figma access is restored:

- Hero eyebrow, subhead and trust line
- About intro paragraphs and the 3 value-card titles/bodies
- Flights and Stays bullet lists (beyond the two bullets given verbatim in the brief) and their body copy
- All 5 Experience card blurbs
- Nights intro copy and bullets 1–2 (bullet 3 is the brief's exact fixed text)
- How It Works step copy
- Final CTA copy
- Footer column labels and blurb
- Package inclusions list

## Copy fixes applied (per brief)

1. Stays bullet 3: fixed missing apostrophes → "Vetted – we don't send you anywhere we wouldn't stay."
2. Nights bullet 3: full un-truncated text "Optional pre-brunch in Rosebank or Greenside, and pickup" — wraps on mobile instead of clipping (`max-w-[26rem]`, no `truncate`).
3. Footer tagline set to the correct "Crafting Unforgettable Experiences" (the PDF export dropped the leading "C" — confirm this is just an export artifact and not an error in the actual Figma text layer).
4. Stays bullet 2 standardised to an en dash with spaces ("Vetted – we don't...").

## Discount figures used

- Trust card stat: "Up to 45%"
- Flights H2: "Get there for less. **up to 45% off flights.**"
- Stays bullet: "Up to 40% off listed accommodation rates"

## Favicon — deliberate deviation from the brief

The brief says to generate the whole favicon set from `mark-green.svg`, including the `apple-touch-icon.png` on a `#0E574A` (dark green) background. Since `mark-green.svg`'s fill is itself a dark green (#0c574a), placing it on a `#0E574A` background would be nearly invisible. The asset manifest separately describes `mark-cream.svg` as "for dark backgrounds," so:

- `favicon.svg` / `favicon.ico` — generated from `mark-green.svg` (green mark, transparent background — reads fine in a light browser tab).
- `apple-touch-icon.png` — generated from `mark-cream.svg` on a `#0E574A` background instead, for contrast.

Flag this to the client so Figma/brand guidelines can confirm the intended combination.

## Accessibility notes

- Orange (`#F15C22`) is used for eyebrow labels and headline accent words per the brand's signature device, even though it's contrast-marginal on white at small sizes (as the brief itself flags). This is a deliberate brand-identity choice, not an oversight — worth a final contrast check with the client's design team before launch, particularly the 13px eyebrow label.
- The Final CTA band reverses this (white text on solid orange). The heading passes WCAG AA for large text (~3.3:1, needs 3:1); the body paragraph beneath it sits just under the 4.5:1 normal-text threshold even at full white. Flagged here rather than redesigned, since a solid-orange CTA band is an explicit, brand-driven layout choice — worth a look from the client's design team if strict AA compliance is required.
- All images have descriptive alt text (scene-based, not filename-based).
- Nights slideshow uses `aria-live="polite"`, labelled dot controls (`role="tab"`), and is fully keyboard/touch operable.
- Nav has a visible orange focus ring (`:focus-visible`).
- Everything respects `prefers-reduced-motion: reduce` — reveals, hero animation, parallax and the slideshow all disable transforms/timers.

## Not yet configured

- No analytics (per brief — client hasn't picked a provider yet).
- No CMS/backend — copy edits are direct file edits in `src/components/*.astro`.
