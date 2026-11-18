# Endcard · original Copycat native reconstruction

The 2026-11-18 revision replaces the independently visible seven-symbol row and logo with the actual glyph-to-wordmark mechanism from **B44-04 · In your own words**, native frames **1280–1305**, 24 fps. Source: https://www.youtube.com/watch?v=l8HZCLKk1rs . The known local source was decoded; no new reference was inferred from a thumbnail.

The final four seconds of all nine saved Base44 sources were decoded with timestamp manifests and compared. These films have multiple ending mechanisms: counter-to-logo, letter builds, black glyph decode, colored character decode, and an orange-field lockup. They do not share one identical animation. B44-04 is the applicable black-glyph/paper ending. Its exact shapes are Sentinel, Knot, Sprout, Bloom, Arrow, Click, and Frame.

## Frame map

| Tool frame (12 fps) | Native source frame | Pose |
|---|---|---|
| 0–9 | Copy adaptation | Centered “Proudly built on” |
| 10 | 1280 | Seven black glyphs, source positions |
| 11 | 1282 | Six glyphs, contracted row |
| 12 | 1284 | B replaces the second glyph |
| 13 | 1286 | Ba + arrow + e44 |
| 14 | 1288 | Orange mark arrives; last 4 still separated |
| 15–23 | 1290–1305 | Complete centered lockup, held |

Native source frames 1283, 1285, 1287 and 1289 remain explicit boundaries in the pose function. At the tool’s requested 12 fps, every second 24 fps frame is sampled by elapsed time. There are no tweens, fades, or random shuffles. Both motion modes use this same ending.

The final lockup spans x392–568 in a 960×540 canvas: center x480. The mark is 36×36 at (392,253); the wordmark is 131×31 at (437,254). Glyph positions and size changes were measured directly from decoded frames. Independent optical placement of the mark and wordmark follows the source instead of centering both elements by their rectangles.

`assets/v2/ending/` contains official vector geometry extracted from the Base44 MKT Design Library, including isolated wordmark letters. Letter shapes are not typed substitutes. All fixed assets preload before playback. `symbolFrames` remains the persisted control key, now labeled **Logo build duration**, and always leaves at least eight frames of final hold. The existing logo, credit, and symbol editing layer IDs remain available in their visible phases.

## Declared differences

This is editable native reconstruction, not a pixel-identical source export. The opening copy replaces “In your own words”, its partial-word scramble is replaced by the requested credit hold, and the tool retains flat paper instead of the reference’s fading ghost-UI/print texture. The approved 19-second total and 12 fps cadence remain. No claim is made that all Base44 films use one universal ending or that the original After Effects project was rendered.

The local review is `tests/endcard-comparison.local.html`, with synchronized playback and enlarged source/rebuild pose pairs. It is excluded from Git, as are the decoded reference frames in `.cache/v2/endcard-copycat/`. No private PUSHBOX captures are published with this revision.
