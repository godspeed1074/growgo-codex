# GROWGO Session 211.47 — Developer-Only Live One-Frame Adapter Implementation

Date: August 2, 2026
Branch: `feature/atlas-phase-211-6-gated-map-attachment-controller`
Phase: `211.47 — Developer-Only Live One-Frame Adapter Implementation`

## Outcome

Status: PASS

Exact closeout classification:

`LIVE_ONE_FRAME_ADAPTER_READY_FOR_MANUAL_GATING`

## Checkpoint acceptance

Phase 211.46 was accepted by verified contents without history rewriting:

- snapshot-aware draw extraction present in `script.js`
- `tests/client-growgo-custom25d-snapshot-aware-draw-seam.test.mjs` present
- updated frame-root snapshot coverage present
- updated implementation review coverage present
- `GROWGO_SESSION_211_46_SNAPSHOT_AWARE_CUSTOM25D_DRAW_SEAM_EXTRACTION.md` present

## What was implemented

Implemented the smallest real developer-only adapter that connects the proven gated integration shape to:

- the existing developer-only map getter
- one-frame surface preparation
- one-frame lifecycle translation
- lifecycle ownership registration
- frame snapshot creation through a narrow classic-script bridge
- snapshot-aware one-frame draw through a narrow classic-script bridge
- exact one-shot cleanup and permanent closure

Created:

- `client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs`
- `tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs`
- `GROWGO_SESSION_211_47_DEVELOPER_ONLY_LIVE_ONE_FRAME_ADAPTER_IMPLEMENTATION.md`

Updated:

- `script.js`
- `tests/client-developer-only-live-map-centre-atlas-bridge.test.mjs`

## Narrow classic-script bridge

`script.js` now exposes only the minimum developer-diagnostics bridge needed by the adapter:

- `GrowGoDeveloperDiagnostics.getCustom25DOneFrameBridge()`
- `createCustom25DFrameViewportSnapshotForOneFrame({ map, canvas })`
- `drawCustom25DOneFrameFromSnapshot({ canvas, frameViewportSnapshot })`

Bridge guarantees preserved:

- developer-diagnostics namespace only
- explicit-only access
- no startup invocation
- no moveend invocation
- no listener registration
- no Canvas creation on exposure
- no draw on exposure
- no mutable renderer ownership exposure
- no activation command exposure

## Adapter behavior

The adapter:

- performs no live reads during module import or construction
- validates required providers and capabilities
- obtains the live map only when explicitly executed
- prepares exactly one one-frame surface
- translates and registers lifecycle ownership in `ONE_FRAME_SURFACE_ONLY` mode
- creates exactly one frame snapshot
- invokes the snapshot-aware draw seam exactly once
- cleans up exactly once
- releases references
- permanently closes
- blocks second use

## Safety confirmation

The canonical safety flags remained exactly:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Also preserved:

- no Safari/browser activation command exposure
- no startup wiring
- no moveend or zoomend adapter wiring
- no session-coordinator integration
- no lifecycle-owner contract broadening
- no real frame execution in this phase

## Validation

Focused verification:

- `node --test tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs tests/client-developer-only-live-one-frame-adapter-implementation-review.test.mjs tests/client-developer-only-live-map-centre-atlas-bridge.test.mjs`
- result: 26 passed, 0 failed

Focused Phase 211.18–211.47 regression band:

- filtered client atlas/custom25d/renderer-handoff/live-one-frame suite
- result: 333 passed, 0 failed

## Notes on test adjustments

Two narrow test updates were required during this phase:

- the new adapter test helper was corrected so “missing provider” and “missing bridge function” cases do not accidentally fall back to default providers
- the live-map-centre bridge regression test was narrowed to allow explicit development-alpha diagnostic reads while still forbidding automatic listeners, renderer activation, and network side effects

## Files changed

- `script.js`
- `client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs`
- `tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs`
- `tests/client-developer-only-live-map-centre-atlas-bridge.test.mjs`

## Not changed

Confirmed unchanged in this phase:

- renderer authorization/readiness rules
- gated integration contract
- session coordinator
- lifecycle owner model
- live surface operations
- live draw operation module
- active layer helper modules
- `client/development-alpha-app.mjs`

## Next smallest safe phase

Manual-gated execution verification against the real page can proceed next, using the adapter only through a future explicit developer-only gate.
