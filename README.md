# Base44 Motion Blocks

**Show off v2:** the existing editor renders the revised Figma flow in 19 seconds: centered description and app entry, homepage scroll, feature bundle, three ranked feature pages, capability grid, and symbol-to-logo ending. Open [the v2 app](http://127.0.0.1:8782/index.html?version=2). [Asset handoff and related content](docs/asset-handoff.md) · [Base44 study restoration](docs/study-motion.md) · [Layout mapping](docs/figma-flow.md) · [Integration details](docs/v2-experiment.md). New sessions use **Base44 study · 12 fps** with held word reveals, source-derived card trajectories and hard cuts. The smooth experiment is archived as an explicit alternative. Saved or explicit presets take precedence; **Restore Base44 study motion** resets timing and cuts while preserving layer edits. Click elements to move, resize or nudge them; save all motion and layout tweaks locally or export/import a JSON preset. Feature signals remain simulated in the local test.

A code-based editor for personalized app showcase videos. **The saved v2 version has eight cards over 19 seconds, with one retained design per card.** The feature bundle retains the approved blue-background composition, alongside the other current cards. Alternate card layouts have been removed from the editor and AI planner. [Saved version details](docs/saved-version-2026-11-18.md). The original five-shot, 15-second API remains available.

This repository contains the screenshot-based version and original preset compositions. It does not contain the reverted simulated app components or adaptive layout experiment.

**Show off v2:** See the [branch context and broader test plan](docs/show-off-v2-context.md) for the design decisions, implementation map, known execution issues, and regression cases carried into this development branch.

## Run locally

Use Node.js 22 or 24.

```sh
git clone https://github.com/eviabase44/base44-motion-blocks.git
cd base44-motion-blocks
npm ci
npm run install:browser
npm start
```

Open [the editor](http://127.0.0.1:8782). No build step is required. The browser installation is needed for URL imports; the sample editor and player can run without it.

The server binds to `127.0.0.1`. Set `PORT` to use a different local port. Open the editor through HTTP rather than opening the HTML file directly.

## What is included

- Five shot modules: opening, app reveal, card burst, feature focus, and ending.
- One retained design per card, including the fixed Base44 ending.
- A gallery under the editor, live copy/color/font controls, playback, looping, scrubbing, and frame stepping.
- Wireframe, Forma, and Atlas sample payloads.
- Public URL import, screen capture, AI-written copy, and automatic population of the retained layouts.
- Authorized preview connections for apps that require sign-in.
- JSON export and isolated shot embeds.
- A deterministic SVG player: 960 × 540, 12 fps, 180 frames.

| Shot | Duration | Content |
| --- | --- | --- |
| Opening | 3 seconds | Six hook copy groups |
| App reveal | 3 seconds | Headline, app screen, metadata |
| Card burst | 2.167 seconds | Nine cards; six image cards and three graphic cards |
| Feature focus | 3.833 seconds | Three scrolling images, feature headline |
| Ending | 3 seconds | “Proudly built on” and the official Base44 logo |

## Enable AI imports

The editor works with sample data without AI credentials. URL generation needs one of:

1. `OPENAI_API_KEY` in the server environment, with optional `OPENAI_MODEL`.
2. A locally installed Codex CLI that is already signed in using `codex login`.

The provider status appears next to the URL field. Set `MOTION_AI_PROVIDER=none` to disable the local Codex fallback. Set `CODEX_BIN` when the CLI is not on `PATH`.

Keys remain on the server. Extracted app text, labels, and brand candidates are sent to the configured AI provider. Screenshot bytes, browser cookies, and login sessions are not sent to the planner.

Paste a public website/app URL, then select **Generate video**. The importer captures the rendered page, reads its content and brand, populates the saved layouts, and plays the generated sequence. Copy, media, and motion remain editable. Login walls, anti-bot challenges, private-network addresses, and inaccessible pages require an authorized snapshot or return an error; the importer does not bypass them.

## Integrate into a product

```js
import {createMotionPlayer} from './src/player.js';

const payload = await fetch('./examples/wireframe.json').then(r => r.json());
const player = await createMotionPlayer(document.querySelector('#animation'), {
  payload,
  sequence: ['hook', 'reveal', 'collage', 'focus', 'ending'],
  variants: {
    hook: 'original',
    reveal: 'original',
    collage: 'original',
    focus: 'original',
  },
  wireframe: true,
});

player.play();
await player.update(nextAppPayload); // Keeps the selected layouts.
player.seekFrame(72);
player.destroy(); // On host unmount.
```

Give the container a 16:9 aspect ratio. See [the integration guide](docs/integration.md), [TypeScript contracts](src/types.d.ts), and [example payloads](examples/).

## Current scope

- Original v1 presets use fixed image windows. The new v2 Figma layouts contain supplied app pages and components at their source aspect ratios.
- This version animates screenshots and template elements. It does not reconstruct or record in-app interactions.
- V2 supports optional soundtrack playback on its shared sequence clock. In-app MP4 export is not implemented; the output is an editable web animation and JSON template.
- Saved preview connections are snapshots, not a live sync connection. Refresh them after changing an app.
- The local API is a development adapter. A production host must provide authentication, tenant authorization, quotas, durable asset storage, and an isolated capture worker.

## Assets and local data

Private captures, saved app connections, credentials, reference clips, and soundtrack files are excluded from this repository. New clones start with sample content.

Dazzed Semibold loads from Base44’s hosted asset URL, preserving the current typography without distributing the font binary. Network access to that asset is required; the app font is replaceable in the editor or payload. Figtree is bundled with its SIL Open Font License. Base44 marks are retained for the fixed ending. See [asset notices](NOTICE.md).

## Develop and update

```sh
git pull --ff-only
npm ci
npm test
npm start
```

Edit `src/shots/` for shot rendering, `src/variants.js` for the layout catalog, `src/studio.js` for the editor, and `backend/` for URL import and planning. The saved-card gallery sits below the editor. Old `variants.html` links redirect there. Known legacy layout selections normalize to the retained set; archived render metadata remains only for checkpoint compatibility.

After editing:

```sh
npm test
git add <changed-files>
git commit -m "Describe the change"
git push origin main
```

Use a branch and pull request when collaborating. GitHub Actions runs the Node test suite on pushes and pull requests. For browser verification, start the server, open `/tests/browser.html`, and select **Run checks**. It checks every frame across all layouts and three sample profiles, plus content updates and the fixed ending.
