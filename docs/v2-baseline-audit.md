# Show off v2: initial execution audit

Date: **2026-11-15**. Baseline: `e87f131` on `show-off-v2`.

This first pass checks existing rendering and editor failure recovery. No runtime or design changes were made. Public-URL diversity, real-app visual quality, and final export remain separate work in the [broader test plan](show-off-v2-context.md).

## Passed

- `npm test`: **35 passed, 0 failed**.
- `/tests/browser.html` in Chrome: **PASS**, **1,836 rendered frames**, no reported invalid geometry or text overflow under the harness's checks.
- The browser harness covered all layouts for Wireframe, Forma, and Atlas; sequence boundaries; content updates retaining layouts; fixed ending; invalid selection; atomic template rejection; newest-update-wins behavior; media mode; and image-preload rejection.
- During the editor reload reproduction below, the `screen-stage` layout selection survived reload.

The harness checks text overflow at the final frame of non-original layouts, with authored crop/decorative exceptions. It does not prove all text is readable throughout playback, that real app UI fits, or that imports choose meaningful images.

## Reproduced failures

### V2-001: sample edits disappear after reload

Priority: high for editing reliability. Applies to the sample-profile editor path tested here.

1. Open `/?app=wireframe&shot=reveal`.
2. Set App name to `V2 CHECK` and Line 1 · A to `Test`.
3. Choose App reveal → Dashboard stage.
4. Verify the fields contain the edits and the status says `Synced`.
5. Reload the page.

Observed: App name returns to `YOUR APP` and the copy returns to `Your`. Dashboard stage remains selected. The current page URL has no payload fragment.

Expected: accepted edits should survive reload, or the editor should clearly describe them as unsaved and provide an explicit save flow. Layout persistence alone is insufficient.

Code evidence: `src/studio.js` calls `persistImported()` after binding edits, but that function returns unless the profile is `imported`. The isolated link receives a payload, while the main sample editor URL does not.

### V2-002: unavailable startup font strands the editor

Priority: high for opening saved/imported templates.

1. Start with the valid Wireframe payload exposed by App payload JSON.
2. Set `typography.family` to `V2 Missing Font` and `typography.src` to `/v2-missing-font.woff2`, an intentionally absent asset.
3. Open the editor with `app=imported&shot=hook&wireframe=1` and that payload in its URL fragment. Wireframe mode isolates font recovery from image loading.
4. After the font error, choose Arial in App font, then Forma in App content.

Observed: `Cannot load app font V2 Missing Font: A network error occurred.` remains visible. The controls display the new selections, but no stage SVG renders and App name remains empty.

Expected: keep the content accessible and allow selecting an available font or another app. A clearly disclosed fallback is another option; it must not silently discard the template.

Code evidence: initial `createMotionPlayer()` awaits `loadAppFont()`. A failure reaches the outer catch before editor recovery handlers and the URL importer are connected. The generation path has font fallback logic, but startup does not.

### V2-003: Apply JSON accepts an unavailable image as synced

Priority: high for media validation and truthful status.

1. Open the healthy Wireframe app reveal and select Dashboard stage.
2. Expand App payload, preserve its valid payload, and set `media.hero.src` to `/v2-missing-screen.png`, an intentionally absent asset.
3. Turn off Show images as wireframe blocks.
4. Paste the edited payload and select Apply JSON.

Observed: the status says `Synced`, the error area is hidden, and the stage contains an SVG image pointing to the absent URL. The accepted payload also retains that missing URL.

Expected: validate referenced media before accepting this update in image mode; surface the failure and keep the last usable template. This should match generation's image validation behavior.

Code evidence: `Apply JSON` calls `bind()`, which updates the player without `preloadMedia()`. The generation path does preload media. Contract validation checks URL form, not whether image bytes can load.

## Next coverage

Before considering the broader execution review complete:

- Check imported-template edit/reload/export behavior separately from sample edits.
- Verify broken-image behavior on reload and when toggling between image and wireframe modes.
- Exercise font and asset failures during ongoing edits, not only startup.
- Compare public URL imports across different page types and count distinct, useful captures.
- Review wide, tall, square, and mixed screen ratios against the selected compositions.
- Watch full sequences for content relevance, clipping, legibility, and transitions.

The local editor was restored to a healthy Wireframe opening after these tests. Private app captures, saved connections, and runtime cache were not altered or published. No screen recordings were made.
