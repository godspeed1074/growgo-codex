# GROWGO SESSION 211.58 — PERSISTENT LIVE-ADAPTER REAL-SEAM MAPPING REVIEW

## Goal

Map every injected seam accepted by `client/developer-only-controlled-persistent-atlas-live-adapter.mjs` to the exact current GrowGo runtime source it would eventually need to wrap.

This phase is review-only:

- no live adapter instance created
- no persistent controller connected to live seams
- no `window` exposure
- no Canvas creation
- no listener registration
- no `requestAnimationFrame` scheduling
- no renderer invocation
- no startup behavior changes

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- phase 211.57 prerequisite status:
  - source present locally and reviewed
- current seam under review:
  - `client/developer-only-controlled-persistent-atlas-live-adapter.mjs`

## Allowed Compatibility Classifications

- `DIRECTLY_REUSABLE`
- `REUSABLE_WITH_NARROW_WRAPPER`
- `REQUIRES_NEW_PERSISTENT_CONTRACT`
- `BLOCKED_BY_CLEANUP_GAP`
- `BLOCKED_BY_IDENTITY_GAP`
- `BLOCKED_BY_AUTHORIZATION_GAP`
- `BLOCKED_BY_SCHEDULER_GAP`
- `NOT_READY`

## Real-Seam Mapping Matrix

| seam | real source | classification | wrapper required | live behavior active now | blocker | smallest next step | target phase |
|---|---|---|---|---|---|---|---|
| rawMapProvider | `script.js:getGrowGoMap`, `script.js:getCustom25DOneFrameBridge`, `script.js:createFrozenCustom25DOneFrameBridge`, `client/development-alpha-app.mjs` captured raw bridge reference | `REUSABLE_WITH_NARROW_WRAPPER` | yes | one-frame bridge bootstrap only | stable raw map exists, but direct access still depends on diagnostics/bootstrap timing | extract a dedicated persistent raw-map wrapper from the stable bridge contract without public diagnostics fallback | `211.59` |
| readinessProvider | `client/developer-only-live-atlas-renderer-handoff-readiness.mjs:getAtlasRendererHandoffReadiness` | `REUSABLE_WITH_NARROW_WRAPPER` | yes | one-frame readiness diagnostics active | result shape is rich enough, but persistent redraws need normalized identity snapshot + redraw-time revalidation rules | normalize readiness fields into a persistent-ready snapshot contract | `211.59` |
| authorizationStatusProvider | `client/developer-only-atlas-renderer-handoff-authorization.mjs` authorization status/consume/invalidation path | `BLOCKED_BY_AUTHORIZATION_GAP` | yes | one-frame one-session authorization active | current contract is consume-once for renderer handoff, not retained persistent attach ownership | design a separate persistent authorization status contract that reuses drift logic but never silently consumes one-frame auth | `211.60` |
| identitySnapshotProvider | readiness result + bridge identity + controller identity keys in `client/developer-only-controlled-persistent-atlas-controller.mjs` | `REUSABLE_WITH_NARROW_WRAPPER` | yes | identity exists across readiness/authorization/controller | authoritative source is split across readiness and auth snapshots | define one authoritative persistent identity snapshot and one drift comparator | `211.59` |
| retainedSurfaceProvider | `client/growgo-custom25d-live-one-frame-surface-operations.mjs:prepareOneFrameSurface` | `BLOCKED_BY_CLEANUP_GAP` | yes | one-frame passive surface preparation only | current surface bundle is explicitly cleanup-required and rollback-oriented | define retained surface wrapper with create-once / draw-many / remove-on-detach semantics | `211.60` |
| retainedLifecycleOwnerProvider | `client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs`, `client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs` | `REQUIRES_NEW_PERSISTENT_CONTRACT` | yes | one-frame lifecycle registration active in isolated path | current ownership mode is `ONE_FRAME_SURFACE_ONLY` and cleanup-on-completion | extend lifecycle ownership modes for retained redraw ownership without duplicating owners | `211.60` |
| frameSnapshotProvider | `script.js:createCustom25DFrameViewportSnapshotForOneFrame`, private snapshot implementation, map normalization path | `REUSABLE_WITH_NARROW_WRAPPER` | yes | fresh one-frame snapshot creation active | snapshot contract is safe only when generated fresh and immediately used | wrap fresh-per-redraw snapshot creation with redraw-time identity validation | `211.59` |
| frameDrawProvider | `script.js:drawCustom25DOneFrameFromSnapshot`, `script.js:drawCustom25DMapCanvasWithFrameSnapshot`, readonly Leaflet position fallback | `REUSABLE_WITH_NARROW_WRAPPER` | yes | one-frame draw active | draw seam is proven only for non-reentrant one-frame use | wrap draw with retained-canvas ownership and explicit non-reentrant redraw scheduling | `211.60` |
| animationFrameScheduler | `client/development-alpha-app.mjs` one-frame animation-frame provider into `client/developer-only-atlas-custom25d-one-frame-command.mjs` | `BLOCKED_BY_SCHEDULER_GAP` | yes | one-frame scheduling active | current seam schedules a single one-frame command, not a retained redraw queue | define one-queued-frame persistent scheduler wrapper with stale-callback guard | `211.60` |
| animationFrameCanceller | controller fake contract + current one-frame command cleanup expectations | `BLOCKED_BY_SCHEDULER_GAP` | yes | no explicit persistent canceller seam yet | existing live path proves one-frame completion, not retained queued-frame cancellation ownership | extract cancellable frame-handle contract before live attachment | `211.60` |
| approvedListenerRegistrar | Leaflet `map.on()`, `script.js:map.on("moveend zoomend", redraw)`, `client/developer-only-atlas-map-attachment-controller.mjs` listener ownership ideas | `BLOCKED_BY_SCHEDULER_GAP` | yes | existing live renderer registers `moveend zoomend` directly | current live listener seam is bundled in startup renderer init and omits `resize` | define exact persistent listener registrar wrapper with whitelist and rollback | `211.60` |
| approvedListenerRemover | Leaflet `map.off()`, stored callback identity requirements, lifecycle cleanup path | `BLOCKED_BY_CLEANUP_GAP` | yes | one-frame/lifecycle cleanup removes owned listeners | no retained listener removal wrapper with exact registration identity has been extracted | define idempotent exact-removal wrapper with cleanup failure collection | `211.60` |
| retainedCleanupProvider | one-frame cleanup in controller + `disposeOwnedResources()` + Phase 211.56 retained-resource cleanup order | `BLOCKED_BY_CLEANUP_GAP` | yes | one-frame cleanup proven; fake retained cleanup proven | live retained cleanup helper does not yet exist | map the retained cleanup order onto real helper candidates without invoking startup or renderer | `211.60` |

## Seam Review Details

### rawMapProvider seam

- exact real function/module candidate:
  - `script.js:getGrowGoMap`
  - `script.js:getCustom25DOneFrameBridge`
  - `script.js:createFrozenCustom25DOneFrameBridge`
  - `client/development-alpha-app.mjs` captured `rawLeafletMapReferenceFromBridge`
- persistent contract requirement:
  - stable raw Leaflet map object
  - stale-map detection
  - no diagnostics fallback at runtime
- compatibility result:
  - `REUSABLE_WITH_NARROW_WRAPPER`
- smallest safe wrapper required:
  - a persistent raw-map seam that reads the frozen bridge reference once and rejects map replacement
- identity risk:
  - stale raw-map reference if the live map is recreated after bootstrap
- ownership risk:
  - low, because the map is not owned by Atlas
- cleanup risk:
  - low direct cleanup risk, but stale reference can poison later cleanup routing
- Safari-specific risk:
  - bridge exposure order and cache freshness were previously critical
- supporting tests:
  - `tests/client-growgo-map-getter.test.mjs`
  - `tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs`
- missing tests:
  - persistent raw-map replacement drift tests
- recommended next implementation phase:
  - `211.59`

### readinessProvider seam

- exact real function/module candidate:
  - `client/developer-only-live-atlas-renderer-handoff-readiness.mjs:getAtlasRendererHandoffReadiness`
- persistent contract requirement:
  - approved identity snapshot
  - blocked reason codes
  - redraw-time revalidation
- compatibility result:
  - `REUSABLE_WITH_NARROW_WRAPPER`
- smallest safe wrapper required:
  - normalize `resolvedRegion`, `resolvedPackage`, `resolvedRecipe`, `packageFingerprint`, and `selectorSeed` into a persistent-ready snapshot
- identity risk:
  - readiness can drift between redraws if only read once
- ownership risk:
  - none direct
- cleanup risk:
  - indirect drift can force cleanup
- Safari-specific risk:
  - readiness namespace exists on diagnostics today, so live persistent wiring must avoid stale namespace capture
- supporting tests:
  - one-frame readiness tests
  - Safari handoff evidence chain
- missing tests:
  - redraw-time readiness drift invalidation tests
- recommended next implementation phase:
  - `211.59`

### authorizationStatusProvider seam

- exact real function/module candidate:
  - `client/developer-only-atlas-renderer-handoff-authorization.mjs`
  - current authorize/status/consume/invalidate semantics
- persistent contract requirement:
  - persistent developer session authorization status
  - no silent one-frame authorization reuse
  - explicit invalidation on drift
- explicit persistent rule:
  - one-frame authorization must not be silently reused as persistent authorization
- compatibility result:
  - `BLOCKED_BY_AUTHORIZATION_GAP`
- smallest safe wrapper required:
  - none yet; requires a separate persistent authorization contract
- identity risk:
  - very high if consume-once renderer handoff authorization is reused for multi-redraw ownership
- ownership risk:
  - medium; persistent attachment needs its own session lifecycle
- cleanup risk:
  - medium; detach and revoke boundaries are not yet defined
- Safari-specific risk:
  - prior manual Safari verification depended on one-frame gating only
- supporting tests:
  - one-frame authorization tests
- missing tests:
  - persistent auth status, revoke, and drift invalidation tests
- recommended next implementation phase:
  - `211.60`

### identitySnapshotProvider seam

- exact real function/module candidate:
  - readiness result from `getAtlasRendererHandoffReadiness`
  - bridge-bound map identity
  - identity keys in `client/developer-only-controlled-persistent-atlas-controller.mjs`
- persistent contract requirement:
  - immutable serializable map/region/package/recipe/session identity
- compatibility result:
  - `REUSABLE_WITH_NARROW_WRAPPER`
- smallest safe wrapper required:
  - one authoritative identity normalizer using:
    - `mapIdentity`
    - `regionId`
    - `packageId`
    - `packageVersion`
    - `packageFingerprint`
    - `recipeId`
    - `recipeVersion`
    - `selectorSeed`
    - `sessionId`
- identity risk:
  - medium; today the source is split between readiness and authorization
- ownership risk:
  - low direct ownership risk
- cleanup risk:
  - drift must trigger cleanup before redraw
- Safari-specific risk:
  - stale module capture can preserve old identity readers
- supporting tests:
  - controller identity tests
  - one-frame integration contract identity comparisons
- missing tests:
  - authoritative identity-source lock tests
- recommended next implementation phase:
  - `211.59`

### retainedSurfaceProvider seam

- exact real function/module candidate:
  - `client/growgo-custom25d-live-one-frame-surface-operations.mjs:prepareOneFrameSurface`
- persistent contract requirement:
  - one retained pane and Canvas reused across redraws
- compatibility result:
  - `BLOCKED_BY_CLEANUP_GAP`
- smallest safe wrapper required:
  - retained surface wrapper separating:
    - create once
    - reuse on redraw
    - detach cleanup
- identity risk:
  - medium if surface is reused after map or identity drift
- ownership risk:
  - high; current seam owns a one-frame Canvas and possible pane creation
- cleanup risk:
  - high; current surface assumes rollback and mandatory cleanup
- Safari-specific risk:
  - readonly Canvas mutation issues make retained Canvas ownership sensitive
- supporting tests:
  - surface operations tests
  - retained-resource fake contract tests
- missing tests:
  - retained same-canvas multi-redraw wrapper tests
- recommended next implementation phase:
  - `211.60`

### retainedLifecycleOwnerProvider seam

- exact real function/module candidate:
  - `client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs`
  - `client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs`
- persistent contract requirement:
  - one authoritative owner retained across redraws
- compatibility result:
  - `REQUIRES_NEW_PERSISTENT_CONTRACT`
- smallest safe wrapper required:
  - not a wrapper first; lifecycle mode extension is required before wrappering
- identity risk:
  - medium if owner is not bound to stable identity
- ownership risk:
  - very high; current lifecycle mode is `ONE_FRAME_SURFACE_ONLY`
- cleanup risk:
  - high if duplicate owners appear or ownership is replaced while attached
- Safari-specific risk:
  - cycle-safe deep freeze is already necessary and must be preserved
- supporting tests:
  - lifecycle owner tests
  - lifecycle translation tests
- missing tests:
  - retained lifecycle-owner mode tests
- recommended next implementation phase:
  - `211.60`

### frameSnapshotProvider seam

- exact real function/module candidate:
  - `script.js:createCustom25DFrameViewportSnapshotForOneFrame`
  - private snapshot implementation
- persistent contract requirement:
  - one fresh immutable snapshot per redraw
- compatibility result:
  - `REUSABLE_WITH_NARROW_WRAPPER`
- smallest safe wrapper required:
  - redraw-time identity validation wrapper feeding fresh map + canvas into the snapshot creator
- identity risk:
  - stale snapshot if reused across redraws
- ownership risk:
  - low direct ownership risk
- cleanup risk:
  - medium if snapshot references survive detach
- Safari-specific risk:
  - snapshot recursion history means public-bridge fallbacks must stay forbidden
- supporting tests:
  - one-frame adapter tests
  - snapshot handoff/boundary traces
- missing tests:
  - persistent fresh-snapshot-per-redraw source-lock tests
- recommended next implementation phase:
  - `211.59`

### frameDrawProvider seam

- exact real function/module candidate:
  - `script.js:drawCustom25DOneFrameFromSnapshot`
  - `script.js:drawCustom25DMapCanvasWithFrameSnapshot`
  - readonly Leaflet position fallback in `applyCustom25DCanvasPositionWithLeafletFallback`
- persistent contract requirement:
  - repeated draw on retained Canvas
- compatibility result:
  - `REUSABLE_WITH_NARROW_WRAPPER`
- smallest safe wrapper required:
  - non-reentrant retained draw wrapper with explicit mutable runtime state boundary
- identity risk:
  - medium if draw runs with stale snapshot or stale map
- ownership risk:
  - medium; retained Canvas ownership changes the draw cadence
- cleanup risk:
  - medium; draw state must not outlive detach
- Safari-specific risk:
  - readonly `_leaflet_pos` fallback and mutable snapshot-position copy must be preserved exactly
- supporting tests:
  - draw seam tests
  - live one-frame adapter tests
- missing tests:
  - retained repeated-draw non-reentrancy tests
- recommended next implementation phase:
  - `211.60`

### animationFrameScheduler seam

- exact real function/module candidate:
  - `client/development-alpha-app.mjs` one-frame animation-frame provider passed into the one-frame command
- persistent contract requirement:
  - exactly one queued browser frame
- compatibility result:
  - `BLOCKED_BY_SCHEDULER_GAP`
- smallest safe wrapper required:
  - one-queued-frame scheduler wrapper with generation token + stale callback guard
- identity risk:
  - stale queued frame can draw after detach or identity drift
- ownership risk:
  - medium; scheduler becomes part of retained resource ownership
- cleanup risk:
  - high if queued frame is not cancelled during detach
- Safari-specific risk:
  - manual Safari verification proved one-frame scheduling only, not retained queued redraw ownership
- supporting tests:
  - one-frame command tests
  - retained-resource fake scheduler tests
- missing tests:
  - live scheduler wrapper cancellation and stale-callback tests
- recommended next implementation phase:
  - `211.60`

### animationFrameCanceller seam

- exact real function/module candidate:
  - no extracted live persistent canceller seam yet
  - current expectations come from fake retained-resource contract and controller scheduler interface
- persistent contract requirement:
  - cancel one queued frame safely
- compatibility result:
  - `BLOCKED_BY_SCHEDULER_GAP`
- smallest safe wrapper required:
  - explicit cancellable frame-handle contract extracted beside the scheduler wrapper
- identity risk:
  - stale callback after detach if cancel path is missing
- ownership risk:
  - medium; handle ownership must be exact
- cleanup risk:
  - high; detach ordering depends on cancellation first
- Safari-specific risk:
  - browser delivery timing can conceal stale callbacks if cancellation is not exact
- supporting tests:
  - retained-resource fake contract tests
- missing tests:
  - real-seam canceller extraction tests
- recommended next implementation phase:
  - `211.60`

### approvedListenerRegistrar seam

- exact real function/module candidate:
  - Leaflet `map.on()`
  - current bundled registration in `script.js:map.on("moveend zoomend", redraw)`
  - listener ownership ideas in `client/developer-only-atlas-map-attachment-controller.mjs`
- persistent contract requirement:
  - exactly one listener each for `moveend`, `zoomend`, and `resize`
- compatibility result:
  - `BLOCKED_BY_SCHEDULER_GAP`
- smallest safe wrapper required:
  - exact whitelist registrar with callback identity storage and rollback on partial registration
- identity risk:
  - map replacement can orphan listeners
- ownership risk:
  - high; duplicate listeners will cause redraw storms
- cleanup risk:
  - high if partial registration cannot be rolled back
- Safari-specific risk:
  - none unique, but stale module delivery could preserve old callback wrappers
- supporting tests:
  - attachment controller tests
  - retained-resource fake listener tests
- missing tests:
  - live listener registrar wrapper tests including `resize`
- recommended next implementation phase:
  - `211.60`

### approvedListenerRemover seam

- exact real function/module candidate:
  - Leaflet `map.off()`
  - exact callback identity required by current runtime listener model
- persistent contract requirement:
  - exact removal of registered listeners
- compatibility result:
  - `BLOCKED_BY_CLEANUP_GAP`
- smallest safe wrapper required:
  - idempotent listener remover preserving exact stored registration identities
- identity risk:
  - medium if map identity drifts before removal
- ownership risk:
  - high if wrong callback identity leaves live listeners behind
- cleanup risk:
  - high; partial removal failure must be reported, not hidden
- Safari-specific risk:
  - low direct risk
- supporting tests:
  - lifecycle owner cleanup tests
  - retained-resource fake cleanup tests
- missing tests:
  - exact removal and repeated-removal tests for live seam wrappers
- recommended next implementation phase:
  - `211.60`

### retainedCleanupProvider seam

- exact real function/module candidate:
  - one-frame controller cleanup path
  - `disposeOwnedResources()` in lifecycle owner
  - Phase 211.56 retained-resource fake cleanup order
- persistent contract requirement:
  - deterministic release of scheduler, listeners, Canvas, pane, lifecycle owner, and references
- compatibility result:
  - `BLOCKED_BY_CLEANUP_GAP`
- smallest safe wrapper required:
  - retained cleanup orchestrator that applies the proven Phase 211.56 order to real helper candidates
- identity risk:
  - medium; cleanup must reject stale ownership
- ownership risk:
  - high; detach must release exactly one retained surface and owner
- cleanup risk:
  - very high; this is the main remaining blocker
- Safari-specific risk:
  - readonly browser-object mutations and cache delivery issues can complicate failure reporting
- supporting tests:
  - one-frame cleanup tests
  - lifecycle owner cleanup tests
  - retained-resource contract tests
- missing tests:
  - retained partial-attach cleanup and draw-failure cleanup mapping tests
- recommended next implementation phase:
  - `211.60`

## Risk Review

### stale raw-map reference

- risk:
  - medium
- assessment:
  - frozen raw map reference exists, but persistent redraws need replacement detection

### readiness drift between redraws

- risk:
  - high
- assessment:
  - current readiness is sufficient for one-frame approval, not yet for retained redraw revalidation timing

### consumed one-frame authorization misuse

- risk:
  - very high
- assessment:
  - one-frame renderer-handoff authorization must not be silently repurposed for persistent attachment

### duplicate retained Canvas

- risk:
  - high
- assessment:
  - current real surface seam is one-frame oriented and must not be reused unchanged

### duplicate lifecycle owner

- risk:
  - high
- assessment:
  - one-frame lifecycle ownership mode cannot simply be stretched across redraws

### duplicate listeners

- risk:
  - high
- assessment:
  - current live listener registration is bundled and incomplete for persistent whitelist needs

### stale queued animation frame

- risk:
  - high
- assessment:
  - no real retained queued-frame cancellation contract has been extracted yet

### draw re-entrancy

- risk:
  - medium to high
- assessment:
  - draw seam is proven for one-frame use; persistent repeatability needs scheduler ownership

### cleanup after partial attach

- risk:
  - high
- assessment:
  - retained cleanup order is proven only in fake contract today

### cleanup after draw failure

- risk:
  - high
- assessment:
  - one-frame cleanup exists, but retained redraw failures need persistent cleanup mapping

### frozen browser-object cycles

- risk:
  - medium
- assessment:
  - cycle-safe lifecycle translation with `WeakSet` remains required

### Leaflet readonly position mutation

- risk:
  - medium
- assessment:
  - mutable snapshot-position handoff and readonly `_leaflet_pos` fallback must remain intact

### Safari ES-module cache delivery

- risk:
  - medium
- assessment:
  - prior one-frame fixes repeatedly depended on cache-busted module delivery and runtime identity checks

### accidental startup activation

- risk:
  - very high
- assessment:
  - persistent live-seam wiring must remain fully disconnected from `script.js` and development-alpha startup until later approval

## Safari-Specific Proven Fixes Referenced

This review explicitly depends on the proven one-frame Safari fixes:

- cycle-safe lifecycle translation with `WeakSet`
- mutable snapshot-position handoff
- Leaflet readonly Canvas-position fallback
- module cache-busting and runtime identity checks

## Listener Whitelist

Persistent listener review remains limited to:

- `moveend`
- `zoomend`
- `resize`

Forbidden events remain forbidden:

- `move`
- `drag`
- `mousemove`
- `touchmove`

## Retained Cleanup Order

Persistent retained cleanup must remain explicit:

1. block new redraw requests
2. cancel queued frame
3. remove listeners
4. release draw references
5. release snapshot references
6. remove Canvas
7. remove owned pane if created
8. release lifecycle owner
9. clear map and identity references
10. return detached

## Overall Recommendation

Recommendation:

- `BLOCKED_BY_MULTIPLE_LIVE_GAPS`

Why:

- several seams are close enough for narrow wrappers:
  - raw map
  - readiness
  - identity snapshot
  - frame snapshot
  - frame draw
- but the remaining live blockers are still material:
  - persistent authorization contract
  - retained surface and lifecycle ownership
  - scheduler/canceller extraction
  - listener registration/removal extraction
  - retained cleanup orchestration

## Mapping Summary

### Directly reusable seams

- none

### Wrapped seams

- rawMapProvider
- readinessProvider
- identitySnapshotProvider
- frameSnapshotProvider
- frameDrawProvider

### Blocked seams

- authorizationStatusProvider
- retainedSurfaceProvider
- retainedLifecycleOwnerProvider
- animationFrameScheduler
- animationFrameCanceller
- approvedListenerRegistrar
- approvedListenerRemover
- retainedCleanupProvider

## Smallest Safe Next Step

- implement the review-only wrapper specs for raw map, readiness, identity, and snapshot first
- keep persistent authorization, retained lifecycle/surface ownership, scheduler/canceller, listener extraction, and retained cleanup in separate gated phases

## Canonical Safety Flags

These remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Files Changed

- [`GROWGO_SESSION_211_58_PERSISTENT_LIVE_ADAPTER_REAL_SEAM_MAPPING_REVIEW.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_58_PERSISTENT_LIVE_ADAPTER_REAL_SEAM_MAPPING_REVIEW.md)
- [`tests/client-persistent-live-adapter-real-seam-mapping-review.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-persistent-live-adapter-real-seam-mapping-review.test.mjs)

## Next Phase

Recommended next implementation target:

- authorization, retained surface/lifecycle ownership, scheduler/canceller, listener extraction, and retained cleanup remain gated follow-up phases before any disconnected real-seam adapter composition
