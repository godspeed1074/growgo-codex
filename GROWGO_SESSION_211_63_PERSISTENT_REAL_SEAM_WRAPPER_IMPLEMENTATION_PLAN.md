# GROWGO SESSION 211.63 — PERSISTENT REAL-SEAM WRAPPER IMPLEMENTATION PLAN

## Goal

Define the exact file-level implementation plan for replacing every fake seam in the Phase 211.62 persistent Atlas contract integration with a narrow real-seam wrapper.

This phase is planning and verification only.

No live wrapper is implemented here.
No persistent attachment is activated here.

## Preflight

- branch:
  - `feature/atlas-phase-211-6-gated-map-attachment-controller`
- prerequisite commit:
  - `feat(atlas): integrate persistent attachment contracts`
- prerequisite status:
  - present and reviewed
- canonical safety flags:
  - `runtimeExecutionEnabled = false`
  - `mapAttachmentAllowed = false`
  - `automaticRendererExecutionAllowed = false`
  - `lifecycleExecutionEnabled = false`

## Planning-phase exclusions

- do not implement the wrappers
- do not modify runtime execution paths
- do not touch `script.js` startup behavior
- do not touch development-alpha startup behavior
- do not expose persistent commands on `window`
- do not create a real Canvas
- do not register real listeners
- do not schedule real animation frames
- do not invoke the renderer
- do not activate persistent attachment

## Existing contract modules reviewed

- `client/developer-only-controlled-persistent-atlas-authorization.mjs`
- `client/developer-only-controlled-persistent-atlas-controller.mjs`
- `client/developer-only-controlled-persistent-atlas-scheduler-listener-contract.mjs`
- `client/developer-only-controlled-persistent-atlas-retained-surface-wrapper.mjs`
- `client/developer-only-controlled-persistent-atlas-live-adapter.mjs`
- `client/developer-only-controlled-persistent-atlas-contract-integration.mjs`

## Overall recommendation

`READY_TO_IMPLEMENT_REAL_SEAM_WRAPPERS_INCREMENTALLY`

Reason:

- Phase 211.58 already proved the major real seams were mappable.
- Phase 211.61 proved retained-surface cleanup ordering and ownership rules.
- Phase 211.62 proved the disconnected contract composition is already stable.
- The remaining work is now narrow wrapper implementation and staged live-seam composition, not missing architecture.

## Wrapper mapping summary

### 1. Persistent map wrapper

- target seam:
  - `rawMapProvider`
- exact source candidates:
  - `script.js:getCustom25DOneFrameBridge`
  - `script.js:getGrowGoMap`
  - `client/development-alpha-app.mjs` captured raw bridge reference path
- stable raw-map extraction path:
  - frozen bridge → raw Leaflet map reference
- map identity token:
  - `mapIdentity` / `mapIdentityId` normalized into persistent identity snapshot
- stale-map detection:
  - compare current raw map object identity and resolved persistent identity snapshot
- map replacement behavior:
  - fail closed on map replacement; require fresh authorization and fresh attach
- explicit prohibition:
  - no diagnostics/global fallback at runtime
- proposed wrapper API:
  - `createPersistentAtlasMapProvider(...)`
  - `getPersistentAtlasMapIdentity(...)`

### 2. Persistent readiness wrapper

- target seam:
  - `readinessProvider`
- exact source candidates:
  - `client/developer-only-live-atlas-renderer-handoff-readiness.mjs:getAtlasRendererHandoffReadiness`
- required fields for persistent binding:
  - region
  - package
  - recipe
  - package fingerprint
  - selector seed
  - blocked reason
  - approved scope evidence
- blocked reason normalization:
  - normalize to explicit persistent reason codes
- revalidation timing:
  - once before attach
  - once before every redraw
- identity drift comparison:
  - compare readiness snapshot against persistent identity snapshot
- proposed wrapper API:
  - `createPersistentAtlasReadinessProvider(...)`
  - `validatePersistentAtlasReadiness(...)`

### 3. Persistent authorization-status wrapper

- target seam:
  - `authorizationStatusProvider`
- exact source candidates:
  - `client/developer-only-controlled-persistent-atlas-authorization.mjs`
- authoritative provider:
  - persistent authorization contract from Phase 211.59/211.62 lineage
- separation from one-frame authorization:
  - one-frame handoff authorization remains separate and must not be reused
- session lookup:
  - by persistent session id + identity snapshot
- attach permission consumption boundary:
  - consumed at attach only
- redraw validation boundary:
  - redraws validate active session but do not consume a new session
- revoke/invalidate propagation:
  - revoke/invalidate must fan out to scheduler, listener, surface, and cleanup paths
- proposed wrapper API:
  - `createPersistentAtlasAuthorizationProvider(...)`

### 4. Persistent identity wrapper

- target seam:
  - `identitySnapshotProvider`
- authoritative source fields:
  - `mapIdentity`
  - `sessionId`
  - `regionId`
  - `packageId`
  - `packageVersion`
  - `packageFingerprint`
  - `recipeId`
  - `recipeVersion`
  - `selectorSeed`
- authoritative source candidates:
  - readiness snapshot
  - persistent authorization contract
  - persistent controller identity keys
- freeze and serialization boundary:
  - immutable, serializable snapshot only
- drift reason codes:
  - explicit map/region/package/recipe/session drift codes
- proposed wrapper API:
  - `createPersistentAtlasIdentitySnapshotProvider(...)`

### 5. Persistent retained-surface wrapper

- target seam:
  - `retainedSurfaceProvider`
- exact source candidates:
  - `client/growgo-custom25d-live-one-frame-surface-operations.mjs:prepareOneFrameSurface`
  - `client/developer-only-growgo-custom25d-one-frame-surface-preparation.mjs`
  - `client/developer-only-growgo-custom25d-one-frame-draw.mjs`
- reusable one-frame helpers:
  - pane lookup/creation logic
  - Canvas lookup/creation logic
  - sizing/position preparation
- one-frame assumptions to remove:
  - mandatory one-frame cleanup
  - rollback-only ownership
  - no retained Canvas reuse
- ownership:
  - pane owner = persistent wrapper
  - Canvas owner = persistent wrapper
- retained Canvas reuse:
  - exactly one owned Canvas reused across redraws
- Canvas position handling:
  - preserve mutable draw-state boundary
- partial-acquisition rollback:
  - rollback acquired pane/canvas before attach completes
- proposed wrapper API:
  - `createPersistentAtlasRetainedSurfaceProvider(...)`
  - `validateRetainedAtlasSurface(...)`

### 6. Persistent lifecycle-owner wrapper

- target seam:
  - `retainedLifecycleOwnerProvider`
- exact source candidates:
  - `client/developer-only-growgo-custom25d-renderer-lifecycle-owner.mjs`
  - `client/growgo-custom25d-one-frame-surface-lifecycle-translation.mjs`
- existing one-frame lifecycle owner source:
  - one-frame lifecycle owner + translated surface bundle
- lifecycle translation bundle:
  - must remain cycle-safe
- cycle-safe freeze boundary:
  - preserve WeakSet-backed deep-freeze protection
- retained owner state extension:
  - retained lifecycle mode layered over existing owner rules
- redraw reuse behavior:
  - reuse one authoritative owner across redraws
- duplicate owner prevention:
  - fail closed if a second owner would be created
- release behavior:
  - release once during detach/cleanup
- proposed wrapper API:
  - `createPersistentAtlasLifecycleOwnerProvider(...)`

### 7. Persistent snapshot wrapper

- target seam:
  - `frameSnapshotProvider`
- exact source candidates:
  - `script.js:createCustom25DFrameViewportSnapshotForOneFrame`
  - `script.js:createCustom25DFrameViewportSnapshotPrivateImplementation`
  - `script.js:createCustom25DFrameViewportSnapshot`
- immutable output requirements:
  - frozen snapshot object
- fresh snapshot per redraw:
  - required
- map normalization:
  - normalize only from raw Leaflet map reference + current identity
- stale map/session rejection:
  - fail closed before snapshot on drift
- explicit prohibition:
  - no snapshot reuse across redraws
- proposed wrapper API:
  - `createPersistentAtlasFrameSnapshotProvider(...)`

### 8. Persistent draw wrapper

- target seam:
  - `frameDrawProvider`
- exact source candidates:
  - `script.js:drawCustom25DMapCanvasWithFrameSnapshot`
  - `script.js:drawCustom25DMapCanvasWithFrameSnapshotPrivateImplementation`
  - `script.js:drawCustom25DOneFrameFromSnapshot`
  - readonly Leaflet `_leaflet_pos` fallback behavior already proven in one-frame path
- retained Canvas input:
  - required
- mutable draw-state boundary:
  - separate from frozen snapshot payload
- readonly Leaflet position fallback:
  - preserve
- re-entrancy guard:
  - required
- cleanup between redraws:
  - required for runtime-only draw state
- repeatability on same Canvas:
  - required
- proposed wrapper API:
  - `createPersistentAtlasFrameDrawProvider(...)`

### 9. Browser scheduler wrapper

- target seams:
  - `animationFrameScheduler`
  - `animationFrameCanceller`
- exact source candidates:
  - `client/development-alpha-app.mjs` browser animation-frame provider path
  - browser `requestAnimationFrame`
  - browser `cancelAnimationFrame`
- handle ownership:
  - controller owns exactly one queued handle
- stale callback generation token:
  - required
- one queued frame enforcement:
  - required
- cancellation during detach:
  - required
- Safari module/cache considerations:
  - runtime identity/versioning required for delivery verification
- proposed wrapper API:
  - `createPersistentAtlasAnimationFrameScheduler(...)`
  - `createPersistentAtlasAnimationFrameCanceller(...)`

### 10. Leaflet listener wrapper

- target seams:
  - `approvedListenerRegistrar`
  - `approvedListenerRemover`
- exact source candidates:
  - Leaflet `map.on`
  - Leaflet `map.off`
  - `script.js:map.on("moveend zoomend", redraw)` as real listener seam precedent
  - `client/developer-only-atlas-map-attachment-controller.mjs`
- callback identity storage:
  - required for exact removal
- approved event whitelist:
  - `moveend`
  - `zoomend`
  - `resize`
- duplicate listener prevention:
  - required
- partial registration rollback:
  - required
- map replacement cleanup:
  - required
- exact removal behavior:
  - idempotent exact-removal only
- proposed wrapper API:
  - `createPersistentAtlasListenerRegistrar(...)`
  - `createPersistentAtlasListenerRemover(...)`

### 11. Persistent cleanup wrapper

- target seam:
  - `retainedCleanupProvider`
- exact source candidates:
  - retained cleanup ordering from `client/developer-only-controlled-persistent-atlas-retained-surface-wrapper.mjs`
  - one-frame cleanup helpers already used in live one-frame path
- reusable one-frame helpers:
  - resource release helpers
  - owned-reference cleanup discipline
- retained cleanup order:
  1. cancel queued frame
  2. remove listeners
  3. release draw/snapshot references
  4. remove Canvas
  5. remove pane
  6. release lifecycle owner
  7. release map/session/identity bindings
- partial failure collection:
  - required
- repeated cleanup:
  - idempotent
- proposed wrapper API:
  - `createPersistentAtlasCleanupProvider(...)`

### 12. Persistent diagnostics wrapper

- exact source candidates:
  - integrated persistent status from controller/live-adapter/integration status surfaces
- integrated status to expose:
  - attached
  - lifecycleState
  - ownedCanvasCount
  - ownedPaneCount
  - ownedListenerCount
  - redrawRequestedCount
  - redrawCompletedCount
  - redrawCoalescedCount
  - animationFrameScheduleCount
  - cleanupAttemptCount
  - cleanupCompleted
  - referencesReleased
  - current identity
  - safety flags
- live seam statuses included:
  - map/readiness/authorization/identity/surface/lifecycle/snapshot/draw/scheduler/listener/cleanup wrapper status summaries
- prohibited:
  - raw map object
  - raw lifecycle owner object
  - raw Canvas object
  - raw listener callbacks
- browser access detection:
  - stays observable only through read-only diagnostics status
- proposed wrapper API:
  - `getPersistentAtlasLiveIntegrationStatus()`

## Dependency-safe implementation order

Verified final order:

1. identity/readiness/map wrappers
2. authorization provider
3. scheduler/canceller wrappers
4. listener registrar/remover wrappers
5. retained surface wrapper
6. lifecycle owner wrapper
7. snapshot wrapper
8. draw wrapper
9. cleanup provider
10. disconnected real-seam composition
11. focused fake-real hybrid tests
12. developer-only manual command
13. Safari manual verification
14. persistent enablement decision

Why this order is safe:

- map/readiness/identity establish the authoritative binding contract first
- authorization depends on that identity contract
- scheduler/listener ownership must exist before retained attach behavior
- retained surface must exist before lifecycle/snapshot/draw reuse
- lifecycle ownership must exist before repeated redraws
- snapshot/draw depend on retained surface + lifecycle
- cleanup must close over all previous retained ownership
- real composition only becomes safe after all wrappers exist

## File-change plan by wrapper group

### Group A — map/readiness/identity

- files to create:
  - `client/developer-only-persistent-atlas-map-provider.mjs`
  - `client/developer-only-persistent-atlas-readiness-provider.mjs`
  - `client/developer-only-persistent-atlas-identity-snapshot-provider.mjs`
- files to modify:
  - none in planning phase
  - later composition target: `client/developer-only-controlled-persistent-atlas-live-adapter.mjs`
- files explicitly forbidden from modification:
  - `script.js`
  - `client/development-alpha-app.mjs`
- tests to add:
  - wrapper-source lock tests
  - drift rejection tests
- proof required:
  - no diagnostics fallback
  - stable raw map identity
  - redraw-time readiness drift detection
- rollback boundary:
  - remove new wrapper modules only
- commit message:
  - `feat(atlas): add persistent map readiness identity wrappers`

### Group B — authorization

- files to create:
  - `client/developer-only-persistent-atlas-authorization-provider.mjs`
- files to modify:
  - none in planning phase
- files explicitly forbidden from modification:
  - one-frame authorization runtime path
- tests to add:
  - attach consumption tests
  - redraw validation tests
  - revoke/invalidate propagation tests
- proof required:
  - one-frame authorization remains separate
- rollback boundary:
  - remove new authorization wrapper only
- commit message:
  - `feat(atlas): add persistent authorization wrapper`

### Group C — scheduler/listener

- files to create:
  - `client/developer-only-persistent-atlas-animation-frame-wrapper.mjs`
  - `client/developer-only-persistent-atlas-listener-wrapper.mjs`
- files to modify:
  - none in planning phase
- files explicitly forbidden from modification:
  - startup listener registration paths
- tests to add:
  - one queued frame only
  - duplicate listener prevention
  - rollback on partial registration
- proof required:
  - no real scheduling/listener activation during tests
- rollback boundary:
  - remove new scheduler/listener wrapper modules only
- commit message:
  - `feat(atlas): add persistent scheduler and listener wrappers`

### Group D — retained surface/lifecycle

- files to create:
  - `client/developer-only-persistent-atlas-retained-surface-provider.mjs`
  - `client/developer-only-persistent-atlas-lifecycle-owner-provider.mjs`
- files to modify:
  - none in planning phase
- files explicitly forbidden from modification:
  - startup Canvas creation
  - runtime attach flows
- tests to add:
  - create-once reuse-many tests
  - duplicate owner prevention tests
  - partial attach rollback tests
- proof required:
  - no duplicate Canvas/pane/lifecycle owner
- rollback boundary:
  - remove new surface/lifecycle wrapper modules only
- commit message:
  - `feat(atlas): add persistent surface and lifecycle wrappers`

### Group E — snapshot/draw

- files to create:
  - `client/developer-only-persistent-atlas-frame-snapshot-provider.mjs`
  - `client/developer-only-persistent-atlas-frame-draw-provider.mjs`
- files to modify:
  - none in planning phase
- files explicitly forbidden from modification:
  - draw visuals
  - snapshot internals in `script.js`
- tests to add:
  - fresh snapshot per redraw tests
  - same-Canvas repeat draw tests
  - readonly fallback preservation tests
- proof required:
  - no snapshot reuse
  - mutable runtime draw state stays separate
- rollback boundary:
  - remove new snapshot/draw wrapper modules only
- commit message:
  - `feat(atlas): add persistent snapshot and draw wrappers`

### Group F — cleanup

- files to create:
  - `client/developer-only-persistent-atlas-cleanup-provider.mjs`
- files to modify:
  - none in planning phase
- files explicitly forbidden from modification:
  - one-frame cleanup semantics
- tests to add:
  - repeated cleanup
  - partial failure collection
  - draw-failure cleanup
- proof required:
  - retained cleanup order preserved exactly
- rollback boundary:
  - remove cleanup wrapper only
- commit message:
  - `feat(atlas): add persistent cleanup wrapper`

### Group G — disconnected composition and verification

- files to create:
  - focused hybrid verification docs/tests as needed
- files to modify:
  - `client/developer-only-controlled-persistent-atlas-live-adapter.mjs`
  - `client/developer-only-controlled-persistent-atlas-contract-integration.mjs`
- files explicitly forbidden from modification:
  - `script.js`
  - `client/development-alpha-app.mjs`
  - startup attachment paths
- tests to add:
  - fake-real hybrid adapter tests
  - runtime identity verification tests
- proof required:
  - no window exposure
  - no live attach by default
- rollback boundary:
  - revert composition-only changes without touching wrappers
- commit message:
  - `feat(atlas): compose persistent live wrappers behind disconnected adapter`

## Smallest safe implementation phases

### Phase 211.64 — Persistent Map, Readiness, and Identity Wrappers

- ELI5:
  - teach Atlas how to find the right map and prove it is still the same safe place to draw
- scope:
  - real map wrapper
  - readiness wrapper
  - identity snapshot wrapper
- exclusions:
  - no auth, surface, listener, draw, or cleanup live wiring
- files:
  - create Group A files
- tests:
  - drift detection
  - no diagnostics fallback
  - immutable identity snapshot
- exit criteria:
  - all three wrappers return stable, serializable, drift-aware results
- suggested commit:
  - `feat(atlas): add persistent map readiness identity wrappers`
- next phase:
  - `211.65 — Persistent Authorization Wrapper`

### Phase 211.65 — Persistent Authorization Wrapper

- ELI5:
  - give persistent attach its own permission slip instead of reusing the one-frame slip
- scope:
  - persistent authorization status wrapper
- exclusions:
  - no scheduler/listener/surface/draw wiring
- files:
  - create Group B files
- tests:
  - attach consumption boundary
  - redraw validation boundary
  - revoke/invalidate propagation
- exit criteria:
  - persistent auth is separate from one-frame auth and fails closed on drift
- suggested commit:
  - `feat(atlas): add persistent authorization wrapper`
- next phase:
  - `211.66 — Persistent Scheduler and Listener Wrappers`

### Phase 211.66 — Persistent Scheduler and Listener Wrappers

- ELI5:
  - give Atlas one tidy alarm clock and one tidy set of map event hooks
- scope:
  - scheduler wrapper
  - canceller wrapper
  - listener registrar/remover wrappers
- exclusions:
  - no retained surface or draw yet
- files:
  - create Group C files
- tests:
  - one queued frame only
  - duplicate listener prevention
  - exact removal
- exit criteria:
  - approved event ownership is deterministic and idempotent
- suggested commit:
  - `feat(atlas): add persistent scheduler and listener wrappers`
- next phase:
  - `211.67 — Persistent Retained Surface Wrapper`

### Phase 211.67 — Persistent Retained Surface Wrapper

- ELI5:
  - create one Atlas drawing sheet and keep reusing it safely
- scope:
  - retained pane/Canvas wrapper
- exclusions:
  - no lifecycle reuse, snapshot, or draw yet
- files:
  - create retained surface provider module
- tests:
  - create once
  - reuse many
  - partial rollback
- exit criteria:
  - one owned pane and one owned Canvas are modeled without activation
- suggested commit:
  - `feat(atlas): add persistent retained surface wrapper`
- next phase:
  - `211.68 — Persistent Lifecycle Owner Wrapper`

### Phase 211.68 — Persistent Lifecycle Owner Wrapper

- ELI5:
  - keep exactly one grown-up in charge of the retained Atlas surface
- scope:
  - lifecycle owner wrapper
  - cycle-safe translation usage
- exclusions:
  - no snapshot/draw implementation yet
- files:
  - create lifecycle owner provider module
- tests:
  - no duplicate owner
  - retained reuse
  - single release
- exit criteria:
  - one lifecycle owner can be retained and released exactly once
- suggested commit:
  - `feat(atlas): add persistent lifecycle owner wrapper`
- next phase:
  - `211.69 — Persistent Snapshot Wrapper`

### Phase 211.69 — Persistent Snapshot Wrapper

- ELI5:
  - take a fresh photo of the map every time Atlas redraws
- scope:
  - snapshot wrapper
- exclusions:
  - no draw wrapper yet
- files:
  - create snapshot provider module
- tests:
  - fresh snapshot per redraw
  - drift rejection
  - frozen output
- exit criteria:
  - persistent redraw path can request a fresh immutable snapshot safely
- suggested commit:
  - `feat(atlas): add persistent snapshot wrapper`
- next phase:
  - `211.70 — Persistent Draw Wrapper`

### Phase 211.70 — Persistent Draw Wrapper

- ELI5:
  - teach Atlas how to redraw safely on the same sheet without poking frozen things
- scope:
  - draw wrapper
- exclusions:
  - no cleanup or composition yet
- files:
  - create draw provider module
- tests:
  - same-Canvas redraw repeatability
  - readonly Leaflet fallback
  - no re-entrant draw
- exit criteria:
  - draw wrapper returns safely with isolated mutable runtime state
- suggested commit:
  - `feat(atlas): add persistent draw wrapper`
- next phase:
  - `211.71 — Persistent Cleanup Wrapper`

### Phase 211.71 — Persistent Cleanup Wrapper

- ELI5:
  - when Atlas is done, clean everything up in the exact safe order
- scope:
  - retained cleanup wrapper
- exclusions:
  - no live composition yet
- files:
  - create cleanup provider module
- tests:
  - repeated cleanup
  - partial failure collection
  - draw-failure cleanup
- exit criteria:
  - cleanup order is deterministic and idempotent
- suggested commit:
  - `feat(atlas): add persistent cleanup wrapper`
- next phase:
  - `211.72 — Disconnected Real-Seam Composition`

### Phase 211.72 — Disconnected Real-Seam Composition

- ELI5:
  - plug the real wrapper parts into the Atlas practice rig without turning the real machine on
- scope:
  - wire real wrappers into live adapter/integration in disconnected mode only
- exclusions:
  - no window exposure
  - no startup activation
  - no persistent attach command
- files:
  - modify live adapter/integration composition only
- tests:
  - fake-real hybrid seam tests
- exit criteria:
  - adapter accepts all real wrappers without activating runtime behavior
- suggested commit:
  - `feat(atlas): compose disconnected persistent real seams`
- next phase:
  - `211.73 — Persistent Hybrid Verification`

### Phase 211.73 — Persistent Hybrid Verification

- ELI5:
  - prove the plugged-in parts still behave safely before anyone presses the real button
- scope:
  - focused hybrid tests
  - runtime identity verification
- exclusions:
  - no live manual command yet
- files:
  - tests and evidence docs only
- tests:
  - wrapper identity
  - no startup exposure
  - safety flags remain false
- exit criteria:
  - real seams prove safe in disconnected verification
- suggested commit:
  - `test(atlas): verify disconnected persistent real seams`
- next phase:
  - `211.74 — Developer-Only Persistent Manual Command`

### Phase 211.74 — Developer-Only Persistent Manual Command

- ELI5:
  - add the guarded developer-only button to try the retained attach manually
- scope:
  - developer-only manual attach/detach/redraw command surface
- exclusions:
  - no production activation
  - no startup activation
- files:
  - command wiring only
- tests:
  - one-session authorization boundary
  - no automatic attach
- exit criteria:
  - manual persistent command exists but remains fully gated
- suggested commit:
  - `feat(atlas): add manual persistent attachment command`
- next phase:
  - `211.75 — Safari Persistent Manual Verification`

### Phase 211.75 — Safari Persistent Manual Verification and Enablement Decision

- ELI5:
  - carefully test the retained attach by hand in Safari, then decide if it is safe to advance
- scope:
  - manual Safari verification
  - enablement decision only
- exclusions:
  - no production startup activation unless separately approved later
- files:
  - evidence records and tests
- tests:
  - manual-evidence preservation
  - safety flags still false
- exit criteria:
  - manual evidence supports either safe advancement or explicit block
- suggested commit:
  - `test(atlas): record persistent Safari verification evidence`
- next phase:
  - `211.76 — Persistent Developer-Only Attachment Enablement Decision`

## Risk plan and mitigations

### stale raw-map references

- mitigation:
  - freeze one authoritative raw map reference at wrapper bootstrap
  - compare map object identity before attach and redraw

### readiness drift

- mitigation:
  - revalidate before attach and every redraw
  - invalidate session on drift

### persistent authorization misuse

- mitigation:
  - separate persistent session contract from one-frame auth
  - consume only at attach

### duplicate Canvas

- mitigation:
  - retained surface wrapper owns exactly one Canvas token
  - fail closed on duplicate acquisition

### duplicate pane

- mitigation:
  - retained surface wrapper owns exactly one pane token

### duplicate lifecycle owner

- mitigation:
  - retained lifecycle wrapper enforces single authoritative owner

### duplicate listeners

- mitigation:
  - listener registrar uses whitelist + callback identity registry

### stale animation-frame callbacks

- mitigation:
  - generation token + single queued handle + cancel-on-detach

### redraw recursion

- mitigation:
  - redraw coalescing + non-reentrant draw guard

### parallel draws

- mitigation:
  - one active draw at a time
  - coalesce follow-up redraw into next scheduled frame

### cleanup after partial attach

- mitigation:
  - rollback boundary after each acquisition step

### cleanup after draw failure

- mitigation:
  - cleanup provider runs deterministic retained cleanup order after draw failure

### frozen browser-object cycles

- mitigation:
  - preserve cycle-safe deep freeze with `WeakSet`
  - freeze only serializable snapshots/translation outputs

### readonly Leaflet position mutation

- mitigation:
  - keep immutable snapshot position separate from mutable runtime copy

### Safari module-cache delivery

- mitigation:
  - explicit versioned module/runtime identity checks for future live phases

### accidental startup activation

- mitigation:
  - forbid startup wiring changes until a later enablement phase

### accidental window exposure

- mitigation:
  - no persistent command exposure during wrapper phases
  - diagnostics remain read-only

## Why this phase is independently reviewable

- it creates only a planning document and planning test
- it introduces no live wrapper implementation
- it introduces no runtime execution change
- it keeps the first real implementation phase sharply bounded to Group A wrappers

## Exact next phase prompt title

`211.64 — Persistent Map, Readiness, and Identity Wrappers`

