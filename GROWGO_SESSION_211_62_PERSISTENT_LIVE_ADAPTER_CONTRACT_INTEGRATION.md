# GrowGo Session 211.62 — Persistent Live-Adapter Contract Integration

Status: PASS

Branch:
- `feature/atlas-phase-211-6-gated-map-attachment-controller`

Goal:
- compose the persistent authorization contract
- compose the disconnected persistent live adapter
- compose the retained surface cleanup wrapper
- compose the persistent scheduler/listener contract
- keep the persistent controller contract present as the integrated controller component/status surface
- prove the full persistent fake-only lifecycle before any real GrowGo seam is connected

Created:
- `client/developer-only-controlled-persistent-atlas-contract-integration.mjs`
- `tests/client-developer-only-controlled-persistent-atlas-contract-integration.test.mjs`
- `GROWGO_SESSION_211_62_PERSISTENT_LIVE_ADAPTER_CONTRACT_INTEGRATION.md`

Integrated public API:
- `createControlledPersistentAtlasContractIntegration(...)`
- `authorizeIntegratedPersistentAtlas(...)`
- `attachIntegratedPersistentAtlas(...)`
- `requestIntegratedPersistentAtlasRedraw(...)`
- `detachIntegratedPersistentAtlas(...)`
- `revokeIntegratedPersistentAtlas(...)`
- `invalidateIntegratedPersistentAtlas(...)`
- `getIntegratedPersistentAtlasStatus()`

Integrated components:
- persistent authorization contract
- persistent attachment controller contract presence/status surface
- disconnected persistent live adapter
- persistent scheduler/listener contract
- retained surface cleanup wrapper

State model:
- `inactive`
- `authorized`
- `attaching`
- `attached_idle`
- `redraw_queued`
- `drawing`
- `follow_up_pending`
- `detaching`
- `revoked`
- `invalidated`
- `failed_closed`

Authorization proof:
- exact persistent authorization confirmation required
- one-frame authorization confirmation rejected
- one persistent session bound to map/session/region/package/recipe identity
- attach permission consumed exactly once

Attach proof:
- fake map/readiness/identity resolved through the live adapter
- one retained fake Canvas acquired
- at most one retained fake pane acquired
- one lifecycle owner acquired
- exactly `moveend`, `zoomend`, `resize` listeners registered
- one initial redraw queued

Redraw and coalescing proof:
- initial redraw creates one immutable fake snapshot and one fake draw
- event bursts coalesce to one queued frame
- redraw during drawing produces at most one follow-up redraw
- no recursion or parallel draw required for follow-up completion

Surface reuse proof:
- same retained Canvas reused across redraws
- same lifecycle owner reused across redraws
- no duplicate surface reacquisition during redraw flow

Detach and cleanup proof:
- cleanup order enforced:
  1. queued frame cancellation
  2. listener cleanup
  3. reference release
  4. Canvas removal
  5. pane removal
  6. lifecycle-owner release
- zero ownership after successful detach
- repeated detach harmless

Revocation and invalidation proof:
- revoke blocks redraw and triggers cleanup
- identity drift invalidates the integrated session and cleans up
- stale callback after detach is ignored safely

Failure orchestration proof:
- authorization failure covered
- retained surface failure covered
- listener registration failure covered
- scheduler failure covered
- snapshot failure covered
- draw failure covered
- cleanup failures collected separately
- duplicate attach blocked
- redraw after detach blocked

Diagnostics proof:
- frozen serializable integrated status
- no raw map, Canvas, pane, lifecycle owner, listener, callback, frame handle, or mutable snapshot refs exposed
- adapter/browser/global detection flags remain false
- canonical safety flags remain false

Focused test result:
- `node --test tests/client-developer-only-controlled-persistent-atlas-contract-integration.test.mjs`
- 38 passed, 0 failed

Canonical safety flags:
- `runtimeExecutionEnabled = false`
- `mapAttachmentAllowed = false`
- `automaticRendererExecutionAllowed = false`
- `lifecycleExecutionEnabled = false`

Suggested commit:
- `feat(atlas): integrate persistent attachment contracts`

Next phase:
- `211.63 — Persistent Real-Seam Wrapper Implementation Plan`
