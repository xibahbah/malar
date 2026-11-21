# Type / light — visual review revision

Scope: docs/proto/type-light/ only. The six requested adjustments are applied. garden.js, WebGL shaders, textures, main storefront, product selection/lift timing and asset set are unchanged.

## Changes
- Title, product names and prices: #efe3cc, unaffected by selection filters. Only nonselected .product-art elements transition to brightness(.65) over 300ms; opacity remains 1.
- Title: two zero-blur shadows. Dark edge points away from lamp, length clamped to 1–2px; light edge points toward lamp, length 1px, rgba(255,235,190,.25). Both still read only --lx/--ly.
- Manjari outline: 3.5× title line-box height, 18% stroke alpha, behind the Latin title and fitted horizontally to the left half of the content area. No new Malayalam words.
- Grid: twelve tracks. Desktop large product spans columns 1–7, image frame 65svh; small products both span 9–12, image frames 25svh. Image frame, number, rule and product name share the same x origin; material and price have consistent columns.
- At <=1000px the twelve-track grid stacks: large 1–12; both small pieces 2–12. This is the explicit narrow-layout adaptation, preserving one-line metadata rather than squeezing it into four phone columns.
- Vignettes sit on each art frame, center alpha .24 with a soft falloff to transparent; bounded inside the frame to avoid horizontal overflow. No new image assets.

## Measured x coordinates
Values are CSS pixels from the viewport left edge. Art means the SVG image box, not the first opaque pixel in the existing transparent crop. The divider is the .meta top border. Number and product-name x coordinates match divider x. 

| Viewport | Item | Art / SVG x | Rule x | Number x | Name x | Material x | Price x |
|---|---|---:|---:|---:|---:|---:|---:|
| 375 × 812 | 01 | 20.00 | 20.00 | 20.00 | 20.00 | 265.35 | 334.88 |
| 375 × 812 | 02 | 48.91 | 48.91 | 48.91 | 48.91 | 278.45 | 334.88 |
| 375 × 812 | 03 | 48.91 | 48.91 | 48.91 | 48.91 | 278.45 | 334.88 |
| 1280 × 900 | 01 | 167.70 | 64.00 | 64.00 | 64.00 | 629.42 | 704.45 |
| 1280 × 900 | 02 | 847.36 | 847.36 | 847.36 | 847.36 | 1133.32 | 1194.05 |
| 1280 × 900 | 03 | 847.36 | 847.36 | 847.36 | 847.36 | 1133.32 | 1194.05 |
| 2560 × 1440 | 01 | 491.41 | 280.00 | 280.00 | 280.00 | 1330.85 | 1408.88 |
| 2560 × 1440 | 02 | 1638.66 | 1638.66 | 1638.66 | 1638.66 | 2194.31 | 2258.04 |
| 2560 × 1440 | 03 | 1638.66 | 1638.66 | 1638.66 | 1638.66 | 2194.31 | 2258.04 |

| Viewport | Latin heading x | Malayalam x | Outline / title height | document.scrollWidth |
|---|---:|---:|---:|---:|
| 375 | 33.40 | 20.00 | 3.500× | 375 |
| 1280 | 167.68 | 64.00 | 3.500× | 1280 |
| 2560 | 460.00 | 280.00 | 3.500× | 2560 |

## Verification
- Browser geometry: 375×812, 1280×900, 2560×1440; no horizontal overflow, all metadata rows fit. Both right-column items have identical image/rule/name/material/price x coordinates at every checked width.
- Image frame heights: 375 → 527.80 / 203 / 203px; 1280 → 585 / 225 / 225px; 2560 → 936 / 360 / 360px. These correspond to 65% / 25% / 25% viewport height.
- Selected ring: title, all names and all prices computed rgb(239,227,204); parent and metadata filters none. Nonselected product image filters brightness(0.65), selected brightness(1), image opacity 1.
- Title computed shadows have blur 0 for both layers, with the requested highlight rgba. Vignette computed maximum alpha .24.
- JavaScript syntax check passed.

## BLOCKERS
- Mid-range Android 60fps, physical touch input and OS reduced-motion behavior have not been re-certified on hardware; no new performance claim is made. Existing fixed-lamp/reduced-motion code is retained.
- Existing low-resolution transparent atlas and baked photo highlights remain. This revision does not add photographic assets or WebGL product relighting.
- Manjari still depends on Google Fonts.
- Narrow screens use the documented stacked twelve-track adaptation; a literal four-track phone sidebar cannot preserve readable one-line names/material/prices.
- Given a 65vh product plus the enlarged title, this revision scrolls vertically; it is one Jewelry section, not guaranteed to fit inside one viewport.

## CUT LOG
- Removed parent-level 40% dimming and all selection dimming from text.
- Replaced the 6px blurred title shadow with 1–2px / 1px hard edges.
- Removed inconsistent right-column spans, centered small-image frames and alternating mobile indentation.
- Removed vignette overspill that produced 7px horizontal overflow at 375px.
- No other sections, interactions, textures, product data or WebGL behavior changed.
