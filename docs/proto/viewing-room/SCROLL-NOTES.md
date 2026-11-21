# Continuous homepage — decision record

## Earlier reference observation (previous implementation)
Inspected immersive-g.com from opening to footer, including reverse scrolling and ten screenshots: opening, introduction, the same card before/after a scroll, middle projects, two lower positions, last project, black transition, botanical ending.

- Cards alternate in position, proportions and spacing; labels occupy their own space.
- The same card changes projected size and angle as it passes the viewport. The relief continues behind it.
- The final project precedes a black interval and then a botanical contact composition with a clear center.
- The reference uses a virtual/canvas scroll surface. Exact scene speeds and timings cannot be recovered from screenshot observations. No claim of matching its numerical parameters.

## Implemented
The MAIN homepage now runs: original MALAR / Malayalam landing → Jewelry (three pieces) → Objects (three pieces) → Story → Gift → dark botanical ending. The prototype URL remains for compatibility; no visit to it is required.

- Original relief, loader, title entrance, random strokes and gilded menu retained. Background scroll was revised below.
- Existing stone-atlas.png restored behind six existing cutouts. Sharp edges, a 2px side plane, separate object-shadow plane; no sweeping highlight stripe.
- Native scrolling, cached stationary card bounds, and one foreground RAF clock. Hover/focus lifts the card 8px and increases object separation from 25px to 39.4px. Independent scroll rates are documented below.
- The former 1.05 wall rate and identical ±38px card offsets have been replaced; they made foreground and background travel too similarly.
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


## Independent depth motion — 2026-11-21

This pass attempted fresh screenshot sampling at https://immersive-g.com/.
The reference remained on loading indicator 6 and reported `viewManager` initialization errors, including after one reload. No usable new reference scroll sequence was obtained. The following rates are art-directed from the user's explicit feedback, not measurements or a claim of matching the reference.

| Layer | Travel per native scroll pixel | Easing time constant |
| --- | ---: | ---: |
| Wall, desktop | 0.24 | 220ms in WebGL; direct in CSS fallback |
| Earrings | 1.18 | 90ms |
| Ring | 1.48 | 145ms |
| Necklace | 1.30 | 115ms |
| Vase | 1.56 | 160ms |
| Tray | 1.22 | 100ms |
| Basket | 1.40 | 135ms |
| Captions | 0.93–1.06 | 180ms |

Rates describe settled displacement; instantaneous velocity changes during easing. Card offsets are relative to each piece's viewport crossing, not the top of the document. The clamp is outside the visible crossing. Bounds remain stationary for layout measurement; pointer hit-testing and the focus outline follow the moving surface. The observer prewarms a larger area and resets unseen card state before reentry. Reduced motion resets every card, including offscreen cards, and fixes the wall. Narrow/coarse-pointer cards retain their static layout; the narrow wall rate is 0.42.

Validation in this pass:
- Successive local browser screenshots across all six cards, with small forward/reverse steps around earrings/ring, original opening, and card pointer/focus targeting. All six product images loaded; desktop document width equals viewport width (1348px).
- This browser used the CSS wall fallback. WebGL rendering and physical mobile performance were not visually validated. An initial fallback initialization error was fixed by moving the motion preference declaration before the fallback; it is covered by the regression test.
- `node --test tests/scroll-motion.test.mjs`: independent rates, visible-crossing continuity and reversal, 60/120Hz easing equivalence, and no-WebGL desktop/narrow/reduced-motion fallback all pass.
- JavaScript syntax and `git diff --check` pass.
