# Refined motion pass — 2026-11-15

This is a motion revision of the existing eight-shot Figma flow, tested with PUSHBOX. The eight beats, 19-second duration, app palette, Dazzed, source proportions and final Base44 lockup remain the same. The previous animation is still available as **Earlier motion**. This is an editable native-code adaptation, not source-frame replacement and not a screen recording.

## Direction

The app stays frontal. The viewer first reads the description, enters the app, sees the whole interface and then inspects its features. One signature movement is used: the shallow clockwise fan of the feature bundle. Other motion directs attention or resolves a cut. No camera tilt, perspective distortion, decorative blur, cast shadows or whole-frame bounce is added.

Camera Language supplies the wide-to-detail progression and constant viewing axis. Eye Candy supplies the contrast between quick arrivals and longer holds. The Base44 study supplies masked type, independently timed image windows and markers, source-derived collage composition, crisp layout exchanges and the closing symbol sequence. Curves here are authored adaptations, not claimed recovered After Effects keys. Figma remains the pose/layout source.

## Shot score

| Beat | Revision | Readable landing / join |
| --- | --- | --- |
| 0–3s · Opening | Words rise through local masks with short stagger. Cursor follows a curved path, slows before contact and compresses on the click. The app reveals through a growing window at its final scale. | Title resolves before the click. Window is fully open before 3s; its viewport and four corners exactly match the next shot. |
| 3–6s · Homepage | Scroll has acceleration and deceleration, then stops. Cursor arrives before the selected card lifts, then retires before the cut. | Scroll finishes around 4.63s. Hover is a separate attention beat around 5–5.4s. No pixels beyond the supplied page are invented. |
| 6–8s · Bundle | Cards travel along shallow tangent arcs with different start times; the center stays the anchor. Curves settle before the cursor arrives. | Approximately one second of arrival followed by a readable hold. The accent field hits the strong musical event at 6s. |
| 8–10s · Feature 1 | Short page landing, masked word stagger and a delayed number block. Hover follows reading. | Most of the two-second beat is a stable page. |
| 10–12s · Feature 2 | Page window and number block stay registered across the cut. New words resolve independently. | No repeated whole-window bump; content change carries the cut. |
| 12–14s · Feature 3 | Same fixed framing; restrained hover emphasis and cursor retirement. | Holds the third feature before the wider capability beat. |
| 14–17s · Capabilities | Rows and tiles settle at different speeds. The two supplied compositions still exchange on a crisp cut, with a small anticipatory text move and short follow-through. | Type and imagery never cross each other. Grid drift eases to rest. |
| 17–19s · Ending | Individual vector symbols arrive and leave with a short stagger; credit resolves while arrow/logo remain registered. | Final credit and supplied lockup are completely still for the tail. |

The supplied VESHZA bed stays unchanged. Its measured energy accents near 6.00 and 14.03 seconds support the largest scene changes; the 19-second score is preserved. This does not claim every cut was moved onto a music beat.

## Playback and comparison

**Refined motion** evaluates the authored curves at fractional timeline positions. **Smooth · 60 fps**, **24 fps** and **Stepped · 12 fps** are available in the inspector. The timeline/API keeps 12 authoring units per second for backward compatibility; this is independent of the playback sample rate. Browser refresh and device load can cap the delivered cadence. Earlier motion remains at its original 12 fps.

The historical motion canon's 12 fps export preference remains available. Smooth playback is a deliberate option for this requested finesse revision, not a change to that standing brand rule. There is no MP4 export change in this pass.

**Apply refined preset to all shots** installs the new timing, restores hard cuts and retains element adjustments. It does not move or resize your edited layers. Switch **Motion version** to compare choreography while retaining controller values; import your exported previous preset when you want the exact old settings as well. Before/after local presets were saved during the review.

All previous controls still work. Refined shots add **Landing softness**; opening/features also expose **Movement amount**. These values, playback cadence, motion version, cut settings and layer adjustments are part of Save / Load / Download / Import. The public portable preset is `examples/refined-motion-preset.json` and contains no app media.

## Verification

- Unit checks cover preset compatibility, curve endpoints, monotonicity, cursor endpoints and existing source/payload contracts.
- `tests/v2-browser.html` keeps the earlier-motion and legacy-gallery checks.
- `tests/refined-browser.html` covers every smooth sample at normal and extreme settings, full-screen containment, unique editable layers, fractional seeking, determinism and the exact opening-to-homepage join. It includes before/after playback for local review.
- Visual review checks the title reveal, app opening, scroll/hover separation, collage, three feature windows, capability exchange and final lockup with the private local PUSHBOX fixture.

A higher aesthetic score is a review target, not a certification this file awards itself. Low-resolution component crops remain limited by the captured source; interpolation does not add image detail.
