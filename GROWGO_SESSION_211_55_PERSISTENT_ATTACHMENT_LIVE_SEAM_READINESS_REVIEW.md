# GROWGO SESSION 211.55 — PERSISTENT ATTACHMENT LIVE-SEAM READINESS REVIEW

## Goal

Review the real GrowGo live seams that could eventually feed the persistent attachment controller proven in Phases 211.51 through 211.54.

This phase is review-only:

- no persistent controller instance created
- no live map attachment
- no live Canvas creation
- no real persistent listeners
- no real `requestAnimationFrame`
- no persistent controls exposed on `window`
- no startup behavior enabled

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- `git status --short` at start:
  - clean
- Phase 211.54 committed:
  - `yes`
- Phase 211.54 composition commit:
  - `b37d4aa feat(atlas): compose persistent attachment adapters`
- history rewritten:
  - `no`

## Readiness Classification Set

Allowed classifications used in this review:

- `READY_FOR_ADAPTER`
- `READY_WITH_NARROW_WRAPPER`
- `BLOCKED_BY_MISSING_CONTRACT`
- `BLOCKED_BY_LIFECYCLE_MISMATCH`
- `BLOCKED_BY_IDENTITY_RISK`
- `BLOCKED_BY_CLEANUP_RISK`
- `NOT_APPLICABLE`

## Live-Seam Matrix

| Seam | Real source function/module | Persistent contract target | Readiness classification | Adapter needed | Live behavior currently active | Blocker | Next phase |
|---|---|---|---|---|---|---|---|
| Real map seam | `script.js:getGrowGoMap`, `script.js:getCustom25DOneFrameBridge`, `client/development-alpha-app.mjs` raw map capture | stable `mapProvider` with stale-map detection | `READY_WITH_NARROW_WRAPPER` | yes | diagnostics bootstrap only | current access still flows through developer diagnostics capture rather than a dedicated persistent map seam | `211.56` map-provider wrapper |
| Real readiness seam | `client/developer-only-live-atlas-renderer-handoff-readiness.mjs:getAtlasRendererHandoffReadiness` | readiness provider with region/package/recipe binding | `READY_FOR_ADAPTER` | minimal | yes, read-only diagnostics only | none beyond persistent naming separation | `211.56` reuse via wrapper |
| Real authorization seam | `client/developer-only-atlas-renderer-handoff-authorization.mjs` | persistent-session authorization binding | `READY_WITH_NARROW_WRAPPER` | yes | one-frame one-session handoff authorization active in dev-only path | current contract is explicitly one-frame and consume-once, so persistent authorization must stay separate even if it reuses identity drift logic | `211.56` separate persistent authorization wrapper |
| Real surface seam | `client/growgo-custom25d-live-one-frame-surface-operations.mjs:prepareOneFrameSurface`, `script.js:initCustom25DMapExperiment` | persistent surface provider with reusable pane/canvas ownership | `BLOCKED_BY_CLEANUP_RISK` | yes | one-frame passive surface preparation only | current contract is cleanup-required and one-frame oriented; persistent reuse would need a non-destructive retained-surface contract | `211.56` retained surface adapter design |
| Real lifecycle-owner seam | `client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs`, `client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs` | lifecycle owner that survives many redraws | `BLOCKED_BY_LIFECYCLE_MISMATCH` | yes | one-frame lifecycle registration and dispose path active in isolated adapter only | current ownership modes center on `ONE_FRAME_SURFACE_ONLY` and cleanup on completion, not long-lived redraw ownership | `211.56` persistent lifecycle mode extension review |
| Real snapshot seam | bridge snapshot path in `script.js`, `createCustom25DFrameViewportSnapshotForOneFrame`, `client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs` | fresh immutable snapshot per redraw | `READY_WITH_NARROW_WRAPPER` | yes | snapshot created per one-frame execution | snapshot is safe only when regenerated fresh; no retained snapshot reuse contract exists | `211.56` fresh-per-redraw snapshot wrapper |
| Real draw seam | `script.js:drawCustom25DMapCanvasWithFrameSnapshot`, `client/growgo-custom25d-live-one-frame-draw-operation.mjs` | repeated draw on same owned Canvas with mutable runtime state boundary | `READY_WITH_NARROW_WRAPPER` | yes | one-frame draw only | draw seam is safe only when fed immutable snapshot + separate mutable runtime state; repeated use needs explicit non-reentrant scheduler ownership | `211.56` non-reentrant draw adapter |
| Real scheduler seam | `client/developer-only-atlas-custom25d-one-frame-command.mjs` one-frame `requestAnimationFrame` provider | one queued frame + cancellation + stale-frame invalidation | `BLOCKED_BY_MISSING_CONTRACT` | yes | one-frame schedule only | current path schedules one frame but has no persistent queue/cancel ownership contract | `211.56` persistent scheduler wrapper |
| Real listener seam | `script.js:map.on(\"moveend zoomend\", redraw)`, Leaflet `map.on`/`map.off`, lifecycle owner bundle listener fields | whitelisted `moveend` / `zoomend` / `resize` with duplicate protection | `BLOCKED_BY_CLEANUP_RISK` | yes | existing live renderer uses `moveend zoomend` directly | current live listener identity is bundled inside existing renderer init and does not expose a safe persistent registration/removal contract | `211.56` listener wrapper with exact registration identity |
| Real cleanup seam | `client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs:disposeOwnedResources`, one-frame pipeline cleanup patches | deterministic persistent detach cleanup | `BLOCKED_BY_CLEANUP_RISK` | yes | one-frame cleanup proven | repeated detach and partial-attach cleanup are proven for one-frame ownership, but not for retained persistent surface/listener/scheduler ownership | `211.56` persistent cleanup contract |
| Real diagnostics seam | `script.js` developer diagnostics namespace, `client/development-alpha-app.mjs` installed runtime identity getters | read-only persistent diagnostics | `READY_WITH_NARROW_WRAPPER` | yes | dev-only diagnostics active | current diagnostics expose one-frame/runtime-identity surfaces, but persistent status must avoid raw map/canvas/listener references and remain disconnected from live controls | `211.56` persistent diagnostics wrapper |

## Seam Review Details

### Real map seam

- current implementation:
  - `script.js:getGrowGoMap()`
  - `script.js:getCustom25DOneFrameBridge()`
  - `client/development-alpha-app.mjs:createCapturedRawLeafletMapProvider(...)`
- matching persistent contract requirement:
  - stable raw Leaflet map reference
  - stale map detection
  - no public diagnostics dependency at final adapter boundary
- readiness classification:
  - `READY_WITH_NARROW_WRAPPER`
- exact blocker:
  - current live path still captures the map through dev diagnostics bootstrap rather than a dedicated persistent seam
- smallest safe next step:
  - isolate a map-provider wrapper that accepts a captured raw map reference and publishes stable identity + map replacement detection
- files/functions involved:
  - `script.js:getGrowGoMap`
  - `script.js:createFrozenCustom25DOneFrameBridge`
  - `client/development-alpha-app.mjs:createCapturedRawLeafletMapProvider`
- tests already supporting it:
  - `tests/client-growgo-map-getter.test.mjs`
  - `tests/client-developer-only-growgo-custom25d-live-one-frame-adapter.test.mjs`
- tests still required:
  - persistent map-provider wrapper identity-drift tests

### Real readiness seam

- current implementation:
  - `client/developer-only-live-atlas-renderer-handoff-readiness.mjs:getAtlasRendererHandoffReadiness`
- matching persistent contract requirement:
  - approved region/package/recipe identity
  - exact blocked reason codes
  - drift-aware readiness snapshot
- readiness classification:
  - `READY_FOR_ADAPTER`
- exact blocker:
  - no technical blocker; only naming/ownership separation from one-frame flows
- smallest safe next step:
  - reuse the readiness result via a persistent adapter wrapper without changing runtime behavior
- files/functions involved:
  - `createDeveloperOnlyLiveAtlasRendererHandoffReadiness`
  - `validateAtlasRendererZeroDrawHandoff`
- tests already supporting it:
  - one-frame command/readiness tests
  - manual Safari readiness evidence chain
- tests still required:
  - persistent readiness-wrapper identity serialization tests

### Real authorization seam

- current implementation:
  - `client/developer-only-atlas-renderer-handoff-authorization.mjs`
- matching persistent contract requirement:
  - one-session auth
  - session-bound identity
  - invalidation on drift
- readiness classification:
  - `READY_WITH_NARROW_WRAPPER`
- exact blocker:
  - current semantics are one-frame, consume-once, and should not be reused unchanged for persistent redraw ownership
- smallest safe next step:
  - create a separate persistent authorization contract that reuses drift comparison ideas but keeps its own session state
- files/functions involved:
  - `consumeAuthorizedRendererHandoffAttempt`
  - `compareAuthorizationToReadiness`
  - `latchAuthorizationInvalidation`
- tests already supporting it:
  - one-frame authorization/command tests
- tests still required:
  - persistent authorization reuse-vs-separation tests

### Real surface seam

- current implementation:
  - `client/growgo-custom25d-live-one-frame-surface-operations.mjs:prepareOneFrameSurface`
- matching persistent contract requirement:
  - owned pane/canvas surface reusable across redraws
  - explicit retained ownership
- readiness classification:
  - `BLOCKED_BY_CLEANUP_RISK`
- exact blocker:
  - current surface bundle is explicitly one-frame cleanup-required and rollback-oriented, not retained for persistent redraw ownership
- smallest safe next step:
  - define a retained-surface adapter contract that separates “create once” from “draw many”
- files/functions involved:
  - `prepareOneFrameSurface`
  - `removeCanvasExact`
  - source-lock checks for `custom25DMapPane`
- tests already supporting it:
  - one-frame live adapter tests
  - surface operations tests already embedded through adapter coverage
- tests still required:
  - retained pane/canvas ownership reuse tests

### Real lifecycle-owner seam

- current implementation:
  - `client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs`
  - `client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs`
- matching persistent contract requirement:
  - one owner persisting across multiple redraws
  - exact cleanup ownership
- readiness classification:
  - `BLOCKED_BY_LIFECYCLE_MISMATCH`
- exact blocker:
  - current modes and translation status focus on one-frame ownership registration and immediate disposal, not long-lived redraw cycles
- smallest safe next step:
  - extend lifecycle ownership modes with an explicit persistent redraw ownership mode before live reuse
- files/functions involved:
  - `registerOwnedResources`
  - `disposeOwnedResources`
  - `createGrowGoCustom25DOneFrameSurfaceLifecycleTranslation`
- tests already supporting it:
  - lifecycle translation tests
  - live one-frame adapter lifecycle tests
- tests still required:
  - persistent lifecycle ownership mode tests

### Real snapshot seam

- current implementation:
  - `script.js:createCustom25DFrameViewportSnapshotForOneFrame`
  - one-frame bridge snapshot provider path
- matching persistent contract requirement:
  - immutable snapshot
  - fresh snapshot per redraw
  - stale identity rejection before draw
- readiness classification:
  - `READY_WITH_NARROW_WRAPPER`
- exact blocker:
  - no retained-snapshot contract should be allowed; redraw must request a fresh snapshot every time
- smallest safe next step:
  - create a fresh-per-redraw snapshot adapter that validates identity immediately before each snapshot
- files/functions involved:
  - one-frame bridge snapshot provider
  - `client/developer-only-growgo-custom25d-live-one-frame-adapter.mjs`
- tests already supporting it:
  - snapshot handoff and invocation boundary tests
  - one-frame adapter tests
- tests still required:
  - persistent per-redraw snapshot freshness tests

### Real draw seam

- current implementation:
  - `script.js:drawCustom25DMapCanvasWithFrameSnapshot`
  - `client/growgo-custom25d-live-one-frame-draw-operation.mjs`
- matching persistent contract requirement:
  - repeated draw on same canvas
  - mutable runtime draw state separated from immutable snapshot
- readiness classification:
  - `READY_WITH_NARROW_WRAPPER`
- exact blocker:
  - repeated draw must stay scheduler-owned and non-reentrant; current seam is safe only when wrapper preserves that boundary
- smallest safe next step:
  - wrap draw as a non-reentrant repeated-draw consumer with one-canvas ownership supplied externally
- files/functions involved:
  - `drawCustom25DMapCanvasWithFrameSnapshot`
  - draw operation source-lock and surface validation
- tests already supporting it:
  - `tests/client-growgo-custom25d-snapshot-aware-draw-seam.test.mjs`
  - live one-frame adapter tests
- tests still required:
  - repeated same-canvas draw safety tests

### Real scheduler seam

- current implementation:
  - one-frame schedule boundary inside `client/developer-only-atlas-custom25d-one-frame-command.mjs`
- matching persistent contract requirement:
  - one queued frame
  - cancellation
  - stale queued-frame invalidation
- readiness classification:
  - `BLOCKED_BY_MISSING_CONTRACT`
- exact blocker:
  - current one-frame command owns a single completion boundary but does not define persistent queue ownership or cancellation semantics
- smallest safe next step:
  - define a persistent scheduler wrapper with explicit queued-handle ownership and cancel-on-detach
- files/functions involved:
  - one-frame command animation frame provider
  - one-frame command result counters
- tests already supporting it:
  - one-frame command tests for single frame schedule
- tests still required:
  - queued/cancelled persistent frame tests

### Real listener seam

- current implementation:
  - existing live renderer wiring in `script.js` uses `map.on("moveend zoomend", redraw);`
  - lifecycle owner validates listener fields
- matching persistent contract requirement:
  - exact whitelist of `moveend`, `zoomend`, `resize`
  - duplicate protection
  - exact removal identity
- readiness classification:
  - `BLOCKED_BY_CLEANUP_RISK`
- exact blocker:
  - current live listener identity is bundled in the existing renderer initializer and omits `resize`; it is not safe to reuse unchanged for persistent controller ownership
- smallest safe next step:
  - build a dedicated listener adapter that registers/removes only the approved persistent set and never touches `move`, `drag`, `mousemove`, or `touchmove`
- files/functions involved:
  - `script.js:initCustom25DMapExperiment`
  - lifecycle owner bundle listener fields
- tests already supporting it:
  - source-lock tests asserting current `moveend zoomend`
  - controller/composition fake whitelist tests
- tests still required:
  - real Leaflet listener adapter identity/removal tests

### Real cleanup seam

- current implementation:
  - one-frame cleanup through lifecycle owner disposal and pipeline cleanup patches
- matching persistent contract requirement:
  - detach cleanup after full attach, partial attach, draw failure, and repeated detach
- readiness classification:
  - `BLOCKED_BY_CLEANUP_RISK`
- exact blocker:
  - one-frame cleanup is proven, but persistent ownership would add queued-frame cancellation plus retained surface/listener reuse that does not yet have a live contract
- smallest safe next step:
  - define persistent cleanup composition contract before any live seam implementation
- files/functions involved:
  - `disposeOwnedResources`
  - `deriveCleanupPatch`
  - one-frame pipeline cleanup flow
- tests already supporting it:
  - one-frame adapter cleanup tests
  - command cleanup tests
- tests still required:
  - persistent partial-attach cleanup and repeated-detach tests

### Real diagnostics seam

- current implementation:
  - `script.js` developer diagnostics namespace
  - `client/development-alpha-app.mjs` runtime identity getters
- matching persistent contract requirement:
  - read-only persistent status
  - no raw references
  - no live controls exposed until separately approved
- readiness classification:
  - `READY_WITH_NARROW_WRAPPER`
- exact blocker:
  - existing diagnostics are one-frame oriented and expose bridge/runtime identity helpers, not persistent status objects
- smallest safe next step:
  - add a persistent read-only diagnostics wrapper only after live seams are judged safe
- files/functions involved:
  - `bootstrapGrowGoDeveloperDiagnosticsForLocalDev`
  - runtime identity getters in `development-alpha-app.mjs`
- tests already supporting it:
  - map getter diagnostics tests
  - one-frame runtime identity tests
- tests still required:
  - persistent diagnostics serialization/no-raw-reference tests

## Risk Review

### Duplicate Canvas risk

- risk:
  - high if persistent surface reuses current one-frame preparation unchanged
- current evidence:
  - one-frame surface is cleanup-required and owned for a single pass
- status:
  - explicit blocker

### Duplicate pane risk

- risk:
  - medium to high
- current evidence:
  - pane ownership exists, but persistent retained reuse is not defined
- status:
  - blocked until retained-surface contract exists

### Duplicate listener risk

- risk:
  - high
- current evidence:
  - current live renderer bundles `moveend zoomend` directly inside init path
- status:
  - blocked until wrapper identity/removal contract exists

### Stale map reference risk

- risk:
  - medium
- current evidence:
  - raw Leaflet map reference freeze path exists and recursion was removed
- status:
  - wrapper required for map replacement/reset handling

### Stale identity risk

- risk:
  - medium
- current evidence:
  - readiness and authorization drift comparison already exist
- status:
  - adapter-ready with narrow wrapper

### Stale queued-frame risk

- risk:
  - medium
- current evidence:
  - one-frame command schedules one frame only; persistent queue ownership absent
- status:
  - blocked by missing scheduler contract

### Redraw recursion risk

- risk:
  - lowered but still important
- current evidence:
  - public `getGrowGoMap` recursion fixed
  - snapshot recursion fixed
- status:
  - draw/snapshot wrappers must preserve captured raw references

### Parallel draw risk

- risk:
  - medium
- current evidence:
  - one-frame path is single draw only
- status:
  - blocked until persistent scheduler enforces one queued frame and one active draw

### Cleanup leak risk

- risk:
  - high
- current evidence:
  - one-frame cleanup proven
  - persistent retained ownership cleanup not yet defined
- status:
  - primary blocker

### Frozen-browser-object risk

- risk:
  - medium
- current evidence:
  - cycle-safe lifecycle translation exists
  - mutable snapshot-position handoff exists
  - Leaflet readonly canvas-position fallback exists
- status:
  - wrappers must preserve immutable snapshot / mutable runtime split

### Safari module-cache risk

- risk:
  - medium
- current evidence:
  - module cache-busting and runtime identity checks were required repeatedly in 211.50
- status:
  - any future live persistent seam wiring must ship with explicit runtime identity verification

### Startup activation risk

- risk:
  - high if any persistent seam is wired into startup accidentally
- current evidence:
  - current persistent controller/composition are disconnected
- status:
  - must remain blocked until explicit later approval

## Proven One-Frame Safari Fixes Referenced

This review explicitly depends on the proven one-frame fixes:

- cycle-safe lifecycle translation with `WeakSet`
- mutable snapshot-position handoff
- Leaflet readonly Canvas-position fallback
- module cache-busting and runtime identity checks

## Forbidden Events And Canonical Safety Flags

Forbidden events remain forbidden in this review and in the next disconnected design step:

- `move`
- `drag`
- `mousemove`
- `touchmove`

Canonical safety flags remain false:

- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

## Overall Recommendation

Recommendation:

- `BLOCKED_BY_CLEANUP_GAPS`

Why:

- map, readiness, authorization, snapshot, draw, and diagnostics seams are close enough for wrappers
- but surface, lifecycle-owner, listener, scheduler, and cleanup seams still lack the retained ownership + deterministic detach contract needed for safe persistent live composition

## Ready / Wrapped / Blocked Summary

### Ready seams

- real readiness seam

### Wrapped seams

- real map seam
- real authorization seam
- real snapshot seam
- real draw seam
- real diagnostics seam

### Blocked seams

- real surface seam
- real lifecycle-owner seam
- real scheduler seam
- real listener seam
- real cleanup seam

## Smallest Safe Next Step

Smallest safe next implementation phase:

- define a disconnected retained-surface + listener + scheduler + cleanup contract review bundle before any live adapter implementation

## Files Changed

- [`GROWGO_SESSION_211_55_PERSISTENT_ATTACHMENT_LIVE_SEAM_READINESS_REVIEW.md`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/GROWGO_SESSION_211_55_PERSISTENT_ATTACHMENT_LIVE_SEAM_READINESS_REVIEW.md)
- [`tests/client-persistent-atlas-live-seam-readiness-review.test.mjs`](/Users/michaelpeterson/Documents/Codex/2026-06-16/files-mentioned-by-the-user-root/growgo-codex/tests/client-persistent-atlas-live-seam-readiness-review.test.mjs)

## Next Phase

Recommended next phase:

- retained surface/listener/scheduler/cleanup contract hardening before any disconnected live adapter implementation
