Phase 211.45 — Developer-Only Live One-Frame Adapter Implementation Review

Status: PASS

Date:
- Sunday, August 2, 2026

Branch:
- exact branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
- initial git status:
  - clean
- final git status:
  - `?? GROWGO_SESSION_211_45_DEVELOPER_ONLY_LIVE_ONE_FRAME_ADAPTER_IMPLEMENTATION_REVIEW.md`
  - `?? tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`

Checkpoint:
- Phase 211.44 verification method:
  - exact commit title
- verified commit:
  - `765cda0 feat(atlas): add gated live one-frame integration contract`
- confirmed present:
  - `client/developer-only-atlas-custom25d-gated-live-one-frame-integration-contract.mjs`
  - `tests/client-developer-only-atlas-custom25d-gated-live-one-frame-integration-contract.test.mjs`
  - `GROWGO_SESSION_211_44_GATED_LIVE_ONE_FRAME_INTEGRATION_CONTRACT.md`
- accepted Phase 211.44 classification:
  - `GATED_LIVE_ONE_FRAME_INTEGRATION_CONTRACT_READY`
- whether history remained unchanged:
  - yes

Preflight regression band:
- focused Phase 211.18–211.44 band:
  - passed: `196`
  - failed: `0`

Reviewed sources:
- `client/developer-only-atlas-custom25d-gated-live-one-frame-integration-contract.mjs`
- `client/growgo-custom25d-live-one-frame-surface-operations.mjs`
- `client/growgo-custom25d-live-one-frame-draw-operation.mjs`
- `client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs`
- `client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs`
- `client/developer-only-live-atlas-renderer-handoff-readiness.mjs`
- `client/developer-only-atlas-renderer-handoff-authorization.mjs`
- `client/development-alpha-app.mjs`
- `script.js`

ELI5:
- We already have the safe fake-only control flow, and the real map/canvas cleanup pieces are close enough to plug in.
- The part still too tangled is the real draw function, because it still builds its own frame snapshot inside `script.js` instead of accepting one from the gated adapter.
- So the next step is not a big rewrite; it is one tiny classic-script bridge plus one narrow draw extraction around the snapshot boundary.

Real dependency providers:
- live map provider:
  - `globalThis.GrowGoDeveloperDiagnostics.getGrowGoMap()`
  - current owner:
    - `script.js` bootstrap
  - development-alpha access already present:
    - yes
  - compatibility:
    - `COMPATIBLE_AS_IS`
- Leaflet provider:
  - `globalThis.L`
  - required functions:
    - `L.DomUtil.create`
    - `L.DomUtil.setPosition`
  - compatibility:
    - `COMPATIBLE_AS_IS`
- device pixel ratio provider:
  - `window.devicePixelRatio`
  - current ownership:
    - `script.js` frame snapshot and draw path
  - compatibility for adapter injection:
    - `COMPATIBLE_AS_IS`
- draw-function provider:
  - current real draw function:
    - `drawCustom25DMapCanvas(canvas)`
  - current visibility:
    - private inside `script.js`
  - safest future exposure:
    - narrow developer-only bridge that returns a one-shot injected draw capability rather than exposing initializer ownership
  - compatibility:
    - `REQUIRES_NARROW_SCRIPT_BRIDGE`
- lifecycle operations for cleanup:
  - Canvas removal:
    - `canvas.remove()` or pane `removeChild(canvas)` through lifecycle owner helpers
  - pane cleanup:
    - remove only if pane was created by the one-frame operation and is empty
  - compatibility:
    - `COMPATIBLE_AS_IS`
- frame snapshot function:
  - current source:
    - `createCustom25DFrameViewportSnapshot({ map, canvas })`
  - current owner:
    - `script.js`
  - compatibility:
    - `REQUIRES_SOURCE_EXTRACTION`

Classic-script/module boundary:
- `script.js` remains a classic script:
  - confirmed
- client modules remain ES modules:
  - confirmed
- can `development-alpha-app.mjs` receive narrow function references exposed by `script.js`:
  - yes
  - it already safely receives `getGrowGoMap()` through `GrowGoDeveloperDiagnostics`
- is a tiny developer-only bridge required:
  - yes
  - specifically for the real draw capability
- would dynamic import alter draw order or timing:
  - it would add unnecessary runtime coupling
- should dynamic import occur inside the draw execution path:
  - no

Draw-function exposure review:
- `drawCustom25DMapCanvas(canvas)` is private today:
  - yes
- safest future exposure shape:
  - a developer-only bridge on `GrowGoDeveloperDiagnostics`
  - preferred form:
    - narrow getter returning an injected one-shot draw reference
  - must not expose:
    - `initCustom25DMapExperiment()`
    - mutable `custom25DMapLayer`
    - direct authorization consumption
- proposed exact future browser command name:
  - `runAtlasRendererHandoffLiveOneFrameAttempt`
- current exposure state:
  - not present

Surface operation compatibility:
- real map satisfies one-frame surface-operation contract:
  - yes
  - required methods already exist:
    - `getPane`
    - `createPane`
    - `getSize`
    - `getBounds`
    - `latLngToLayerPoint`
- Leaflet `DomUtil.create` compatibility:
  - yes
- Leaflet `DomUtil.setPosition` compatibility:
  - yes
- pane lookup/create/remove behavior:
  - compatible with the current one-frame surface contract
- Canvas removal behavior:
  - compatible with lifecycle-owner disposal contract
- listener needed for one-frame mode:
  - no

Frame snapshot compatibility:
- centralized frame-root snapshot remains active:
  - yes
- current real draw path behavior:
  - `drawCustom25DMapCanvas(canvas)` creates the snapshot internally
  - then repositions and resizes the Canvas
- should the future adapter call `drawCustom25DMapCanvas(canvas)` directly:
  - not if the gated sequence must keep explicit external frame snapshot creation
- should the adapter create a snapshot first and pass it into a narrower draw function:
  - yes
- duplicate sizing or positioning risk if direct draw invocation is used:
  - yes
  - the current draw path would recreate the snapshot and rerun positioning/sizing
- smallest safe extraction:
  - extract a narrow snapshot-aware draw entry that accepts:
    - `canvas`
    - `frameViewportSnapshot`
  - keep helper fanout and layer order unchanged

Cleanup compatibility:
- `ONE_FRAME_SURFACE_ONLY` lifecycle mode can remove the exact Canvas:
  - yes
- pane cleanup rule:
  - remove only if the pane was created by the one-frame operation and is empty after Canvas removal
- listener removal obligation:
  - none in one-frame mode
- retention reset obligation:
  - none in one-frame mode
- cleanup after success, failure, and exception:
  - yes
  - pre-registration failures use surface rollback
  - post-registration terminal paths use lifecycle-owner cleanup
- cleanup idempotence:
  - yes

Authorization and exposure boundary:
- existing authorization interface that remains unchanged:
  - `authorizeAtlasRendererHandoffSession(...)`
  - `revokeAtlasRendererHandoffSession()`
  - `getAtlasRendererHandoffAuthorizationStatus()`
- internal authorization consumption seam remains unexposed:
  - yes
  - `consumeAuthorizedRendererHandoffAttempt()` exists only inside the module object, not on the installed browser namespace
- activation requirements confirmed:
  - valid readiness
  - valid one-session authorization
  - exact confirmation phrase:
    - `AUTHORIZE_ATLAS_RENDERER_HANDOFF_ONE_SESSION`
  - explicit developer invocation
- no startup or `moveend` activation:
  - confirmed

Safety and rollback:
- map unavailable:
  - blocked before surface preparation
- pane creation fails:
  - fail closed
- Canvas creation fails:
  - fail closed
- frame snapshot fails:
  - currently returns blocked from `drawCustom25DMapCanvas(canvas)`
  - future adapter should map this to permanent closed failure after ownership rules are applied
- draw throws:
  - fail closed
- Canvas removal fails:
  - cleanup failure reported precisely, references still released
- pane removal fails:
  - cleanup failure reported precisely
- every reviewed path should end permanently closed in the future adapter:
  - yes

Wiring matrix:

| stage | real owner | exact function/interface | input | output | side effects | ownership acquired | cleanup obligation | failure result | exposure status | compatibility classification |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| readiness | module | `getAtlasRendererHandoffReadiness()` | current atlas diagnostic + discovered renderer descriptor | readiness result | none | none | none | blocked readiness result | installed on `GrowGoDeveloperDiagnostics` | `COMPATIBLE_AS_IS` |
| authorization read | module | `getAtlasRendererHandoffAuthorizationStatus()` | none | authorization status | none | none | none | blocked authorization result | installed on `GrowGoDeveloperDiagnostics` | `COMPATIBLE_AS_IS` |
| authorization consume | module internal only | `consumeAuthorizedRendererHandoffAttempt()` | validated active session | consumed authorization result | session state latch | one-session consume right | none | blocked or failed-closed | not browser-exposed | `COMPATIBLE_AS_IS` |
| live map provider | classic-script bootstrap | `getGrowGoMap()` via `GrowGoDeveloperDiagnostics` | none | Leaflet map or `null` | none | none | none | null map blocks | browser-exposed getter | `COMPATIBLE_AS_IS` |
| Leaflet provider | browser global | `globalThis.L` | none | `DomUtil` helpers | none | none | none | missing global blocks | implicit browser global | `COMPATIBLE_AS_IS` |
| surface preparation | module | `prepareOneFrameSurface({ map })` | real map + Leaflet provider + DPR provider | prepared surface bundle | may create pane/canvas and position canvas | exact pane/canvas one-frame surface ownership | rollback before registration | failed-closed with rollback | not browser-exposed | `COMPATIBLE_AS_IS` |
| lifecycle translation | module | `translatePreparedSurfaceToLifecycleBundle(...)` | prepared surface + lifecycle owner | one-frame ownership bundle | registration into lifecycle owner | canvas ownership and conditional pane ownership | lifecycle-owner cleanup | failed-closed with rollback before registration | not browser-exposed | `COMPATIBLE_AS_IS` |
| lifecycle owner | module | `registerOwnedResources(...)` / `disposeOwnedResources()` | translated ownership bundle | lifecycle status/result | removes canvas and maybe pane | exact post-registration cleanup ownership | dispose once, idempotent | failed-closed cleanup record | not browser-exposed | `COMPATIBLE_AS_IS` |
| frame snapshot | classic-script draw path | `createCustom25DFrameViewportSnapshot({ map, canvas })` | real map + canvas | frame snapshot | reads map bounds, zoom, DPR; no listener changes | none | none | snapshot failure blocks draw | private inside `script.js` | `REQUIRES_SOURCE_EXTRACTION` |
| draw-function provider | classic script | `drawCustom25DMapCanvas(canvas)` | canvas only | one frame draw result | snapshot creation, position/size mutation, helper fanout | none | none directly; caller still owns lifecycle cleanup | blocked/fail-closed draw result | private inside `script.js` | `REQUIRES_NARROW_SCRIPT_BRIDGE` |
| one-frame draw | future narrow extracted draw layer | snapshot-aware draw entry | canvas + `frameViewportSnapshot` | one completed frame | canvas mutation + helper fanout | none | lifecycle cleanup after return | fail closed | not implemented | `REQUIRES_SOURCE_EXTRACTION` |
| browser command boundary | future developer-only namespace bridge | proposed `runAtlasRendererHandoffLiveOneFrameAttempt` | explicit developer call | one-shot attempt result | none by itself | none | none | blocked when unauthorized/unready | not present | `BLOCKED_BY_CLASSIC_SCRIPT_BRIDGE` |

Compatibility summary:
- compatible stages:
  - readiness
  - authorization read
  - authorization internal consume seam
  - live map provider
  - Leaflet provider
  - one-frame surface preparation
  - lifecycle translation
  - lifecycle-owner cleanup
- required bridge:
  - one tiny classic-script developer-only bridge for the real draw capability
- required adapters:
  - none beyond the existing gated integration contract
- required source extraction:
  - narrow snapshot-aware draw entry extracted from `drawCustom25DMapCanvas(canvas)`
- blockers:
  - explicit frame snapshot step is still coupled inside the private draw function
  - direct draw invocation would duplicate snapshot creation and Canvas sizing/positioning

Required source-lock tests added:
- `tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`

What the new review test proves:
- Phase 211.44 integration contract remains disconnected
- no live activation browser command exists
- no live authorization consumption seam is exposed
- `drawCustom25DMapCanvas` remains private
- `initCustom25DMapExperiment` remains unchanged
- `custom25DMapLayer` ownership remains unchanged
- centralized frame-root snapshot remains active
- all five layer migrations remain active
- live surface operations remain disconnected
- lifecycle translation remains disconnected
- `ONE_FRAME_SURFACE_ONLY` lifecycle mode remains available
- no startup or `moveend` activation exists
- all four canonical flags remain false

Tests:
- focused Phase 211.18–211.44 regression band:
  - passed: `196`
  - failed: `0`
- new Phase 211.45 review suite:
  - passed: `8`
  - failed: `0`

Files changed:
- `tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs`
- `GROWGO_SESSION_211_45_DEVELOPER_ONLY_LIVE_ONE_FRAME_ADAPTER_IMPLEMENTATION_REVIEW.md`

Required closeout classification:
- `BLOCKED_BY_FRAME_SNAPSHOT_COUPLING`

Why this classification is correct:
- the real map provider, Leaflet provider, one-frame surface preparation, lifecycle translation, and cleanup owner are already compatible
- the remaining unsafe seam is the real draw path because it still privately owns frame snapshot creation, sizing, and positioning inside `drawCustom25DMapCanvas(canvas)`
- a tiny classic-script bridge alone is not enough to preserve the exact gated integration sequence without duplicate snapshot work
- the smallest safe next change is a narrow source extraction that accepts an externally created frame snapshot while preserving current layer fanout and draw order
