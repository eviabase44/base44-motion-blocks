# Base44 Motion Blocks

**Show off v2:** the existing editor now renders the revised Figma flow in 19 seconds: centered description and app entry, homepage scroll, feature bundle, three ranked feature pages, capability grid, and symbol-to-logo ending. Open [the v2 app](http://127.0.0.1:8782/index.html?version=2). [Layout and motion mapping](docs/figma-flow.md) · [Integration details](docs/v2-experiment.md). Feature signals remain simulated in the local test. Every cut in this Figma flow now shares a locked visual anchor. Per-shot animation controls support local saving and JSON preset import/export.

A code-based editor for personalized, 15-second app showcase videos. Five independent shots share one app payload: copy, colors, font, and screen images. Choose from **17 layouts** and keep the fixed **“Proudly built on” + Base44 logo** ending.

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
- Four layouts per content shot and one fixed ending: 17 total.
- A gallery under the editor, live copy/color/font controls, playback, looping, scrubbing, and frame stepping.
- Wireframe, Forma, and Atlas sample payloads.
- Public URL import, screen capture, AI-written copy, and AI selection from the existing layouts.
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

Paste a public website/app URL, then select **Generate video**. The importer captures the rendered page, reads its content and brand, chooses layouts, and plays the generated sequence. Copy and selections remain editable. Login walls, anti-bot challenges, private-network addresses, and inaccessible pages require an authorized snapshot or return an error; the importer does not bypass them.

## Integrate into a product

```js
import {createMotionPlayer} from './src/player.js';

const payload = await fetch('./examples/wireframe.json').then(r => r.json());
const player = await createMotionPlayer(document.querySelector('#animation'), {
  payload,
  sequence: ['hook', 'reveal', 'collage', 'focus', 'ending'],
  variants: {
    hook: 'dark-statement',
    reveal: 'screen-stage',
    collage: 'fragment-field',
    focus: 'six-week',
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

Edit `src/shots/` for shot rendering, `src/variants.js` for the layout catalog, `src/studio.js` for the editor, and `backend/` for URL import and planning. The main gallery is `variants.html`.

After editing:

```sh
npm test
git add <changed-files>
git commit -m "Describe the change"
git push origin main
```

Use a branch and pull request when collaborating. GitHub Actions runs the Node test suite on pushes and pull requests. For browser verification, start the server, open `/tests/browser.html`, and select **Run checks**. It checks every frame across all layouts and three sample profiles, plus content updates and the fixed ending.
