# Product integration

## Modules

| Module | Responsibility |
| --- | --- |
| `src/player.js` | Playback, deterministic seeking, rendering, content and layout updates |
| `src/contracts.js` | Payload validation and frame boundaries |
| `src/types.d.ts` | Shared TypeScript payload and player API |
| `src/variants.js` | Layout catalog and URL encoding |
| `src/shots/` | Independent shot renderers |
| `src/sync.js` | Host-provided snapshot and subscription binding |
| `src/capture.js` | Selected DOM element → app snapshot |
| `backend/api.mjs` | Local generation, asset, and connection endpoints |

## Content and media

Start from an example in `examples/`. The payload contains `app`, `theme`, `typography`, `copy`, `media`, and `cards`. Each media slot has `{label, src, color?}`. Supply three entries in `media.features` and nine entries in `cards`.

Use `wireframe: true` for color blocks or `false` for images. Image URLs must be reachable by the browser. Call `preloadMedia(payload)` from `src/media.js` before applying real screens so missing images fail explicitly. The player loads the declared font and validates copy capacity before accepting updates. Use short, complete text groups; limits are enforced in `src/contracts.js`.

```js
import {preloadMedia} from './src/media.js';
await preloadMedia(result.payload);
await player.applyTemplate({
  payload: result.payload,
  variants: result.variants,
  wireframe: false,
});
```

Updates are atomic and the newest update wins. `update(payload)` retains layout choices. `applyTemplate(...)` replaces content and layouts together. Only the `original` layout is accepted for the ending.

Use absolute font/image URLs when embedding the player on another origin. The Base44 logo is resolved relative to the module assets, so distribute the `assets/` directory with the player.

## Host synchronization

```js
import {connectAppSource} from './src/sync.js';

const disconnect = await connectAppSource(player, {
  getSnapshot: () => appAdapter.getMotionPayload(),
  subscribe: onPayload => appAdapter.onMotionPayloadChanged(onPayload),
  onError: error => showPreviewError(error.message),
});
// On host unmount: disconnect(); player.destroy();
```

The product supplies `appAdapter`, access control, and subscriptions. This package does not grant access to customer apps.

## Generation API

`POST /api/generate` accepts JSON `{url}` or `{snapshot}` and returns a `GeneratedTemplate`. The response includes `payload`, `variants`, layout `reasons`, source metadata, source asset mappings, and warnings. Set `Accept: application/x-ndjson` for streamed progress/result/error events. The local server allows one generation at a time with a four-minute deadline.

`GET /api/capabilities` reports AI readiness. All credentials belong in the server environment.

## Signed-in app snapshots

Use `captureAppSnapshot(root, options)` from `src/capture.js` inside the authorized host app. The helper reads only the selected root and skips forms and `[data-motion-private]`. Choose a root containing showcase content rather than account records.

Capture pixels are supplied separately:

1. `POST /api/captures` with raw PNG/JPEG bytes, up to 8 MB.
2. Add the returned `{src,width,height,kind:"screen"}` to `snapshot.images`, with a factual label.
3. `POST /api/preview-connections` with `{url,snapshot}`.
4. Generate using that same URL.

A snapshot needs `url`, `name`, and at least 100 characters of `text`. Optional `description`, `headings`, `colors: [{value,role}]`, `fonts: [{family,src,weight}]`, and `images: [{src,label}]` improve selection. `GET /api/preview-connections?url=...` reports connection status without returning the snapshot body.

Base44 preview URLs are keyed by app ID; other connections use the normalized public URL. These records save selected content, not authentication sessions. Credentials in asset URLs are rejected. Records and captures live under ignored `.cache/` directories.

Public apps may advertise a JSON snapshot with `<link rel="base44-motion" href="/motion-snapshot.json">`.

## Export and deployment

The editor’s **Export full template** includes content, layouts, and source metadata. App-payload export includes content only. URL fragments retain local editor changes but do not bundle assets. Captures under `/api/captures/` remain local; migrate them to authorized durable storage and rewrite the URLs for deployment.

The server rejects other browser origins and listens only on localhost. Its public URL fetcher validates DNS answers and redirects, pins network addresses, and limits requests, bytes, and time. Anonymous browser captures do not use the developer’s signed-in browser. A production deployment still needs host authentication, per-tenant authorization, quotas, storage retention, and capture-worker isolation with restricted egress. Do not expose the local API directly as a public service.
