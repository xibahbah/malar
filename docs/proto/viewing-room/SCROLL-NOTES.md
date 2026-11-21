# Current collection motion

On Immersive Garden's Cartier sequence at 1280 × 800, the lower image edge rose about 150 CSS pixels and the adjacent caption rose about 134. In a separate slow pass, the image moved about 381 pixels while a wall feature moved 54. A rapid sweep in either direction briefly showed neighboring project titles and smaller images.

Consecutive frames from upward and downward gestures on Immersive Garden show the same project image shrinking while its neighbors enter the viewport. The central names become legible once the pictures begin to gather. On release the picture grows back through intermediate sizes.

Native document scrolling owns wheel and trackpad inertia. During ordinary scrolling the collection follows about half of a new displacement immediately and eases the rest with a 155 ms time constant. Each piece travels with its caption. The wall moves 0.185 pixels per displayed scroll pixel.

A fast sustained gesture pulls the existing collection back around the viewport center. The same six pictures and their spacing scale together. As the pictures approach their index positions, linked product names appear between them. The Index button keeps the overview open. Choosing a piece moves its thumbnail to the reading point before it expands and receives keyboard focus. Touch and reduced-motion layouts use native scroll and a static version of the same menu.

The drawer uses a single bronze-sheet image with burnishing marks, uneven patina and a narrow edge highlight. A soft reflection follows the pointer over the fixed grain. The gift card and its thumbnail use their own gold leaf.

---

# Earlier mirror gift and bronze bag

- Gift presentation is a polished metal hand mirror, with an oval rim, short handle, restrained botanical engraving, and cool/warm reflective bands. Light position follows the mouse through a short eased response and a small tilt. Materials use CSS and a lightweight inline line engraving, with no new raster texture payload.
- Selecting $25 / $50 / $100 updates the accessible amount immediately; a reflective sweep and 620ms amount reveal make the change legible. Rapid changes cancel previous value/sweep animations. Adding a gift retains the large mirror and sends a small reflective token toward the bag; it does not block subsequent interactions. Reduced-motion users receive immediate state changes.
- Bag uses a separate dark patinated bronze surface, recessed object thumbnails, fine lit dividers, bronze quantity controls and total. Gift thumbnails use miniature mirrors with their correct denomination. Removed inherited full-screen-menu spacing and centering from the bag.
- Existing bag persistence, quantity limits, focus restoration, and demo-only checkout remain. No purchase or payment integration added. Uruli and the lamp loader are separate future concepts and were not part of this material pass.
- Browser verification: $100 × 2 = $200; removal returns $0; $25 + $100 = $125. Narrow 390×844 gift presentation fits from y110 to y791, including the add control. Desktop and narrow screenshots inspected. Existing nine motion tests and module import syntax pass.

---

# Previous Kerala botanical revision

- Replaced the repeated rose/lily composition with six newly generated transparent photographic assets: Chemparathy (hibiscus), Chethi (Ixora), Mulla (jasmine), Kanikonna (Cassia fistula), Sankhupushpam (butterfly pea), and Chendumalli (Tagetes marigold). Source direction and complete prompts are in flowers/GENERATED-ASSETS.md. These are illustrative assets, not scientific identification plates.
- Twenty-two independently animated branches create a cascading canopy, large low focal blooms, small clustered flowers, and fine connecting vines. Placement is asymmetric, with separate narrow-screen coordinates for every branch. Six WebP files total approximately 1.4 MB, retaining generated alpha.
- Each branch receives its own tonal depth. Antique gold, dusty red, ivory, and slate indigo remain distinguishable in a muted palette. The center stays clear for typography; edge crops are contained within the ending stage.
- Canopy flowers descend from their attachment point, side branches enter inward, and lower stems rise. Entrance is staggered at 65ms; all flowers finish by 6.2s after the timed sequence starts. Drag, spring return, and idle motion are retained.

---

# Previous viewport and momentum revision

- Portrait cards now occupy 55vh in height, landscapes about 55vh. Narrow portrait cards use 43.75vh, leaving room for the caption and chapter heading. Objects heading spacing is reduced. Verified the vase, caption, and heading together at 1280×720, 2048×1194, and 390×844; no horizontal document overflow.
- Wheel motion uses an analytical critically damped spring (frequency 9), retaining velocity across packets and reversal. Removed cancellation on delayed scroll events from the controller's own writes. Keyboard, pointer, modal, touch, and reduced-motion escape paths remain. Sequential browser observations show continued travel without another wheel input in both directions.
- Thirteen arranged stems replace three. Flowers enter after the type, starting at 1400ms with 95ms stagger and a 3400ms unfold. Desaturated blooms surround clear central type. Mouse proximity pushes stems aside; dragging lifts and pulls a stem up to 240px horizontally / 180px vertically, with underdamped spring return. Gentle idle sway continues without scrolling. Touch scrolling remains native.
- The botanical behavior is isolated in botanical.js, including the layout, entrance timing, and spring integrator. Existing transparent assets are reused.
- WebGL pixel count is capped at 1.6 million and its CPU interaction field at approximately 28,000 cells. Rendering pauses under the fully black ending and explicitly resumes on exit. This limits work; no hardware FPS claim is made.
- Nine Node checks pass, including delayed-scroll regression, velocity continuity, frame-rate equivalence, real thirteen-stem entrance timing, and elastic return. JavaScript syntax and diff whitespace checks pass. Local browser console captured no warnings/errors. Desktop grab/release and narrow ending inspected; physical touch hardware was not tested.

---

# Earlier motion revision — 2026-11-21

This revision supersedes the independent-caption rates and native-wheel decision below.

## Fresh reference inspection
The reference now loaded successfully in the local browser. Captured 42 screenshots through opening, multiple project/image-caption groups, short increments, fast forward/reverse input, long black interval, and botanical footer. Consecutive screenshots after the same wheel input visibly continue moving. In the David Whyte sequence the image and its paragraph advance together with only a modest relative gap change. The ending has a substantial empty black interval; returning to the footer also reveals continued botanical motion without another wheel event. Screenshot sampling is not frame-exact instrumentation; the chosen values below are our art direction, not recovered reference constants.

## Current behavior
- Each card and caption shares one rate and the same settling constant. Relative caption parallax is bounded to 14px; hover adds at most 8px card lift. Removed delayed caption blur so fast passes show the whole chapter.
- Six foreground rates: 1.18, 1.32, 1.24, 1.38, 1.21, 1.29; wall remains 0.24 on desktop. Chapter columns are inset and limited to 1440px, with different portrait/landscape proportions.
- Fine-pointer wheel input drives real document scrolling with a 260ms exponential time constant. Stopping input leaves a decaying coast; reversing direction immediately discards the previous forward target. Touch remains native. Keyboard, scrollbar and modal interaction release the controller. Reduced motion bypasses it.
- Ending is 280svh (260svh narrow). Wall darkens over 145vh. Once black, typography fades in over 950ms; flowers start after 1450ms, stagger 350ms and develop over 3200ms independently of further scrolling. Reverse travel fades the sequence out and resets before reentry.
- Existing transparent flowers are smaller and less saturated, with a clear central type area and containment inside the ending stage. Individual mouse repulsion and slow return combine with low-amplitude idle sway. No new generated asset was required.
- No verified MALAR contact email exists in this checkout. The ending retains brand copy rather than copying the reference's email or inventing a destination.
- Corrected legacy #studio/#gift/#crafts style leakage affecting chapter layout. Open dialogs lock the underlying document.

## Verification
- Seven Node checks: distinct depth rates, crossing continuity/reversal, frame-rate-independent easing, no-WebGL fallback, bounded caption attachment during reversal, autonomous ending sequence, and wheel coasting/reversal/keyboard/dialog release.
- Local browser: desktop 1280×720 and narrow 390×844; document width equals viewport at both. Original relief/hero loads; all six product images load. Repeated forward/reverse scroll, black-only → text-only → flowers, flower pointer response, return link, menu Story navigation, add/remove and bag open/close checked. No captured console warnings/errors.
- Physical touch-device performance and OS reduced-motion visual behavior are not measured; reduced-motion logic is implemented and pure/fallback paths are covered. Product photography and checkout remain the existing demo.

---

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
