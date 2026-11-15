# Show off your app v2

V2 updates the existing app on `show-off-v2`. It uses the original **index.html editor, src/player.js clock, app payload, 17-layout gallery and shot renderers**. Open `http://127.0.0.1:8782/index.html?version=2`. There is no separate editor or replacement player.

The payload remains version 1 with an optional `showcase` extension. Existing payloads without this extension retain the original five-shot, 15-second behavior. The user explicitly requested changes to v1, not a redesigned tool.

## Updated sequence

The user approved extending the sequence to about 19 seconds after supplying a six-second opener. V2 is **19 seconds, 228 frames at the existing 12 fps**.

| Time | Existing shot | Change |
| --- | --- | --- |
| 0–6s | Opening | New reference-based gallery → cursor click → app-description reveal, using the connected app. Other existing opening layouts remain selectable. |
| 6–9s | App reveal | Homepage scroll inside the selected existing reveal layout. |
| 9–11s | Card burst | Original measured card paths, populated from selected features. Existing burst alternatives remain selectable. |
| 11–13s | Feature focus | First selected feature and its own title. |
| 13–15s | Feature focus 2 | Second selected feature and its own title; independently selectable existing focus layout. |
| 15–17s | Feature focus 3 | Third selected feature and its own title; independently selectable existing focus layout. |
| 17–19s | Ending | Existing “Proudly built on” and official Base44 logo. |

The supplied `show-off-your-app-v21 (1).mp4`, **0:00–0:06**, provides the opening composition/timing reference. It was inspected at 1920×1050, 25 fps and sampled frames. The weather-app content is replaced with the connected app; source footage is not bundled or patched. The code adaptation is for review, not a claim of pixel-perfect matching or brand approval.

The visual progression establishes the app before feature details. The original card burst is the one signature move; feature shots keep the established typography, palette and layout vocabulary. The fixed ending releases into a held frame.

## Feature observations

`src/showcase.js` adapts observations into the existing payload and dispatches the existing renderers. `src/v2/model.js` validates and ranks observations. `src/v2/types.d.ts` describes the input; `examples/v2-wireframe.json` is a public fixture.

A feature has an `id`, `family`, `name`, short video `title`, observed `media`, optional `available` flag and three signals:

1. `credits`: nonnegative credit usage per feature, or `null`.
2. `visualRichness`: 0–100 proxy for colors/images in the feature, or `null`.
3. `viewport`: fraction of app viewport occupied, 0–1, or `null`.

Ranking follows this hierarchy lexicographically. Visual richness cannot outweigh higher credits. Viewport prominence means **strictly above 60%**. Equal observations use stable feature IDs. A signal missing from any eligible candidate is skipped across the comparison instead of treating it as zero.

Empty candidates are excluded. Repeated families and repeated source regions are skipped after sorting. Three distinct populated features are required. Stable IDs keep each title paired with its visual when ranking changes.

The existing inspector includes **Feature selection · SIMULATED DATA**. Change values and choose **Rebuild features**. Edit the selected feature's title in the normal copy fields. Layout choices for focus, focus2 and focus3 persist independently in the existing URL format.

`signalMode: "simulated"` means test data. `"provided"` means observations supplied by a host; it does not certify an authenticated telemetry connection. Editing supplied signals switches them to simulated. The URL importer can adapt an imported app with three distinct screen images into v2, using explicitly simulated signals and supplied image labels. A real telemetry integration, automatic screenshot vision scoring and an agreed production richness formula are not implemented.

## Image geometry and scrolling

Images include decoded `width` and `height`. Optional `region` bounds identify an observed component in source pixels. The media renderer contains these regions without distortion. The original reveal/focus containers accommodate wider app content where needed, and other layouts retain their source motion and composition.

Homepage `windowHeight` defines the scrolling viewport in source pixels. Movement stays within supplied capture bounds. A short viewport capture supports a short pan; a genuine full-page capture supports a longer scroll. The renderer does not invent offscreen content.

Optional `hover` bounds identify a component for predicted emphasis. This is a highlight over observed pixels, not a live recorded interaction. No new application state or invented product data is shown.

## Storage and compatibility

The localhost server optionally loads `.cache/v2/source.json` through `/api/v2/local-source`. Authorized screenshots stay in the ignored `.cache/captures/` directory and use the original capture API. Without a local source, `?version=2` opens the labeled public wireframe fixture. `?baseline=1` keeps the original default sample.

The v1 JSON/URL export includes the optional showcase extension; media references remain local or at their supplied URLs. Export does not bundle files. Local music, proprietary font binaries, references and private captures stay excluded from Git.

Optional music uses the existing player clock for full-sequence playback. The local test extends a previously saved excerpt using a pre-fade segment and a final fade. No music is redistributed.

## Verification

- 46 Node checks pass, including original contracts plus selection hierarchy, deduplication, missing data, geometry, new timing and v1-payload compatibility.
- `/tests/v2-browser.html` exercises the existing player: all seven shots in every applicable existing layout, 840 rendered frames, exact cuts, independent feature variants, latest update ordering, missing-media rejection, fixed ending and return to the original 15-second payload.
- `/tests/browser.html` passes the original 1,836-frame regression with no reported errors or overflow.
- In the existing editor, raising Asset library credits moved it to Feature 1 with its matching title and visual. Restoring the signals restored the weekly schedule.

Technical checks do not establish creative approval. The available capture bounds and simulated signals are explicit limits of this test.
