# Figma flow — 2026-11-15

This revision implements the user's new [editable shots](https://www.figma.com/design/fnmudHOvdfW16D6TjhEFz2/Show-off-your-app-v2-%E2%80%94-Editable-shots?node-id=0-1) in the existing v2 editor. Text, shapes, media slots and timing remain code-driven. The Figma document was read, not modified.

## Frame mapping

| Shot | Figma nodes | Code timing |
| --- | --- | --- |
| Opening | 9:167 → 9:194 | 0–3s |
| Homepage scroll | 9:224 | 3–6s |
| Feature bundle | 9:235 | 6–8s |
| Three feature pages | 9:357, 9:411, 9:421 | 8–14s, 2s each |
| Capabilities | 9:431 → 10:533 | 14–17s |
| Ending | 9:465 → 9:494 | 17–19s |

`src/v2/figma-flow.js` owns these layouts. Its SVG groups carry their source node IDs. The file's authoring containers include annotations and several non-16:9 frame extents; the implementation uses the 960 × 540 video area and adapts those extents. The homepage's maximum slot is 780 × 426, feature pages 630 × 364. Images are contained at their source aspect ratio. Template notes such as “Home screen fixed width” are instructions, not displayed copy.

The seven ending symbols and orange-icon Base44 lockup are individual vector exports from the supplied file (`assets/v2/`). The full slides are not flattened into images.

## Motion sources and adaptations

The supplied Figma nodes returned no authored motion tracks. Timing is therefore an adaptation of the Base44 motion study and Copycat source vocabulary, not recovered Figma animation:

- Opening: source-indexed word pops, a held frontal title, cursor approach/click, then a window that carries directly into the homepage shot.
- Settling: a normalized `.74` decay over a declared interval, sampled on the existing 12 fps clock. This is not presented as a universal Base44 curve.
- Bundle: existing measured Present Flow / SH22 independent card trajectories (`src/data/collage.js`), retargeted to the Figma destinations. The central component anchors the shot and lifts slightly as the cursor reaches it.
- Features: short two-frame page entrances, word reveals, then stable readable holds. Observed hover regions can lift by four design pixels. This predicts emphasis over real pixels, not a recorded interaction or a change to the app.
- Capabilities: the measured file-strip translation (`src/data/reference-tracks.js`) is remapped to subtle vertical grid movement; a hard cut exchanges the two supplied compositions halfway through the shot.
- Ending: the B44-06 symbol-row/hold vocabulary, using the user's exact vectors. The symbols are held for five output frames before resolving to the fixed credit and logo.

Camera Language and Eye Candy guide continuity: frontal app views, wide context before individual features, one pronounced bundle move, clear cuts, and a held ending. No invented 3D camera, generic transition pack or fake UI components are introduced.

## Host content

Supply full pages as `feature.page`, components as `feature.media`, optional observed `hover` rectangles, and actual photography/artwork as `source.images`. All bounds use original image pixels. `source.benefit` is editable in the capability inspector. The app's existing font, palette and copy fields remain replaceable.

Homepage movement is bounded by the supplied region and `windowHeight`. A viewport screenshot only supports a short pan; longer multi-section movement requires a longer source capture. The renderer does not synthesize missing page content. Empty image roles are omitted. Extremely wide list-row components use their provided full page in square montage slots.

PUSHBOX is the local validation app. Its captures, soundtrack and simulated selection observations remain in ignored local storage. The repository contains the renderer, vector marks and a public wireframe fixture; it does not redistribute the private application.

## Verification and remaining scope

The browser harnesses cover every v2 layout/frame, exact cuts, media loading, update ordering and the unchanged original 15-second contract. Node tests cover source bounds, page fitting, selection and planner compatibility. Visual review uses the current local PUSHBOX pages and the source Figma states.

This is a code implementation for design review, not a claim of brand approval or a live telemetry integration. Built-in MP4 export and automatic extraction of exact component/photography regions from every imported site are still separate work.
