# Phase 1 — decision record

Status: code prototypes ready for visual review; NOT approved for integration.

## Run
Serve `docs` over HTTP. Open `/proto/garland-cart/` and `/proto/lit-product/`.
No dependencies, build step, accounts, credentials or visitor data uploads.
The prototype branch is `prototype/ritual-phase-1`. Only additive `/proto/` files are published for review; existing homepage and collection are unchanged.

## Deferred carpet (superseded brief; Phase 4 only)
Chosen: a gesture becomes a narrow petal ribbon, repeated around an eightfold sector. Each day adds a ring and its own color; the day slider preserves earlier rings. 500 deterministic synthetic visitor records, 200 points each. Synthetic records and up to 50 actual local contributions are kept under namespaced localStorage keys. No claim of real shared participation.
Drag, release to preview, then Place. Keyboard alternative makes a petal without requiring drawing. Day scrub is immediate; no automatic motion. Stress toggles continuous rendering of exactly 5,000 petal instances when the device's texture-size limit permits it. Normal rendering happens only on input. Background tabs stop the benchmark.
Cut: backend, real cycle rollover/archives, dusk rotation and purchase snapshot. These depend on approving the core gesture first. No database deployment in Phase 1.
Rendering: WebGL2 instancing, one 200-sample triangle ribbon per petal; RGBA32F path texture, eightfold alternating reflection. 500 paths produce 4,000 instances at day 10; the explicit benchmark uses 5,000, not 5,000 visitors. DPR capped at 1.6. The FPS readout measures browser frame cadence, not isolated GPU time.

## Lit product
Chosen: fork the current garden function into the isolated prototype. The wall's mesh (248 cells), field, lamp blend, key direction (-.55,.60,.82) and exponent 46 remain. The product albedo, pseudo-height and pseudo-normal textures enter the SAME vertex/fragment program. There is no CSS product overlay or independent light. Pointer and keyboard light sliders drive the same wall input.
Placeholder: crop x15 y130 w350 h450 from product-objects.png. RGB luminance times alpha, 3x3 box smoothing, central-difference normals. Height stored in normal texture alpha; vertex displacement adds it to the wall. This is an appearance experiment, NOT photometric reconstruction. Existing photographic shading cannot be removed with this method; double shading and false relief remain risks. Source resolution also limits sharpness.
Cut: commerce, alternate products, sound, nav changes and mobile motion. No new sine audio. Reduced motion keeps a static usable view.

## Evidence / acceptance
- Both JavaScript files pass node syntax checks.
- No browser automation surface is available in this execution session: shader compilation, visual interaction and actual device timing have NOT been verified.
- 60fps Android / Lighthouse >=85 / LCP <2.5s: NOT MEASURED. Requires named device/browser, cold-cache network profile and GPU results. Runtime WebGL2 texture-size limits are surfaced explicitly.
- Logo-off recognition, 5-second sell test, retell and analytics: NOT RUN. Do not claim success without participants and baseline.
- Suggested go/no-go: first decide whether a drawn path still feels personal after eightfold repetition; then decide whether the shared light improves the earring despite the baked source shadows. If either fails, revise Phase 1 before storyboards.

## Cultural review inventory
Only pookalam's concentric floral arrangement and progressive day structure from the supplied brief are used here. Eightfold mirroring and the color sequence are design hypotheses, not claims of a canonical Kerala pattern. Ask Malayali makers whether the form, daily color additions and conversion of a visitor gesture into a contribution feel appropriate.
No deities, Mahabali narrative, puja scenes, lamp ritual, sacred symbols or invented Malayalam labels have been introduced. Time/lamp/jasmine, garland cart, five-wick navigation and material rituals remain future proposals, not implemented or culturally validated.

STOP after Phase 1. Do not integrate or start Phase 2 until reviewed.


## Updated Phase 1: garland cart
products.json owns IDs, cents, currency and crop metadata. cart.js owns validation, limits, subscriptions and localStorage. garland.js owns presentation and the mock checkout adapter boundary. Add, +/- quantity (0 removes, max 20), Remove, empty state, total, review, confirmation, receipt, focus return, Escape and reduced motion are implemented. Checkout collects no PII, creates no charge, clears the strand only on explicit mock confirmation. Payment integration remains TODO: payment provider.

## BLOCKERS (updated brief)
- 15-second screen recording NOT delivered: no browser/screen recording tools are available in this session. No synthetic animation is substituted for a real recording.
- Visual QA, actual shader compilation, keyboard/touch browser walkthrough and Android 60fps NOT VERIFIED. Syntax and cart state tests are not substitutes.
- Cart pictures are existing photo crops, and garland uses DOM transforms; only the one-earring lighting prototype uses the shared wall pass. No claim that the full cart is in WebGL.
- All prices and stock are demo data. Mock checkout only. No payment, shipping, account, email or stock service exists.
- Luminance-derived normals contain baked-light artifacts. Real photometric inputs needed for material fidelity.
- No foley or gyroscope, no KTX2/Basis conversion, no time system or five-wick nav. They belong to later phases.

## CUT LOG (updated brief)
- Shared backend and 10-day carpet moved out of the active work; personal carpet is Phase 4.
- No new site-wide effects or main storefront replacement.
- No physical thread simulation: a fixed thread plus one restrained scroll swing tests the collection metaphor without scroll hijacking.
- No checkout personal data fields: a mock order needs no real address or card number.
- No fake recording, fake FPS or unrun user-study results.

## 15-second manual recording script (not evidence)
0-3s scroll the thread; 3-6s add earrings then ring; 6-9s increase earrings and remove ring; 9-12s open checkout; 12-15s complete mock order, show receipt. Record on the target device with reduced motion off, then separately verify reduced motion and keyboard.
