# GROWGO SESSION 211.12 — ATLAS TO RENDERER ZERO-DRAW HANDOFF READINESS

## Goal

Build the safe doorway between the working Atlas map diagnostic and the existing GrowGo 2.5D renderer so Atlas can prepare a future renderer handoff descriptor without waking the renderer up.

## Preflight

- branch must remain:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- Phase 211.11 commit required:
  - `test(atlas): verify attachment session boundaries and reuse`
- working tree must be clean before this phase begins
- relevant Phase 211.6 through 211.11 Atlas tests must pass before handoff work begins

## Repository Discovery

### Renderer owner

Discovered live renderer ownership remains inside:

- [`script.js`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/script.js)

Specific owner points:

- `initCustom25DMapExperiment()`
- `custom25DMapLayer`
- `ENABLE_CUSTOM_25D_MAP = false`

### Renderer consumer retention

The live renderer consumer is retained as:

- `custom25DMapLayer = { canvas, redraw }`

### Draw entry point

The live draw entry point is:

- `drawCustom25DMapCanvas(canvas)`

### Canvas / WebGL owner

Canvas ownership is inside:

- `initCustom25DMapExperiment()`

Current live behavior:

- creates a Leaflet pane:
  - `custom25DMapPane`
- creates a canvas via:
  - `L.DomUtil.create("canvas", "custom-25d-map-canvas", pane)`
- binds redraw through:
  - `map.on("moveend zoomend", redraw)`

No live WebGL ownership point was discovered in the active 2.5D map experiment path.

### Lifecycle owner

Live lifecycle remains owned by `script.js` through:

- `initCustom25DMapExperiment()`
- `drawCustom25DMapCanvas(canvas)`

### Atlas-side owner points

- live map getter:
  - `script.js` `getGrowGoMap()`
- developer namespace bootstrap:
  - `script.js` `bootstrapGrowGoDeveloperDiagnosticsForLocalDev()`
- explicit Atlas centre diagnostic:
  - [`client/developer-only-live-map-centre-atlas-bridge.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-live-map-centre-atlas-bridge.mjs)
- gated attachment controller:
  - [`client/developer-only-atlas-map-attachment-controller.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-map-attachment-controller.mjs)
- approved Bellarine package and selector seed source:
  - [`client/developer-only-atlas-browser-contract.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-browser-contract.mjs)

## Implementation

Created passive zero-draw handoff module:

- [`client/developer-only-atlas-renderer-zero-draw-handoff.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/client/developer-only-atlas-renderer-zero-draw-handoff.mjs)

This module:

- accepts an existing Atlas diagnostic
- accepts an injected renderer consumer descriptor
- validates region / package / recipe identity
- validates renderer identity against the discovered live 2.5D owner points
- produces a deeply immutable handoff descriptor
- stays fully passive by default

It does **not**:

- initialize the renderer
- attach the renderer
- call `drawFrame`
- create canvas
- create WebGL
- create DOM overlays
- add listeners
- poll
- request network
- download assets

## Handoff Result

Approved resolved diagnostics produce:

- `handoffStatus = ready_for_future_renderer_attachment`
- `reasonCode = HANDOFF_READY`

Preserved fields include:

- `regionId`
- `packageId`
- `packageVersion`
- `packageFingerprint`
- `recipeId`
- `recipeVersion`
- `environmentProfile`
- `selectorSeed`
- `coordinate`
- `approvedDeveloperOnlyScope`
- `safetyFlagSnapshot`

Blocked outcomes include:

- `REGION_OUT_OF_SCOPE`
- `INVALID_DIAGNOSTIC`
- `PACKAGE_IDENTITY_MISMATCH`
- `RECIPE_IDENTITY_MISMATCH`
- `RENDERER_CONSUMER_UNAVAILABLE`
- `RENDERER_IDENTITY_MISMATCH`

## Design Choice

No live browser exposure was added in this phase.

Reason:

- the renderer’s real ownership remains internal to `script.js`
- there is no already-exported passive renderer identity contract to hook into safely
- avoiding `script.js` changes keeps the live application passive

The handoff module still includes an optional installer for future developer-only namespace exposure if a later phase explicitly chooses to add that.

## Canonical Safety Truth

Canonical safety flags remain exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Outcome

- renderer initialized:
  - `no`
- renderer attached:
  - `no`
- draw called:
  - `no`
- canvas created:
  - `no`
- WebGL created:
  - `no`
- overlay created:
  - `no`
- network requested:
  - `no`
- automatic startup invocation:
  - `no`
- overall phase:
  - `PASS`
