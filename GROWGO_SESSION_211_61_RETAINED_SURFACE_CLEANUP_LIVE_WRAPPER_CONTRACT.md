# GrowGo Session 211.61 — Retained Surface and Cleanup Live-Wrapper Contract

Status: PASS

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
- create a disconnected developer-only retained-surface wrapper
- reuse one retained Canvas, one optional pane, and one lifecycle owner across fake redraws
- validate identity before reuse
- release retained ownership in deterministic cleanup order
- stay fully disconnected from the real GrowGo map, DOM, Canvas, listeners, scheduler, renderer, and `window`

Created:
- `client/developer-only-controlled-persistent-atlas-retained-surface-wrapper.mjs`
- `tests/client-developer-only-controlled-persistent-atlas-retained-surface-wrapper.test.mjs`
- `GROWGO_SESSION_211_61_RETAINED_SURFACE_CLEANUP_LIVE_WRAPPER_CONTRACT.md`

Wrapper API:
- `createControlledPersistentAtlasRetainedSurfaceWrapper(...)`
- `acquirePersistentSurface(...)`
- `validatePersistentSurface(...)`
- `reusePersistentSurface(...)`
- `releasePersistentSurface(...)`
- `getPersistentSurfaceWrapperStatus()`

Injected seams only:
- `oneFrameSurfaceProvider`
- `lifecycleOwnerProvider`
- `lifecycleTranslationProvider`
- `paneRemovalProvider`
- `canvasRemovalProvider`
- `listenerCleanupProvider`
- `queuedFrameCancellationProvider`
- `referenceReleaseProvider`
- `identityProvider`

State model:
- `empty`
- `acquiring`
- `retained`
- `validating`
- `ready`
- `releasing`
- `released`
- `failed_closed`

Ownership proof:
- exactly one retained Canvas
- at most one retained pane
- one lifecycle owner
- one surface owner ID
- one lifecycle owner ID
- one bound map identity
- one bound persistent session
- one bound region/package/recipe identity bundle

Reuse proof:
- same Canvas token reused across fake redraws
- same pane token reused when present
- same lifecycle owner token reused
- duplicate acquisition blocked
- no owner replacement while retained

Validation proof:
- wrapper state checked before reuse
- map/session drift rejected
- region/package/recipe drift rejected
- missing Canvas rejected
- duplicate Canvas rejected
- duplicate pane rejected
- lifecycle owner mismatch rejected

Cleanup order:
1. cancel queued frame
2. remove listeners
3. release draw/snapshot references
4. remove Canvas
5. remove owned pane
6. release lifecycle owner
7. clear bound identity refs
8. return `released` when ownership reaches zero

Partial cleanup behavior:
- each cleanup step counted independently
- cleanup failures collected without hiding later cleanup work
- repeated release safely retries unfinished cleanup
- successful retry returns zero ownership

Failure coverage:
- `SURFACE_PROVIDER_UNAVAILABLE`
- `SURFACE_ACQUISITION_FAILED`
- `INVALID_SURFACE_SHAPE`
- `MISSING_CANVAS`
- `DUPLICATE_CANVAS`
- `DUPLICATE_PANE`
- `DUPLICATE_ACQUISITION`
- `LIFECYCLE_OWNER_UNAVAILABLE`
- `LIFECYCLE_OWNER_MISMATCH`
- `MAP_IDENTITY_MISMATCH`
- `SESSION_MISMATCH`
- `REGION_IDENTITY_MISMATCH`
- `RELEASE_ALREADY_IN_PROGRESS`
- `QUEUED_FRAME_CANCELLATION_FAILED`
- `LISTENER_CLEANUP_FAILED`
- `CANVAS_REMOVAL_FAILED`
- `PANE_REMOVAL_FAILED`
- `LIFECYCLE_OWNER_RELEASE_FAILED`
- `REFERENCE_RELEASE_FAILED`
- `CLEANUP_INCOMPLETE`
- `WRAPPER_FAILED_CLOSED`

Diagnostics proof:
- frozen serializable status
- no raw map, Canvas, pane, lifecycle owner, listener, callback, or frame-handle refs exposed
- ownership counts and cleanup counters preserved
- bound identity fields preserved
- canonical safety flags embedded and unchanged

Focused integration proof:
- persistent authorization created
- session authorized
- attach permission consumed
- one retained fake surface acquired
- identity validated
- same retained surface reused across multiple fake redraw-shaped calls
- fake redraw queued through the scheduler contract
- release cancelled queued redraw work
- listener cleanup executed
- Canvas removed
- pane removed
- lifecycle owner released
- references released
- final zero ownership confirmed

Canonical safety flags:
- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Focused test result:
- `node --test tests/client-developer-only-controlled-persistent-atlas-retained-surface-wrapper.test.mjs`
- 33 passed, 0 failed

Suggested commit:
- `feat(atlas): add retained surface cleanup wrapper`

Next phase:
- `211.62 — Persistent Live-Adapter Contract Integration`
