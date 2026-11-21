# Type / light — Jewelry prototype

Scope: docs/proto/type-light/ only. No production HTML, garden engine, CSS, collection, menu or Story files changed. No new image or illustration assets.

## Decision log
- Keep the current garden shaders, displaced mesh, field, textures, light uniforms, random strokes and decay. The standalone garden.js copies the current garden function; changes are relative asset URLs and a CSS lamp bridge only.
- Export the smoothed userBrush.light in viewport pixels as root --lx/--ly. Touch/coarse pointer and reduced motion export a fixed 16% / 18% upper-left position. DOM shadows read only these properties, never raw pointer events.
- Title vector = center minus lamp. Length = min(6, distance * .018). Product silhouette shadows use the same vector with an 18px cap, a static 7px blur and transform-only movement. Measurements are cached on resize/scroll/font-ready, not read per frame.
- Existing transparent product atlas; no marble slab. Vignette maximum alpha 56/255 = 21.96%. No product highlight strip. A 9px lift is the only product motion.
- Hover/focus isolates a piece; other pieces and heading/copy reach brightness(.4) in 300ms. Click/Enter/Space pins selection; click again or Escape clears it. No simulated buy button or flip side.
- Malayalam uses only മലർ in Manjari. Latin names remain readable in front. Full product names are in accessible labels; visible catalogue labels are compact.
- Five size tokens: small / body / name / title / outline. One entrance keyframe, arrive: 800ms, cubic-bezier(.2,.65,.3,1), opacity + 12px rise. Reduced motion disables entrance/lift/transitions and keeps shadow positions still during scrolling.

## Grid rules
- >1450px: 12 columns; first piece columns 1–6 across both rows; ring columns 8–12, row 1; necklace columns 9–12, row 2. Gap clamp(12px, 1.8vw, 38px). Content max width 2240px including padding.
- 1001–1450px: same, necklace expands to columns 8–12 to preserve one-line metadata.
- 601–1000px: large piece spans two columns above two smaller pieces; material takes a second metadata line at this intermediate breakpoint.
- <=600px: one column; first piece 100%, other pieces 92%, alternating right/left alignment. Metadata remains on one row at 375px. This narrow version scrolls vertically rather than shrinking all three products into one phone screen.
- This preview includes Jewelry 01–03 only. Future Objects group continues 04–06 with the same system after approval.

## Verification
- JavaScript syntax checks passed for garden.js and type-light.js.
- In-app browser, desktop host: 1280×720, document scrollWidth 1280; all three caption widths fit; page height 720.
- 375×812, document scrollWidth 375; all three prices/labels fit; caption child bounds show no overlap. Vertical scrolling expected.
- 2560×1440, document scrollWidth 2560; grid x=280..2280; all three captions fit; page height 1440.
- Canvas ready, Manjari loaded, no captured console errors/warnings in local preview.
- Keyboard Tab to ring, Enter selects; aria-pressed=true; nonselected product computed filters brightness(0.4); selected product filter none; heading brightness(0.4). Escape clears selection.
- Debug rAF sampling on this desktop: around 120fps; p95 9.2–9.3ms in sampled windows at 1280 and 2560. This is frame scheduling, NOT GPU timing or an Android performance claim.

## BLOCKERS
- Mid-range Android hardware is unavailable: 60fps on that device has NOT been established. Touch and real reduced-motion OS preferences were not exercised on physical hardware. Those code paths are implemented, not certified.
- This request explicitly keeps the WebGL background unchanged. No claim of universal performance can be made while its existing mesh/texture workload is retained.
- Original low-resolution atlas and baked photographic highlights remain; product images are NOT relit in the WebGL pass in this CSS-only study. No new normal maps or image assets were made.
- Manjari loads from Google Fonts; an offline copy is not bundled. Fallback glyph metrics may differ if that font request fails.
- No 15-second recording delivered in this iteration; viewport screenshots and live debug diagnostics provide the current evidence.
- Storefront integration, Objects 04–06, Story quote replacement, Account removal and dead-button cleanup are deferred to approval; the one-screen preview contains no coming-soon controls. Story stone remains untouched and is reserved as the only pale panel in the eventual full-page version.

## CUT LOG
- Removed stone slab, marble background, lower stone lip and fixed card box-shadow from this prototype.
- Removed flip state, card back and Available soon action.
- Removed sheen sweep / extra image effects; kept only selection lift and directional cast shadow.
- Omitted header nav, menu experiments, stats, Account and commerce placeholders from the isolated Jewelry study.
- Did not expand to the full site: the requested review boundary is one Jewelry screen.
