# Continuous homepage — decision record

## Reference observation
Inspected immersive-g.com from opening to footer, including reverse scrolling and ten screenshots: opening, introduction, the same card before/after a scroll, middle projects, two lower positions, last project, black transition, botanical ending.

- Cards alternate in position, proportions and spacing; labels occupy their own space.
- The same card changes projected size and angle as it passes the viewport. The relief continues behind it.
- The final project precedes a black interval and then a botanical contact composition with a clear center.
- The reference uses a virtual/canvas scroll surface. Exact scene speeds and timings cannot be recovered from screenshot observations. No claim of matching its numerical parameters.

## Implemented
The MAIN homepage now runs: original MALAR / Malayalam landing → Jewelry (three pieces) → Objects (three pieces) → Story → Gift → dark botanical ending. The prototype URL remains for compatibility; no visit to it is required.

- Unmodified garden.js and garden.css: original relief, loader, title entrance, random strokes and gilded menu.
- Existing stone-atlas.png restored behind six existing cutouts. Sharp edges, a 2px side plane, separate object-shadow plane; no sweeping highlight stripe.
- Native scrolling, one RAF clock, cached stationary card bounds. Only nearby cards update. Foreground shift is bounded ±38px; pitch ±7° from scroll, plus modest pointer tilt. Hover/focus lifts the card 8px and increases object separation from 25px to 39.4px. Values ease with a 95ms exponential time constant.
- Existing wall engine retains its 1.05 scroll factor. The bounded card displacement gives a small speed difference; it does not accumulate into runaway parallax.
- Existing Cormorant/Manrope typography retained. Cards use alternating 12-column placements and portrait/wide formats.
- Footer fades the wall to black and introduces three existing upstream transparent WebPs at different shallow depths. No extra canvas or rendering library.
- Menu targets scroll within the main page. Gift amounts enter the same local bag. Quantity changes retain keyboard focus. Checkout is labelled Demo checkout and charges nothing.

## Validation
- JavaScript syntax check passed.
- Browser: original hero, six loaded product images, same-page Objects/Gift navigation, add/update/remove, $100 gift selection, mock order completion and dark botanical footer checked.
- Browser widths: 375 → document width 375; 1280 → 1280; 2560 → 2560. At 2560 none of the six image footprints overlaps its text column.
- Console: no errors or warnings observed in the local test.

## BLOCKERS / limitations
- Product photography and normal/depth data remain placeholders. Cards are 2.5D photographic planes; rotation does not reveal an actual new side of the object. No photogrammetry, baked view sequence or per-card 3D scene was created.
- Payment is a local mock. No money, email or inventory service is connected.
- Physical mid-range Android FPS / Lighthouse and reduced-motion device testing were not performed. Reduced-motion CSS and JS paths disable card transforms and text blur; coarse/narrow pointers receive static cards.
- No 15-second video delivered in this pass; screenshots were used to inspect the reference and verify implementation.

## CUT LOG
- Removed the separate introductory statement from the browsing route; the original landing is the opening.
- Replaced the main page product rendering with the six-item continuous gallery. Original source modules remain in the repository, unloaded.
- Omitted per-card animated 3D scenes and dramatic rotations at the user's request.
- No particles, cursor dot, scroll interception or new highlight sweep.
- Account / newsletter / stats are not carried into this homepage; Story and Gift remain in the continuous route.
