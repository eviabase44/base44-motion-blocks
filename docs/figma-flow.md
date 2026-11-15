# Figma flow — 2026-11-15

This revision implements the user's new [editable shots](https://www.figma.com/design/fnmudHOvdfW16D6TjhEFz2/Show-off-your-app-v2-%E2%80%94-Editable-shots?node-id=0-1) in the existing v2 editor. Text, shapes, media slots and timing remain code-driven. The Figma document was read, not modified.

The [refined motion pass](motion-refinement.md) adds a second choreography over these same layouts. The source-motion descriptions below document **Earlier motion**; new unsaved editor sessions use **Refined motion**. Explicit templates and previously saved tweaks keep their selected version.

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
- Bundle: existing measured Present Flow / SH22 independent card trajectories (`src/data/collage.js`), retargeted to the Figma destinations. The central component anchors the shot and holds through its final frame.
- Features: a fixed app window, word reveals, then stable readable holds. Observed hover regions can lift by four design pixels. This predicts emphasis over real pixels, not a recorded interaction or a change to the app.
- Capabilities: the measured file-strip translation (`src/data/reference-tracks.js`) is remapped to subtle vertical grid movement; the original hard flip at frame 18 exchanges the two supplied compositions.
- Ending: the B44-06 symbol-row/hold vocabulary, using the user's exact vectors. The symbols are held for five output frames before resolving to the fixed credit and logo.

Camera Language and Eye Candy guide continuity: frontal app views, wide context before individual features, the original pop/hold cadence and a held ending. No invented 3D camera, generic transition pack or fake UI components are introduced.

## Host content

Supply full pages as `feature.page`, components as `feature.media`, optional observed `hover` rectangles, and actual photography/artwork as `source.images`. All bounds use original image pixels. `source.benefit` is editable in the capability inspector. The app's existing font, palette and copy fields remain replaceable.

Homepage movement is bounded by the supplied region and `windowHeight`. A viewport screenshot only supports a short pan; longer multi-section movement requires a longer source capture. The renderer does not synthesize missing page content. Empty image roles are omitted. Extremely wide list-row components use their provided full page in square montage slots.

PUSHBOX is the local validation app. Its captures, soundtrack and simulated selection observations remain in ignored local storage. The repository contains the renderer, vector marks and a public wireframe fixture; it does not redistribute the private application.

## Verification and remaining scope

The browser harnesses cover every v2 layout/frame, exact cuts, media loading, update ordering and the unchanged original 15-second contract. Node tests cover source bounds, page fitting, selection and planner compatibility. Visual review uses the current local PUSHBOX pages and the source Figma states.

This is a code implementation for design review, not a claim of brand approval or a live telemetry integration. Built-in MP4 export and automatic extraction of exact component/photography regions from every imported site are still separate work.

## Animation, cuts and element editing

The pre-match-cut Figma animation is restored (the motion from commit `ed5a5e8`). Original hard cuts are the default; the later exit morphs and continuous capability swap have been removed. All eight shots retain their durations, totaling 19 seconds.

Select a shot and use **Animation** in the inspector. Controls include speed, movement, word interval, app opening time, scroll distance, hover lift and symbol hold, where relevant. Speed retimes the interior while keeping the endpoints. **Cut to next shot** offers Hard cut, Dissolve, Slide left, Slide right and Wipe across. The duration is 2–12 frames. **Preview cut** plays the outgoing tail and following shot. Transitions occupy the beginning of the incoming beat, so the full video remains 19 seconds.

With **Edit elements on canvas** enabled, click or tap a visible element to pause and select it. Drag to move; use any corner handle to resize. The **Layer** menu also selects grouped titles, complete screens, obscured layers and individual words. Numeric X/Y offsets and width/height fields accept fine adjustments; aspect ratio is locked by default. Arrow keys nudge 1 design pixel, Shift+Arrow 10, Alt+Arrow 0.1. Nudge buttons offer the same step choices. Undo/redo tracks layout edits separately from motion settings. Layers can be hidden and reset individually. Captured app screens remain image layers; text and controls baked into an image cannot be edited separately.

Changes apply throughout that shot, on top of its authored animation. Selection boxes and handles are editor-only and never enter the rendered frame. Layout and motion controls apply to the Figma layouts; cut choices also work with legacy gallery alternatives. The inspector offers **Restore Figma flow** when needed.

**Save tweaks** saves motion, cuts and element adjustments for all shots in browser localStorage, keyed by app name. A clean reopening of the same app restores saved settings; an explicit template carrying `showcase.motion` takes precedence. **Load saved** restores that saved state. **Reset motion** resets only the current shot's motion/cut settings, keeping element edits. **Download tweaks** and **Import tweaks** round-trip a versioned JSON preset without app screenshots. Full payload/template exports include all settings. Download a preset for a durable backup; browser saving does not commit changes to GitHub.

Host API:

```js
player.setMotion({
  version: 1,
  shots: {
    reveal: {tempo: 1.15, scroll: .8, hover: 6, cutType: 'dissolve', cutFrames: 6},
    focus2: {wordFrames: 1, hover: 3},
    ending: {symbolFrames: 8}
  },
  elements: {
    focus2: {headline: {dx: 12, dy: -3, sx: 1.1, sy: 1.1, px: 182, py: 87}}
  }
});
const template = player.getPayload(); // includes showcase.motion
```

Stable layer IDs appear in SVG `data-element-id` attributes. `dx` and `dy` are design-space offsets; `sx`/`sy` are scale factors around `px`/`py`. `hidden` toggles visibility. Values are validated before acceptance. Older motion-only presets remain supported.

`tests/v2-browser.html` covers original animation landmarks, all layout/frame combinations, cut rendering, valid geometry at control extremes, editable layer coverage, and player/payload integration. Node tests cover resize anchors, preset persistence, isolation by app, malformed settings and source validation.
