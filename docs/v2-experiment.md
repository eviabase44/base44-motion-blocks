# Show off your app v2

V2 updates the existing app on `show-off-v2`. It uses the original **index.html editor, src/player.js clock, app payload, layout gallery and original shot renderers, with a new Figma flow renderer**. Open `http://127.0.0.1:8782/index.html?version=2`. There is no separate editor or replacement player.

The payload remains version 1 with an optional `showcase` extension. Existing payloads without this extension retain the original five-shot, 15-second behavior. The user explicitly requested changes to v1, not a redesigned tool.

## Updated sequence

The 2026-11-15 Figma revision is the current default. It keeps the approved total of **19 seconds, 228 frames at 12 fps**. The opening and homepage form a six-second entry; the added capability section uses three seconds before the ending.

| Time | Shot | Current behavior |
| --- | --- | --- |
| 0–3s | Opening | Centered app description, cursor click, expanding app window. |
| 3–6s | Homepage scroll | Same window; bounded page movement and predicted hover emphasis. |
| 6–8s | Feature bundle | Selected components and separate app imagery on retargeted measured card paths. |
| 8–10s | Feature 1 | First selected page, title and numbered corner. |
| 10–12s | Feature 2 | Second selected page, title and numbered corner. |
| 12–14s | Feature 3 | Third selected page, title and numbered corner. |
| 14–17s | Capabilities | Benefit copy with the Figma right- and left-hand grid arrangements. |
| 17–19s | Ending | Original Figma vector symbols resolve to “Proudly built on” and the Base44 lockup. |

See [the Figma node and motion-source mapping](figma-flow.md). The supplied earlier video was used for the previous opening experiment; this revision follows the newer user-designed frames. Existing alternative layouts remain selectable in the same editor. V1 payloads retain their previous five-shot timing and design.

## Feature observations

`src/showcase.js` adapts observations into the existing payload and dispatches the existing renderers. `src/v2/model.js` validates and ranks observations. `src/v2/types.d.ts` describes the input; `examples/v2-wireframe.json` is a public fixture.

A feature has an `id`, `family`, `name`, short video `title`, observed component `media`, optional full-screen `page`, optional `available` flag and three signals:

1. `credits`: nonnegative credit usage per feature, or `null`.
2. `visualRichness`: 0–100 proxy for colors/images in the feature, or `null`.
3. `viewport`: fraction of app viewport occupied, 0–1, or `null`.

Ranking follows this hierarchy lexicographically. Visual richness cannot outweigh higher credits. Viewport prominence means **strictly above 60%**. Equal observations use stable feature IDs. A signal missing from any eligible candidate is skipped across the comparison instead of treating it as zero.

Empty candidates are excluded. Repeated families and repeated source regions are skipped after sorting. Three distinct populated features are required. Stable IDs keep each title paired with its visual when ranking changes.

The existing inspector includes **Feature selection · SIMULATED DATA**. Change values and choose **Rebuild features**. Edit the selected feature's title in the normal copy fields. Layout choices for focus, focus2 and focus3 persist independently in the existing URL format.

`signalMode: "simulated"` means test data. `"provided"` means observations supplied by a host; it does not certify an authenticated telemetry connection. Editing supplied signals switches them to simulated. The URL importer can adapt an imported app with three distinct screen images into v2, using explicitly simulated signals and supplied image labels. A real telemetry integration, automatic screenshot vision scoring and an agreed production richness formula are not implemented.

## Image geometry and scrolling

Images include decoded `width` and `height`. Optional `region` bounds identify an observed component in source pixels. The media renderer contains these regions without distortion. The default v2 page slots contain full screens. Component slots can use an explicitly observed hover region. Extremely wide list rows use their supplied page in square montage slots to avoid unreadable strips. Other existing layouts retain their earlier compositions.

Optional `images` holds up to 20 actual app artwork/photo observations, separate from feature UI. The bundle and capability grid use the first three. Missing images are omitted rather than replaced with invented photography. Optional `benefit` supplies the capability headline.

Homepage `windowHeight` defines the scrolling viewport in source pixels. Movement stays within supplied capture bounds. A short viewport capture supports a short pan; a genuine full-page capture supports a longer scroll. The renderer does not invent offscreen content.

Optional `hover` bounds identify a component for predicted emphasis. This is a highlight over observed pixels, not a live recorded interaction. No new application state or invented product data is shown.

## Storage and compatibility

The localhost server optionally loads `.cache/v2/source.json` through `/api/v2/local-source`. Authorized screenshots stay in the ignored `.cache/captures/` directory and use the original capture API. Without a local source, `?version=2` opens the labeled public wireframe fixture. `?baseline=1` keeps the original default sample.

The v1 JSON/URL export includes the optional showcase extension; media references remain local or at their supplied URLs. Export does not bundle files. Local music, proprietary font binaries, references and private captures stay excluded from Git.

Optional music uses the existing player clock for full-sequence playback. The local test extends a previously saved excerpt using a pre-fade segment and a final fade. No music is redistributed.

## Verification

Run `npm test`, then open `/tests/v2-browser.html` and `/tests/browser.html` with the local server running. The v2 harness checks every applicable layout across all eight shots, exact cuts, independent feature layouts, update ordering, image failures and the original payload contract. The original harness checks all 1,836 v1 frames and content swapping.

Technical checks do not establish creative approval. The available capture bounds and simulated signals remain explicit limits of the local test.
