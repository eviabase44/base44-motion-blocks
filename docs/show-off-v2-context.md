# Show off v2

Context and testing handoff, created **2026-11-15**. Git branch: `show-off-v2`.

## Starting point

This branch starts from `e263d4de65a93c990ce75fb924050f44dbbf599b` on `main` in [Base44 Motion Blocks](https://github.com/eviabase44/base44-motion-blocks). Creating the branch changes documentation only; the rendering, editor, importer, and existing layouts are the baseline for comparison.

The next phase is to explore further possibilities, test the tool across a broader range of apps, identify final-execution failures, and then fix them. The checklist below is proposed test coverage, not a claim that those cases have passed or permission to redesign the approved baseline.

## Product intent

Turn an app or website into a personalized 15-second showcase that its builder can share. A user or developer supplies a URL or authorized app snapshot. AI derives factual copy, matches the app's colors and typography, and selects suitable cards from the existing motion layouts. Every shot is independently usable and its content is interchangeable. The tool should eventually be straightforward for Base44 developers to integrate into the product.

The app itself should be the subject: its UI, recognizable features, and useful interactions. The user's desired result is more expressive than screenshots moving inside decorative rectangles. That remains an unresolved product goal, not an implemented capability of this baseline.

## Creative decisions to preserve

- Keep the original five approved shot compositions and their motion as the reference. Early attempts at a new creative direction were rejected. Later freely invented variations were also rejected; replacement variations were tied to specific Base44 reference shots. Being present in the gallery does not establish final brand approval for every adaptation.
- The original request referenced Copycat v3. Subsequent direction asked for image Copycat to choose appropriate source shots and video Copycat to reproduce their motion, then recreate them in code. Reference identifiers and frame ranges live in `src/variants.js`; motion data lives in `src/data/reference-tracks.js`. Source videos are not distributed in this repo.
- Match the showcased app's palette throughout and use its font. The default wireframe treatment is Dazzed Semibold, weight 600, with `-0.03em` letter spacing. Imported app typography can override this.
- Hooks follow the intent of “I built an app / an agent / a website / a tool that …” with an app-specific benefit. Copy must reflect the supplied app rather than generic promotional claims.
- Color blocks are intentional in wireframe mode. Real imports should display actual available app screens; missing screens should be explicit, not silently presented as a finished showcase.
- Preserve the accumulated composition refinements: centered opener text where requested, enlarged reveal screens, readable feature text, one feature-shot number, and three scrolling feature images. Do not reapply historical percentage increases cumulatively.
- The end card is fixed: **“Proudly built on” with the official Base44 logo**. Earlier “Go build your own” versions and duplicate credit lines were superseded. Do not offer alternate ending layouts.
- All card layouts belong in the gallery beneath the editor, with independent selection per shot.

## Current implementation

The player renders deterministic SVG at **960 × 540, 12 fps, 180 frames / 15 seconds**.

| Shot | Frames | Layout IDs |
| --- | ---: | --- |
| Opening (`hook`) | 36 | `original`, `agency-line`, `dark-statement`, `karaoke` |
| App reveal (`reveal`) | 36 | `original`, `screen-stage`, `echo-right`, `echo-left` |
| Card burst (`collage`) | 26 | `original`, `fragment-field`, `file-strip`, `echo-collage` |
| Feature focus (`focus`) | 46 | `original`, `diagonal-window`, `six-week`, `six-day` |
| Ending (`ending`) | 36 | `original` only |

The payload includes app identity, colors, typography, six hook groups, five reveal groups, four focus groups, a hero image, three feature images, and nine cards. Contracts enforce text limits and valid assets. Three collage cards are graphic treatments; six use images.

| Area | Files and behavior |
| --- | --- |
| Player and rendering | `src/player.js`, `src/contracts.js`, `src/svg.js`, `src/motion.js`, `src/shots/` |
| Editor and gallery | `src/studio.js`, `src/importer.js`, `src/variants.js`, `index.html`, `variants.html` |
| Media and fonts | `src/media.js`, `src/brand.js`; preloading and explicit font fallback |
| Host integration | `src/types.d.ts`, `src/capture.js`, `src/sync.js`; atomic updates and newest-update-wins behavior |
| URL generation | `backend/render-url.mjs`, `extract.mjs`, `url-source.mjs`, `planner.mjs`, `api.mjs` |
| Local storage and fetching | `backend/captures.mjs`, `preview-connections.mjs`, `public-fetch.mjs` |

Public URL imports use anonymous browser rendering and screen capture. Signed-in preview URLs need an authorized saved snapshot; the importer does not inherit a user's browser login. The planner receives extracted text and brand candidates, not screenshot bytes, cookies, or login sessions. A server API key or signed-in local Codex CLI supplies AI generation.

The editor stores imported payload and metadata in the URL fragment, and layout choices in query parameters. These are not self-contained media bundles. A URL or exported JSON can still depend on local `/api/captures/` and `/api/assets/` resources.

See [README](../README.md) for setup and [integration guide](integration.md) for API contracts and production requirements.

## What was tried and reverted

The user requested in-app hover, card interactions, and scrolling instead of static screenshots. Continuous recording was subsequently declined, with a request to predict interactions and animate them in code. An experiment added reconstructed app components, predicted interaction animation, adaptive media geometry, and a supplied soundtrack. The user then requested **“revert back.”**

The current branch therefore retains the restored screenshot-based version. Do not silently restore the rejected reconstruction or treat it as approved. A future experiment must be assessed against the actual app and the original motion references. Clearly distinguish recorded interaction, screenshot animation, and predicted component animation.

A music track was supplied during that experiment. Its file is local and excluded from the public repo. Soundtrack playback and MP4 export are not implemented in the restored baseline. The requested final shareable video remains a future execution capability.

## Known issues and useful reproduction cases

1. **UI cropping and screen proportions.** Fixed image windows use cover cropping; a wide dashboard inside a portrait window can hide most of the product. The user asked layouts to fit the source UI. The reverted adaptive experiment did not settle an accepted solution. Compare containment, window geometry, and source selection while preserving the motion reference.
2. **Static content versus product demonstration.** Screenshots cannot demonstrate actual hover or scroll behavior. The current tool animates media and template elements, not live app components.
3. **Missing or repetitive visual content.** Earlier text-only imports produced labeled blocks. Captures improved this, but one screen reused across multiple features does not prove those features were showcased. The last local public test used Excalidraw, with `echo-right`, `fragment-field`, and `diagonal-window`; its saved payload reused one unique captured screen across slots. Treat it as a regression case, not an approved final cut.
4. **Private previews.** A signed-in marketing workspace initially yielded insufficient readable content, then required explicitly authorized local snapshots. Test both missing and stale preview connections, and distinguish the editor shell from the actual app.
5. **Typography and file loading.** An earlier import encountered `typography.src: invalid font URL`, including a `file://` launch. Use HTTP locally. Recheck local asset URLs, hosted fonts, CORS, fallback, and changed font metrics after export or deployment.
6. **Portability.** URL fragments and JSON do not bundle captures or fonts. Reloading on the same machine and sharing with a fresh clone are different tests. Cached assets must not be mistaken for repository contents.
7. **“Any URL” expectations.** The user wants broad website support. Current public capture can still encounter login, anti-bot, loading, or inaccessible-page failures. Report concrete limitations rather than claiming universal compatibility.
8. **Final execution.** Evaluate the complete sequence, readability, card selection, content relevance, and eventual export. Unit tests and a working individual card do not establish finished-video quality.

## Broader test plan

Keep this as a backlog until the tests are actually run. Record each result with the source URL or safe fixture, selected layouts, font, unique screen count, failing shot/frame, observed versus expected behavior, and a reproducible template. Keep private evidence outside Git.

- [ ] Baseline samples: Wireframe, Forma, and Atlas; every layout; full sequence; isolated shot; scrub, loop, and replay.
- [ ] Public pages: conventional HTML, client-rendered app, dashboard, visual gallery, long scrolling page, light and dark themes.
- [ ] Screen shapes: wide desktop, tall/mobile, square, and mixed ratios; inspect content visibility at entrances, holds, and exits.
- [ ] Copy and type: short and maximum-length groups, long app names, custom fonts, unavailable fonts, narrow and wide glyph metrics, low-contrast palettes.
- [ ] Captures: loading/empty state, editor wrapper, repeated screens, zero screens, broken assets, meaningful feature selection.
- [ ] Authorized previews: absent connection, connected snapshot, app changes after capture, replacement snapshot, separation between app identities.
- [ ] State: rapid edits, competing updates, layout selection retention, reload, full-template export, isolated embed, fresh browser, fresh clone without cache.
- [ ] Failure recovery: AI unavailable, planner validation failure, slow capture, generation timeout, inaccessible URL, asset load failure; retain a usable editor state.
- [ ] Final review: watch all 15 seconds, check source fidelity and readable app content, preserve the fixed ending, and assess export/audio only when those capabilities exist.

Run meaningful automated checks for fixes, then review representative rendered frames and complete playback. Expand coverage when failures or new behavior justify it. Keep technical correctness and creative acceptance as separate results.

## Verification at branch creation

`npm test` passed **35/35** checks on 2026-11-15. This is a fresh Node-suite result. Browser-wide and external-URL tests were not rerun for this documentation-only branch creation. The existing browser harness is `/tests/browser.html` and covers all layout frames across the sample profiles; it is not a substitute for the broader import and visual-review matrix above.

## Working on this branch

```sh
git fetch origin
git switch show-off-v2
npm ci
npm run install:browser
npm start
```

Open `http://127.0.0.1:8782/`. The local server must be running. Keep work on `show-off-v2` until changes are ready for review against `main`.

Local `.cache/` data, saved preview connections, private screenshots, reference films, credentials, and music remain excluded from Git. The existing local checkout retains its ignored runtime data when switching branches; a new clone does not receive it. Preserve those local originals when testing. Public branch context intentionally contains no private app payloads, captures, session URLs, or licensed source media.
